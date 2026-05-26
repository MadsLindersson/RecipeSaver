import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { scaleAmount } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ChefHat, Copy, Globe, Pencil, Users } from 'lucide-react';

export const RecipeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentServings, setCurrentServings] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (id) {
        const { data } = await supabase
          .from('recipes')
          .select('*, author:profiles!user_id(username), original_author:profiles!original_user_id(username)')
          .eq('id', id)
          .single();
        
        if (data) {
          const formatted: Recipe = {
            id: data.id,
            title: data.title,
            url: data.url,
            foodType: data.food_type,
            servings: data.servings,
            servingsType: data.servings_type,
            ingredients: data.ingredients,
            steps: data.steps,
            userId: data.user_id,
            authorName: (data.author as any)?.username || 'Unknown Chef',
            originalUserId: data.original_user_id,
            originalAuthorName: (data.original_author as any)?.username || '',
            createdAt: data.created_at
          };
          setRecipe(formatted);
          setCurrentServings(formatted.servings || 1);
        }
      }
      setIsLoading(false);
    };
    fetchRecipe();
  }, [id]);

  const handleSaveToMyRecipes = async () => {
    if (!user || !recipe) return;
    try {
      const { error } = await supabase.from('recipes').insert({
        title: recipe.title,
        url: recipe.url,
        food_type: recipe.foodType,
        servings: recipe.servings,
        servings_type: recipe.servingsType,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        user_id: user.id,
        original_user_id: recipe.originalUserId || recipe.userId,
      });

      if (error) throw error;
      alert('Recipe saved to your account!');
      navigate('/');
    } catch (err) {
      alert('Failed to save recipe.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return <div className="text-center py-12">Recipe not found.</div>;
  }

  const isOwner = user && user.id === recipe.userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        {isOwner && (
          <Link to={`/edit/${recipe.id}`} className="block">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" /> Edit Recipe
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{recipe.title}</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="capitalize">{recipe.foodType}</Badge>
              {recipe.ingredients.filter(i => i.isMain).map(ing => (
                <Badge key={ing.name} variant="outline">{ing.name}</Badge>
              ))}
              <div className="flex items-center gap-1 w-full md:w-auto mt-1 md:mt-0 md:ml-2">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
                <Link to={`/profile/${recipe.userId}`} className="hover:underline font-medium text-sm text-muted-foreground">
                  {recipe.authorName}
                </Link>
              </div>
              {recipe.originalAuthorName && recipe.originalAuthorName !== recipe.authorName && (
                <span className="text-xs text-muted-foreground italic block w-full md:w-auto">
                  (Originally by {recipe.originalAuthorName})
                </span>
              )}
            </div>
          </div>

          {!isOwner && user && (
            <Button onClick={handleSaveToMyRecipes} className="gap-2 w-full md:w-auto">
              <Copy className="h-4 w-4" /> Save Recipe
            </Button>
          )}
        </div>

        {recipe.url && (
          <a 
            href={recipe.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Globe className="h-4 w-4" />
            Original Source
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="space-y-4">
            <CardTitle>Ingredients</CardTitle>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1">
                <Input 
                  type="number" 
                  min="1"
                  value={currentServings}
                  onChange={(e) => setCurrentServings(parseInt(e.target.value) || 1)}
                  className="h-8 w-16 px-2 text-center"
                />
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {recipe.servingsType}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Group ingredients by category */}
              {Array.from(new Set(recipe.ingredients.map(i => i.category))).map(cat => (
                <div key={cat} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">{cat}</h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.filter(i => i.category === cat).map((ing, i) => {
                      const ratio = currentServings / (recipe.servings || 1);
                      const scaledAmount = scaleAmount(ing.amount, ratio);
                      
                      return (
                        <li key={i} className="flex justify-between items-start text-sm text-foreground/80">
                          <span className={ing.isMain ? "font-semibold text-foreground" : ""}>{ing.name}</span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                            {scaledAmount} {ing.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-6">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {i + 1}
                  </div>
                  <p className="text-foreground/90 pt-1 leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
