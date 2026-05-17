import { Router } from 'express';
import { scrapeController } from '../controllers/recipeController';

const router = Router();

router.post('/scrape', scrapeController);

export default router;
