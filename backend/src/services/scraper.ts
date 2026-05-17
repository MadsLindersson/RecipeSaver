import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface ScrapedRecipe {
  title: string;
  ingredients: ScrapedIngredient[];
  steps: string[];
}

const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'oz', 'lb', 'pinch', 'to taste'];

const parseIngredient = (text: string): ScrapedIngredient => {
  // Regex to match "amount unit name" or "amount name"
  // Handles fractions (1/2), decimals (1.5), and ranges (1-2)
  const amountRegex = /^(\d+[\/\d\.-]*)\s*/;
  const amountMatch = text.match(amountRegex);
  
  let amount = '';
  let remaining = text;

  if (amountMatch) {
    amount = amountMatch[1];
    remaining = text.replace(amountRegex, '').trim();
  }

  // Look for unit at the start of remaining text
  let unit = 'pcs'; // default
  for (const u of UNITS) {
    const unitRegex = new RegExp(`^${u}s?\\b`, 'i');
    if (unitRegex.test(remaining)) {
      unit = u;
      remaining = remaining.replace(unitRegex, '').trim();
      break;
    }
  }

  // Clean up remaining text (e.g. remove leading "of" if present: "1 cup of flour")
  if (remaining.toLowerCase().startsWith('of ')) {
    remaining = remaining.substring(3).trim();
  }

  return {
    name: remaining || text,
    amount: amount || '1',
    unit: unit
  };
};

export const scrapeRecipe = async (url: string): Promise<ScrapedRecipe> => {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || $('title').text().trim();
    
    const rawIngredients: string[] = [];
    const steps: string[] = [];

    // Common selectors for ingredients
    const ingredientSelectors = [
      '.recipe-ingredients li',
      '.recipe-ingredients__list-item',
      '.ingredients-item',
      '[class*="ingredient"] li',
      '.wprm-recipe-ingredient',
      'li[class*="ingredient"]'
    ];

    ingredientSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text && !rawIngredients.includes(text)) {
          rawIngredients.push(text);
        }
      });
    });

    // Common selectors for instructions/steps
    const stepSelectors = [
      '.recipe-directions li',
      '.recipe-steps li',
      '.recipe-method__list-item',
      '.instructions-item',
      '[class*="instruction"] li',
      '[class*="step"] li',
      '.wprm-recipe-instruction'
    ];

    stepSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text && !steps.includes(text)) {
          steps.push(text);
        }
      });
    });

    // Fallbacks
    if (rawIngredients.length === 0) {
       $('h2, h3').each((_, el) => {
         const headerText = $(el).text().toLowerCase();
         if (headerText.includes('ingredient')) {
           $(el).nextAll('ul, ol').first().find('li').each((_, li) => {
             rawIngredients.push($(li).text().trim());
           });
         }
       });
    }

    if (steps.length === 0) {
      $('h2, h3').each((_, el) => {
        const headerText = $(el).text().toLowerCase();
        if (headerText.includes('instruction') || headerText.includes('preparation') || headerText.includes('method')) {
          $(el).nextAll('ul, ol').first().find('li').each((_, li) => {
            steps.push($(li).text().trim());
          });
        }
      });
    }

    // JSON-LD Fallback for more robust extraction
    if (rawIngredients.length === 0 || steps.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          const recipe = Array.isArray(json) ? json.find(j => j['@type'] === 'Recipe') : (json['@graph'] ? json['@graph'].find((j: any) => j['@type'] === 'Recipe') : (json['@type'] === 'Recipe' ? json : null));

          if (recipe) {
            if (rawIngredients.length === 0 && recipe.recipeIngredient) {
              recipe.recipeIngredient.forEach((ing: string) => rawIngredients.push(ing));
            }
            if (steps.length === 0 && recipe.recipeInstructions) {
              const instructions = Array.isArray(recipe.recipeInstructions) 
                ? recipe.recipeInstructions.map((s: any) => typeof s === 'string' ? s : (s.text || s.name)).filter(Boolean)
                : [recipe.recipeInstructions];
              instructions.forEach((s: string) => steps.push(s));
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    }

    const parsedIngredients = rawIngredients
      .filter(i => i.length > 2)
      .map(parseIngredient);

    return {
      title,
      ingredients: parsedIngredients,
      steps: steps.filter(s => s.length > 5)
    };
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('Failed to scrape the recipe from the provided URL.');
  }
};
