import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import type { Recipe, User } from '@/types';
import { LogOut, Plus, User as UserIcon, ChefHat, Search, Users, Menu, X } from 'lucide-react';

interface SearchResultsProps {
  recipeResults: Recipe[];
  userResults: User[];
  searchQuery: string;
  onResultClick: () => void;
  isMobile?: boolean;
}

const SearchResults = ({ recipeResults, userResults, searchQuery, onResultClick, isMobile = false }: SearchResultsProps) => (
  <div className={`${
    isMobile 
      ? "w-full bg-background h-full overflow-y-auto" 
      : "absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto z-50"
  }`}>
    {searchQuery.length <= 1 && isMobile && (
      <div className="p-12 text-center text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm font-medium">Search for recipes, ingredients or chefs</p>
        <p className="text-xs mt-1">Start typing to see results...</p>
      </div>
    )}

    {recipeResults.length > 0 && (
      <>
        <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
          Recipes
        </div>
        {recipeResults.map(result => (
          <Link
            key={result.id}
            to={`/recipe/${result.id}`}
            onClick={onResultClick}
            className="block p-3 hover:bg-accent border-b last:border-0"
          >
            <p className="font-medium text-sm">{result.title}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {result.foodType} • {result.authorName}
            </p>
          </Link>
        ))}
      </>
    )}
    
    {userResults.length > 0 && (
      <>
        <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-t first:border-t-0">
          Chefs
        </div>
        {userResults.map(result => (
          <Link
            key={result.id}
            to={`/profile/${result.id}`}
            onClick={onResultClick}
            className="flex items-center gap-3 p-3 hover:bg-accent border-b last:border-0"
          >
            <div className="bg-primary/10 p-1.5 rounded-full">
              <UserIcon className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{result.username}</p>
              <p className="text-[10px] text-muted-foreground">
                {result.email}
              </p>
            </div>
          </Link>
        ))}
      </>
    )}
    
    {searchQuery.length > 1 && recipeResults.length === 0 && userResults.length === 0 && (
      <div className="p-12 text-center text-muted-foreground">
        <p className="text-sm">No results found for "{searchQuery}"</p>
      </div>
    )}
  </div>
);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const [recipeRes, userRes] = await Promise.all([
            supabase
              .from('recipes')
              .select('*')
              .ilike('title', `%${searchQuery}%`),
            supabase
              .from('profiles')
              .select('*')
              .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          ]);

          if (recipeRes.data) {
            setRecipeResults(recipeRes.data.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              foodType: r.food_type,
              servings: r.servings,
              servingsType: r.servings_type,
              ingredients: r.ingredients,
              steps: r.steps,
              userId: r.user_id,
              authorName: r.author_name,
              createdAt: r.created_at
            })));
          }

          if (userRes.data) {
            setUserResults(userRes.data.map(u => ({
              id: u.id,
              username: u.username,
              email: u.email
            })));
          }
          setIsSearchOpen(true);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setRecipeResults([]);
        setUserResults([]);
        setIsSearchOpen(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen || isMobileSearchActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isMobileSearchActive]);

  const closeOverlays = () => {
    setIsSearchOpen(false);
    setIsMobileSearchActive(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary flex-shrink-0">
            <ChefHat className="h-6 w-6" />
            <span>RecipeSaver</span>
          </Link>

          {user && (
            <>
              {/* Desktop Search */}
              <div className="hidden md:block flex-grow max-w-md relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes, ingredients or chefs..."
                    className="pl-9 bg-secondary/50 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length > 1 && setIsSearchOpen(true)}
                  />
                </div>

                {isSearchOpen && (recipeResults.length > 0 || userResults.length > 0) && (
                  <SearchResults 
                    recipeResults={recipeResults} 
                    userResults={userResults} 
                    searchQuery={searchQuery}
                    onResultClick={closeOverlays}
                  />
                )}
              </div>

              {/* Desktop Nav Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/users">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span>Chefs</span>
                  </Button>
                </Link>
                <Link to="/add">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Recipe</span>
                  </Button>
                </Link>
                <Link to={`/profile/${user.id}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{user.username}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>

              {/* Mobile Actions Toggle */}
              <div className="flex md:hidden items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileSearchActive(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isMobileSearchActive && (
        <div className="fixed inset-0 bg-background z-[60] flex flex-col md:hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search recipes, ingredients or chefs..."
                className="pl-9 bg-secondary/50 border-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" onClick={() => {
              setIsMobileSearchActive(false);
              setSearchQuery('');
            }}>
              Cancel
            </Button>
          </div>
          <div className="flex-grow overflow-hidden bg-background">
            <SearchResults 
              recipeResults={recipeResults} 
              userResults={userResults} 
              searchQuery={searchQuery}
              onResultClick={closeOverlays}
              isMobile 
            />
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-[280px] bg-card z-[60] md:hidden shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-muted/50">
              <div className="flex items-center gap-2 font-bold text-primary">
                <ChefHat className="h-5 w-5" />
                <span>Menu</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex flex-col p-4 space-y-3 flex-grow overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Explore
              </div>
              <Link 
                to="/users" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Chefs</span>
              </Link>
              <Link 
                to="/add" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium">Add Recipe</span>
              </Link>
              
              <div className="px-2 py-1 pt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Account
              </div>
              <Link 
                to={`/profile/${user?.id}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <UserIcon className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">My Profile</span>
                  <span className="text-[10px] text-muted-foreground">{user?.username}</span>
                </div>
              </Link>
            </div>

            <div className="p-4 border-t bg-muted/50">
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-3 h-11" 
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
