import { GoogleGenerativeAI } from '@google/generative-ai';
import { MenuItem } from '../models/MenuItem.js';
import { Restaurant } from '../models/Restaurant.js';

// Initialize Gemini API SDK using environment variable
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// @desc    Gemini AI Smart Food Assistant Chat & Recommendation
// @route   POST /api/ai/recommend
export const getAiFoodRecommendation = async (req, res) => {
  try {
    const { prompt, restaurantId, dietaryPreference } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Please enter your food preference or question' });
    }

    // Fetch menu context if restaurant ID is provided
    let menuContext = '';
    let availableDishes = [];
    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      const menuItems = await MenuItem.find({ restaurantId, isAvailable: true });
      availableDishes = menuItems;
      menuContext = `Restaurant: ${restaurant?.name || 'Venue'}. 
Available Menu Items: ${menuItems.map((m) => `${m.name} (Half ₹${m.halfPrice || m.fullPrice}, Full ₹${m.fullPrice}, Tags: ${m.tags?.join(', ') || 'Veg'})`).join('; ')}.`;
    } else {
      const sampleItems = await MenuItem.find({ isAvailable: true }).limit(10);
      availableDishes = sampleItems;
      menuContext = `Top Popular Dishes across bookmyorder: ${sampleItems.map((m) => `${m.name} (Full ₹${m.fullPrice})`).join(', ')}.`;
    }

    // System prompt for bookmyorder AI Assistant
    const systemPrompt = `You are "bookmyorder AI", a premier AI Culinary & Food Assistant for bookmyorder.online. 
Your tone is warm, polite, highly appetizing, concise, and helpful.
User Query: "${prompt}"
User Dietary Preference: "${dietaryPreference || 'Any'}"
${menuContext}

Instructions:
1. Provide a concise, appetizing 2-3 sentence answer to the diner's request.
2. Recommend 2-3 specific dishes from the available menu context that best fit their tastes or requirements.
3. Suggest a drink or dessert pairing.
4. Keep response under 150 words. Format with clean bullet points.`;

    const genAI = getGenAI();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const aiResponse = result.response.text();

        return res.json({
          success: true,
          reply: aiResponse,
          recommendedDishes: availableDishes.slice(0, 3),
        });
      } catch (geminiError) {
        console.warn('Gemini API response fallback:', geminiError.message);
      }
    }

    // Smart fallback recommendation engine
    const fallbackReply = `Here are top recommendations tailored for you! Try our signature Paneer Butter Masala paired with Garlic Butter Naan for a satisfying feast, or enjoy our fresh Exotic Veg Pasta with cold Peach Iced Tea.`;
    
    return res.json({
      success: true,
      reply: fallbackReply,
      recommendedDishes: availableDishes.slice(0, 3),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
