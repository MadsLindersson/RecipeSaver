## prompt

Use this file as the source of truth on how to make this project. Simple code is better than complex code. Install all that is needed for the project, but only what is listed in the technologies part, if more is needed ask me first with a reason as to why. Make it so i can see and use the frontend without the backend running in the beginning so i can test it and develop on it without going through the full supabase setup, maybe set up an in memory DB that is easy to remove. 

## Tasks

1. Create a frontend folder and backend folder
2. Read through this file to understand the project
3. the backend should be set up as much as possible from your side and then create a .md file with a plan of exacly what i need to do to get the project up and running on suapabase on a free plan hosting plan. 
4. create the project

## Idea

A website for saving recipes easily from the internet. A user can have all their favorite recipes saved using the URL of the page where they found the recipe and a scraper will scrape the page looking for "ingredients" and the how to make it. The page will then prefill all of the inputs with information from the website URL and the user can then edit what they want before saving. A user can also just enter their own recipe and make everything manually. 

## Technologies

- React
- Typescript
- ShadCn
- Eslint
- Prettier
- Supabase

## Features

- The user has a page with all of their saved recipes they can click in and see the list of ingredients and how to make it
- The user can add new recipes by either adding ingredients and steps manually or by copying a URL and a scraper will then fill out ingredients and steps (There will be no uploading of pictures). There should be a mandatory drop down of what type of food it is, like, "dinner" or "breakfast" and it should be mandatory to choose at least one, maximum of 3 of the ingredients as the main ingredient like "Tofu" or "Cauliflower".
- The user adds ingredients one by one clicking on a "+" or "Add ingredient" and that will make a new line of input the user can fill out - same goes with steps
- The user meets a login page as the first thing and can login using a normal email and username (There will be no "create account" this will be created by the developer)
- Recipes are user specific and belongs only to the user that created it, but other users can save the recipe to their own account if they want to and then make edits to their own version if they want
- Users can see other users pages with recipes
- Recipes are shown as cards with the title and then categories/keywords like "Tofu", "Breakfast", "Lunch", "Seitan". So basically showing the title, what type of food it is and the main ingredients, these are chosen when creating the recipe. 

## Design

The design should be taking inspiration from pinterest the website. But without the pictures. 
