import "@supabase/functions-js/edge-runtime.d.ts"
import * as cheerio from "npm:cheerio@1.0.0-rc.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapedIngredient {
  name: string;
  amount: string;
  unit: string;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'oz', 'lb', 'pinch', 'to taste'];

const parseIngredient = (text: string): ScrapedIngredient => {
  // Clean the text: remove checkboxes, bullet points, and weird symbols at the start
  let cleaned = text.trim()
    .replace(/^[▢☐\s•\-\*]+/u, '') // Remove checkboxes and bullet points
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();

  // Regex to match:
  // 1. Amount: numbers, fractions (1/2, ½), ranges (1-2), or decimals (1.5)
  // 2. Unit: optional unit following the amount
  const amountRegex = /^([\d\u00BC-\u00BE\u2150-\u215E\/\.\-\s]+)\s*/i;
  const amountMatch = cleaned.match(amountRegex);
  
  let amount = '';
  let remaining = cleaned;

  if (amountMatch) {
    amount = amountMatch[1].trim();
    remaining = cleaned.replace(amountMatch[0], '').trim();
  }

  let unit = 'pcs'; 
  // Look for unit at the START of the remaining text
  for (const u of UNITS) {
    const unitRegex = new RegExp(`^${u}s?\\b`, 'i');
    if (unitRegex.test(remaining)) {
      unit = u;
      remaining = remaining.replace(unitRegex, '').trim();
      break;
    }
  }

  // Handle "of " suffix (e.g., "200g of blueberries")
  if (remaining.toLowerCase().startsWith('of ')) {
    remaining = remaining.substring(3).trim();
  }

  // If we didn't find an amount at the start, check if it's "1" by default
  // and ensure the name doesn't start with a unit that was missed
  return {
    name: remaining || cleaned,
    amount: amount || '1',
    unit: unit
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
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

    // JSON-LD Fallback
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
          // Ignore
        }
      });
    }

    const parsedIngredients = rawIngredients
      .filter(i => i.length > 2)
      .map(parseIngredient);

    const result = {
      title,
      ingredients: parsedIngredients,
      steps: steps.filter(s => s.length > 5)
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
