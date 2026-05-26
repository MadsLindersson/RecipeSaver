import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, Loader2, Search } from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*');
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold">Chef Directory</h1>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
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

      {users.length > 0 && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No chefs match your search.</p>
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No chefs found.</p>
        </div>
      )}
    </div>
  );
};

