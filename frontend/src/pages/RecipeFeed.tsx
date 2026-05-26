import React, { useEffect, useState } from 'react';
import type { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ChefHat, User as UserIcon, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecipeFeed: React.FC = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (user) {
        const { data } = await supabase
          .from('recipes')
          .select('*, author:profiles!user_id(username)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) {
          // Map database snake_case to frontend camelCase
          const formattedRecipes: Recipe[] = data.map(r => ({
            id: r.id,
            title: r.title,
            url: r.url,
            foodType: r.food_type,
            servings: r.servings,
            servingsType: r.servings_type,
            ingredients: r.ingredients,
            steps: r.steps,
            userId: r.user_id,
            authorName: (r.author as any)?.username || 'Unknown Chef',
            originalUserId: r.original_user_id,
            originalAuthorName: '', // We'll handle this if needed, or just omit for feed
            createdAt: r.created_at
          }));
          setRecipes(formattedRecipes);
        }
      }
      setIsLoading(false);
    };
    fetchRecipes();
  }, [user]);

  const filteredRecipes = recipes.filter(recipe => {
    const query = searchQuery.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(query) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query)) ||
      recipe.foodType.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My Recipes</h1>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRecipes.map((recipe) => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="block h-full">
            <Card className="h-[150px] flex flex-col hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
              <div className="h-1 w-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0" />
              <CardHeader className="p-3 pb-1 flex-grow">
                <CardTitle className="text-base leading-tight line-clamp-2 min-h-[2.5rem]">
                  {recipe.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0 h-4">
                    {recipe.foodType}
                  </Badge>
                  {recipe.ingredients.filter(i => i.isMain).map((ing) => (
                    <Badge key={ing.name} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {ing.name}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex-shrink-0 mt-auto">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ChefHat className="h-3 w-3" />
                    {recipe.authorName}
                  </p>
                  {recipe.originalAuthorName && recipe.originalAuthorName !== recipe.authorName && (
                    <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
                      <UserIcon className="h-2.5 w-2.5" />
                      Original: {recipe.originalAuthorName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recipes.length > 0 && filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recipes match your search.</p>
        </div>
      )}

      {recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recipes found. Add your first one!</p>
        </div>
      )}
    </div>
  );
};

