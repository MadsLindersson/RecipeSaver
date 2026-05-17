import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, Loader2, ArrowRight } from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (data) {
          setUsers(data.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email
          })));
        }
      } catch (err) {
        console.error('Fetch users error:', err);
      }
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Chef Directory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Link key={user.id} to={`/profile/${user.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div>
                  <CardTitle>{user.username}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <ChefHat className="h-3 w-3" />
                  View Recipes
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
