import { Request, Response } from 'express';
import { scrapeRecipe } from '../services/scraper';

export const scrapeController = async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const data = await scrapeRecipe(url);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
