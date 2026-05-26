# Supabase Setup Guide for RecipeSaver (Serverless Edition)

This guide outlines how to use Supabase as your **entire backend**, replacing both the Express server and the Mock Database.

## 1. Project Configuration
1. Create a new project at [Supabase](https://supabase.com/).
2. Save your `Project URL` and `Anon Key` (found in Settings > API).

## 2. Authentication
1. Go to **Authentication > Providers**.
2. Ensure **Email** is enabled.
3. Disable **Confirm Email** for easier local development.
4. Users will sign in with **Username (Email)** and **Password** as per our updated login page.

## 3. Database Schema

Run this in the Supabase **SQL Editor** to create the tables matching our current `Recipe` and `Ingredient` types:

```sql
-- Create profiles table (linked to Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- Create recipes table
create table recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text,
  food_type text not null, -- 'dinner', 'breakfast', etc.
  servings int default 1 not null,
  servings_type text default 'servings' not null, -- 'servings' or 'pieces'
  ingredients jsonb not null, -- Stores array of Ingredient objects
  steps text[] not null, -- Array of strings
  user_id uuid references auth.users not null,
  original_user_id uuid references auth.users -- For saved recipes
);

-- MIGRATION: If you already have the tables, run this to update:
/*
alter table recipes drop column author_name;
alter table recipes drop column original_author_name;
alter table recipes add constraint recipes_original_user_id_fkey 
  foreign key (original_user_id) references auth.users(id);
*/

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table recipes enable row level security;

-- Profiles policies
create policy "Profiles are public." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Recipes policies
create policy "Recipes are public." on recipes for select using (true);
create policy "Users can insert own recipes." on recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes." on recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes." on recipes for delete using (auth.uid() = user_id);
```

## 4. Recipe Scraper (Supabase Edge Function)

Since we are removing the Express backend, the scraper logic lives in a **Supabase Edge Function** within the `backend/` folder.

1. Navigate to backend: `cd backend`
2. Install Supabase CLI (if not present): `npm install supabase --save-dev`
3. The scraper is located at `backend/supabase/functions/scrape/index.ts`.
4. Deploy: `npx supabase functions deploy scrape`

## 5. Frontend Integration
Once Supabase is ready, follow these steps in the `frontend` folder:

1. **Install SDK**: `npm install @supabase/supabase-js`
2. **Setup Environment**: Update `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Update AuthContext**: Replace local state login with `supabase.auth.signInWithPassword()`.
4. **Update Services**: Point all `mockDb` calls directly to `supabase.from('recipes')...`.
5. **Scraper**: Update `AddRecipePage.tsx` to call the Edge Function:
   ```typescript
   const { data, error } = await supabase.functions.invoke('scrape', {
     body: { url: url }
   });
   ```

## 6. Deprecating the Backend Folder
Once the Edge Function is deployed and the Frontend is connected, the entire `backend/` folder can be deleted as it is no longer required.
