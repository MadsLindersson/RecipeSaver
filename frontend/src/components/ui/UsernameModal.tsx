import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { ChefHat, Loader2 } from 'lucide-react';

export const UsernameModal: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: user.id, username }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Username is already taken');
        } else {
          setError(insertError.message);
        }
      } else {
        await refreshProfile();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <ChefHat className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Username</CardTitle>
          <CardDescription>
            Choose a unique chef name to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="e.g. GordonRamsay"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isSubmitting || !username.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Username
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
