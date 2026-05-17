import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/services/mockDb';
import type { FoodType, Recipe, Ingredient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, ArrowLeft, Save } from 'lucide-react';

const FOOD_TYPES: FoodType[] = ['dinner', 'breakfast', 'lunch', 'dessert', 'snack', 'other'];
const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'oz', 'lb', 'pinch', 'to taste'];
const CATEGORIES = ['Condiment', 'Vegetable', 'Fruit', 'Meat', 'Dairy', 'Grain', 'Spice', 'Other', 'Optional'];

export const EditRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [foodType, setFoodType] = useState<FoodType>('dinner');
  const [servings, setServings] = useState(1);
  const [servingsType, setServingsType] = useState<'servings' | 'pieces'>('servings');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [url, setUrl] = useState<string | undefined>('');

  useEffect(() => {
    const fetchRecipe = async () => {
      if (id) {
        const data = await mockDb.getRecipe(id);
        if (data) {
          if (user && data.userId !== user.id) {
             alert("You can only edit your own recipes.");
             navigate('/');
             return;
          }
          setTitle(data.title);
          setFoodType(data.foodType);
          setServings(data.servings || 1);
          setServingsType(data.servingsType || 'servings');
          setIngredients(data.ingredients);
          setSteps(data.steps);
          setUrl(data.url);
        }
      }
      setIsLoading(false);
    };
    fetchRecipe();
  }, [id, user, navigate]);

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
    if (!user || !id) return;

    const mainCount = ingredients.filter(i => i.isMain).length;
    if (mainCount < 1 || mainCount > 3) {
      alert('Please tick between 1 and 3 ingredients as "Main Ingredients".');
      return;
    }

    setIsSaving(true);
    try {
      await mockDb.updateRecipe(id, {
        title,
        url: url || undefined,
        foodType,
        servings,
        servingsType,
        ingredients: ingredients.filter(i => i.name.trim() !== ''),
        steps: steps.filter(s => s.trim() !== ''),
      });
      navigate(`/recipe/${id}`);
    } catch (err) {
      alert('Failed to update recipe.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Recipe</h1>
      </div>

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
              />
            </div>
            
            <div className="grid gap-2 max-w-xs">
              <Label>Food Type</Label>
              <Select value={foodType} onValueChange={(v) => setFoodType(v as FoodType)}>
                <SelectTrigger>
                  <SelectValue />
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
                    id={`main-edit-${i}`}
                    checked={ing.isMain} 
                    onCheckedChange={(checked) => updateIngredient(i, 'isMain', !!checked)}
                  />
                  <Label htmlFor={`main-edit-${i}`} className="md:hidden text-xs font-medium cursor-pointer">Main Ingredient</Label>
                </div>
                <div className="col-span-5">
                  <Input 
                    value={ing.name} 
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    className="md:bg-transparent"
                  />
                </div>
                <div className="col-span-1">
                  <Input 
                    value={ing.amount} 
                    onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
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
          <Button type="submit" disabled={isSaving} className="min-w-[120px] gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
