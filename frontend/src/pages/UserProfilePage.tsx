import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Recipe, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ChefHat, User as UserIcon, Pencil, Check, X } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, refreshProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUserData = async () => {
    if (userId) {
      try {
        const [userRes, recipeRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('recipes')
            .select('*, author:profiles!user_id(username), original_author:profiles!original_user_id(username)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        ]);

        if (userRes.data) {
          setUserProfile({
            id: userRes.data.id,
            username: userRes.data.username,
            email: userRes.data.email
          });
          setNewUsername(userRes.data.username);
        }

        if (recipeRes.data) {
          const formatted: Recipe[] = recipeRes.data.map(r => ({
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
            originalAuthorName: (r.original_author as any)?.username || '',
            createdAt: r.created_at
          }));
          setRecipes(formatted);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === userProfile?.username) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user?.id);

      if (error) throw error;
      
      await Promise.all([
        refreshProfile(),
        fetchUserData()
      ]);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update username');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return <div className="text-center py-12">User not found.</div>;
  }

  const isOwner = user?.id === userId;

  return (
    <div className="space-y-8">
      <div className="border-b pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 max-w-md">
                <Input 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="text-2xl font-bold h-12"
                  placeholder="Enter new username"
                  autoFocus
                />
                <Button 
                  size="icon" 
                  onClick={handleUpdateUsername}
                  disabled={isUpdating || !newUsername.trim()}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(userProfile.username);
                  }}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold">{userProfile.username}'s Kitchen</h1>
                {isOwner && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-1">{recipes.length} saved recipes</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Recipes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="block h-full">
              <Card className="h-[200px] flex flex-col hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                <div className="h-2 w-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0" />
                <CardHeader className="p-4 pb-2 flex-grow">
                  <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3rem]">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0">
                      {recipe.foodType}
                    </Badge>
                    {recipe.ingredients.filter(i => i.isMain).map((ing) => (
                      <Badge key={ing.name} variant="outline" className="text-[10px] px-1.5 py-0">
                        {ing.name}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-shrink-0">
                  <div className="flex flex-col gap-1 mt-auto">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ChefHat className="h-3 w-3" />
                      {recipe.authorName}
                    </p>
                    {recipe.originalAuthorName && recipe.originalAuthorName !== recipe.authorName && (
                      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
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

        {recipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This user hasn't saved any recipes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
