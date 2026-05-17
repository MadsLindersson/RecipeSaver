import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/services/mockDb';
import type { FoodType, Ingredient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Globe, Loader2, ArrowLeft } from 'lucide-react';

const FOOD_TYPES: FoodType[] = ['dinner', 'breakfast', 'lunch', 'dessert', 'snack', 'other'];
const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'oz', 'lb', 'pinch', 'to taste'];
const CATEGORIES = ['Condiment', 'Vegetable', 'Fruit', 'Meat', 'Dairy', 'Grain', 'Spice', 'Other', 'Optional'];

export const AddRecipePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [url, setUrl] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [foodType, setFoodType] = useState<FoodType>('dinner');
  const [servings, setServings] = useState(1);
  const [servingsType, setServingsType] = useState<'servings' | 'pieces'>('servings');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: 'pcs', category: 'Other', isMain: false }
  ]);
  const [steps, setSteps] = useState<string[]>(['']);

  const handleScrape = async () => {
    if (!url) return;
    setIsScraping(true);
    try {
      const response = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) throw new Error('Failed to scrape');
      
      const data = await response.json();
      setTitle(data.title || '');
      
      if (data.ingredients && data.ingredients.length > 0) {
        setIngredients(data.ingredients.map((ing: any) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: 'Other',
          isMain: false
        })));
      }
      
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
      }
    } catch (err) {
      alert('Could not scrape recipe. The backend might not be running or the website is protected.');
    } finally {
      setIsScraping(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'pcs', category: 'Other', isMain: false }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const next = [...steps];
    next[index] = value;
    setSteps(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const mainCount = ingredients.filter(i => i.isMain).length;
    if (mainCount < 1 || mainCount > 3) {
      alert('Please tick between 1 and 3 ingredients as "Main Ingredients".');
      return;
    }

    setIsSaving(true);
    try {
      await mockDb.saveRecipe({
        title,
        url: url || undefined,
        foodType,
        servings,
        servingsType,
        ingredients: ingredients.filter(i => i.name.trim() !== ''),
        steps: steps.filter(s => s.trim() !== ''),
        userId: user.id,
        authorName: user.username,
      });
      navigate('/');
    } catch (err) {
      alert('Failed to save recipe.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Recipe</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Import from URL
          </CardTitle>
          <CardDescription>
            Paste a recipe URL and we'll try to extract the details for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input 
            placeholder="https://example.com/recipe" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleScrape} disabled={isScraping || !url} className="gap-2">
            {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Fetch recipe
          </Button>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Recipe Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="Grandma's Secret Lasagna"
              />
            </div>
            
            <div className="grid gap-2 max-w-xs">
              <Label>Food Type</Label>
              <Select value={foodType} onValueChange={(v) => setFoodType(v as FoodType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <div className="grid gap-2">
                <Label htmlFor="servings">Servings / Pieces</Label>
                <Input 
                  id="servings" 
                  type="number" 
                  min="1"
                  value={servings} 
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={servingsType} onValueChange={(v) => setServingsType(v as 'servings' | 'pieces')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servings">Servings</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ingredients
              <span className="text-xs font-normal text-muted-foreground">Tick 1-3 as main ingredients</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-xs font-semibold text-muted-foreground">
              <div className="col-span-1 text-center">Main</div>
              <div className="col-span-5">Name</div>
              <div className="col-span-1">Amt</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1"></div>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="relative grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center border p-3 md:border-none md:p-0 rounded-lg">
                <div className="col-span-1 flex justify-start items-center gap-2 md:justify-center">
                  <Checkbox 
                    id={`main-${i}`}
                    checked={ing.isMain} 
                    onCheckedChange={(checked) => updateIngredient(i, 'isMain', !!checked)}
                  />
                  <Label htmlFor={`main-${i}`} className="md:hidden text-xs font-medium cursor-pointer">Main Ingredient</Label>
                </div>
                <div className="col-span-5">
                  <Input 
                    value={ing.name} 
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingredient name"
                    className="md:bg-transparent"
                  />
                </div>
                <div className="col-span-1">
                  <Input 
                    value={ing.amount} 
                    onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="col-span-2">
                  <Select value={ing.unit} onValueChange={(v) => updateIngredient(i, 'unit', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit || '(none)'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Select value={ing.category} onValueChange={(v) => updateIngredient(i, 'category', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="absolute top-2 right-2 md:static md:col-span-1 md:flex md:justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-2">
              <Plus className="h-3 w-3" /> Add Ingredient
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <div className="bg-secondary rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {i + 1}
                </div>
                <Textarea 
                  value={step} 
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder="What to do next..."
                  autoResize
                  className="min-h-[40px] py-2"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(i)} className="flex-shrink-0 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-2">
              <Plus className="h-3 w-3" /> Add Step
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Recipe'}
          </Button>
        </div>
      </form>
    </div>
  );
};
