import express from 'express';
import { getAiFoodRecommendation } from '../controllers/aiController.js';

const router = express.Router();

// AI Assistant Endpoint
router.post('/recommend', getAiFoodRecommendation);

export default router;
