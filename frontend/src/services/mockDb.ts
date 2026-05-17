import type { Recipe, User, Ingredient } from '../types';

const USERS: (User & { password: string })[] = [
  { id: '1', username: 'chef_mads', email: 'mads@example.com', password: 'password123' },
  { id: '2', username: 'recipe_hunter', email: 'hunter@example.com', password: 'password456' },
];

let RECIPES: Recipe[] = [
  {
    id: '101',
    title: 'Vegan Tofu Scramble',
    foodType: 'breakfast',
    servings: 2,
    servingsType: 'servings',
    ingredients: [
      { name: 'extra firm tofu', amount: '1', unit: 'block', category: 'Vegetable', isMain: true },
      { name: 'turmeric', amount: '1/2', unit: 'tsp', category: 'Condiment', isMain: false },
      { name: 'nutritional yeast', amount: '1', unit: 'tbsp', category: 'Condiment', isMain: false },
      { name: 'Salt', amount: 'to taste', unit: '', category: 'Condiment', isMain: false },
    ],
    steps: ['Crumble tofu into a pan.', 'Add spices and cook for 5-7 minutes.', 'Serve with toast.'],
    userId: '1',
    authorName: 'chef_mads',
    createdAt: new Date().toISOString(),
  },
  {
    id: '102',
    title: 'Roasted Cauliflower Tacos',
    foodType: 'dinner',
    servings: 4,
    servingsType: 'pieces',
    ingredients: [
      { name: 'cauliflower', amount: '1', unit: 'head', category: 'Vegetable', isMain: true },
      { name: 'cumin', amount: '1', unit: 'tsp', category: 'Condiment', isMain: false },
      { name: 'Corn tortillas', amount: '4', unit: 'pcs', category: 'Other', isMain: false },
      { name: 'Avocado', amount: '1', unit: 'pcs', category: 'Vegetable', isMain: false },
    ],
    steps: ['Chop cauliflower and toss with oil and cumin.', 'Roast at 200C for 25 mins.', 'Assemble tacos.'],
    userId: '2',
    authorName: 'recipe_hunter',
    createdAt: new Date().toISOString(),
  },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDb = {
  async login(username: string, password: string): Promise<User | null> {
    await sleep(500);
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  async getRecipes(): Promise<Recipe[]> {
    await sleep(300);
    return [...RECIPES].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRecipesByUser(userId: string): Promise<Recipe[]> {
    await sleep(300);
    return RECIPES.filter(r => r.userId === userId);
  },

  async getRecipe(id: string): Promise<Recipe | null> {
    await sleep(200);
    return RECIPES.find(r => r.id === id) || null;
  },

  async saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    await sleep(800);
    const newRecipe: Recipe = {
      ...recipe,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    RECIPES.push(newRecipe);
    return newRecipe;
  },

  async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe | null> {
    await sleep(500);
    const index = RECIPES.findIndex(r => r.id === id);
    if (index === -1) return null;
    RECIPES[index] = { ...RECIPES[index], ...recipeData };
    return RECIPES[index];
  },

  async deleteRecipe(id: string): Promise<void> {
    await sleep(400);
    RECIPES = RECIPES.filter(r => r.id !== id);
  },

  async getUser(userId: string): Promise<User | null> {
    await sleep(200);
    const user = USERS.find(u => u.id === userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  async getUsers(): Promise<User[]> {
    await sleep(300);
    return USERS.map(({ password: _, ...u }) => u);
  },

  async searchRecipes(query: string): Promise<Recipe[]> {
    await sleep(200);
    const q = query.toLowerCase();
    return RECIPES.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.ingredients.some(i => i.name.toLowerCase().includes(q))
    );
  },

  async searchUsers(query: string): Promise<User[]> {
    await sleep(200);
    const q = query.toLowerCase();
    return USERS.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  }
};
