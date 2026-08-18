import { GoogleGenerativeAI } from '@google/generative-ai';
import { MenuItem } from '../models/MenuItem.js';
import { Restaurant } from '../models/Restaurant.js';

// Initialize Gemini API SDK using environment variable
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// Helper function for smart fuzzy restaurant matching
const findMatchingRestaurants = (queryStr, allRestaurants) => {
  const q = queryStr.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);

  return allRestaurants.filter((r) => {
    const name = r.name.toLowerCase();
    const city = (r.city || '').toLowerCase();
    const tagline = (r.tagline || '').toLowerCase();
    const address = (r.address || '').toLowerCase();

    // Direct substring or alias match
    if (
      name.includes(q) ||
      q.includes(name) ||
      (q.includes('manit') && (name.includes('manit') || address.includes('manit'))) ||
      (q.includes('canteen') && (name.includes('canteen') || tagline.includes('canteen'))) ||
      (q.includes('sky') && name.includes('sky')) ||
      (q.includes('spice') && name.includes('spice')) ||
      (q.includes('aroma') && name.includes('aroma'))
    ) {
      return true;
    }

    // Token match count
    const matchCount = tokens.filter((t) => name.includes(t) || tagline.includes(t) || city.includes(t)).length;
    return matchCount >= 1;
  });
};

// Helper function to find best fuzzy item match across database
const findMatchingMenuItem = (queryStr, allMenuItems, allRestaurants) => {
  const q = queryStr.toLowerCase();
  
  // 1. Direct substring match
  let item = allMenuItems.find((i) => q.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(q));

  // 2. Multi-keyword fuzzy match (e.g. "paneer" + "roll")
  if (!item) {
    if (q.includes('paneer') && q.includes('roll')) {
      item = allMenuItems.find((i) => i.name.toLowerCase().includes('paneer') && i.name.toLowerCase().includes('roll'));
    } else if (q.includes('pizza')) {
      item = allMenuItems.find((i) => i.name.toLowerCase().includes('pizza'));
    } else if (q.includes('cold brew') || q.includes('coffee')) {
      item = allMenuItems.find((i) => i.name.toLowerCase().includes('coffee') || i.name.toLowerCase().includes('brew'));
    } else if (q.includes('tikka')) {
      item = allMenuItems.find((i) => i.name.toLowerCase().includes('tikka'));
    } else if (q.includes('naan')) {
      item = allMenuItems.find((i) => i.name.toLowerCase().includes('naan'));
    }
  }

  if (item) {
    const venue = allRestaurants.find((r) => r._id.toString() === item.restaurantId?.toString());
    return { item, venue };
  }

  return null;
};

// @desc    Shushi AI Smart Food & Restaurant Assistant Chat
// @route   POST /api/ai/recommend
export const getAiFoodRecommendation = async (req, res) => {
  try {
    const { prompt, restaurantId, dietaryPreference } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Please enter your food preference or question' });
    }

    // Fetch all active restaurants & menu items to provide full database awareness
    const allRestaurants = await Restaurant.find({ isActive: true });
    const allMenuItems = await MenuItem.find({ isAvailable: true });

    // Group menu items by restaurantId
    const menuByRestaurant = {};
    allMenuItems.forEach((item) => {
      const rid = item.restaurantId?.toString();
      if (rid) {
        if (!menuByRestaurant[rid]) menuByRestaurant[rid] = [];
        menuByRestaurant[rid].push(item);
      }
    });

    // Run fuzzy dish and venue search on user prompt
    const fuzzyMatch = findMatchingMenuItem(prompt, allMenuItems, allRestaurants);
    const directVenues = findMatchingRestaurants(prompt, allRestaurants);

    let specificMatchContext = '';
    if (fuzzyMatch) {
      const { item, venue } = fuzzyMatch;
      const halfP = item.halfPrice || item.fullPrice;
      const fullP = item.fullPrice;
      specificMatchContext = `
🎯 DIRECT FUZZY SEARCH MATCH:
User asked about item: "${item.name}" at venue: "${venue?.name || 'Partner Canteen'}"
Exact Half Portion Price: ₹${halfP}
Exact Full Portion Price: ₹${fullP}
Category: ${item.category}, Tags: ${item.tags?.join(', ') || 'Veg'}
Venue Details: ${venue?.name} (Rating: ${venue?.rating}★, City: ${venue?.city})
`;
    }

    let venueContext = '';
    if (restaurantId) {
      const selectedVenue = allRestaurants.find((r) => r._id.toString() === restaurantId);
      const venueItems = menuByRestaurant[restaurantId] || [];
      venueContext = `Currently Viewing Venue: ${selectedVenue?.name || 'Selected Restaurant'}. 
Rating: ${selectedVenue?.rating || 4.5} ★, City: ${selectedVenue?.city || 'Bhopal'}, Cost for two: ₹${selectedVenue?.avgCostForTwo || 800}.
Available Menu Items: ${venueItems.map((m) => `${m.name} (Half Portion: ₹${m.halfPrice || m.fullPrice}, Full Portion: ₹${m.fullPrice}, Tags: ${m.tags?.join(', ') || 'Veg'})`).join('; ')}.`;
    } else {
      venueContext = `Registered Partner Restaurants Database (with Half & Full Portion Prices):
${allRestaurants.map((r) => {
  const items = menuByRestaurant[r._id.toString()] || [];
  return `- Restaurant Name: "${r.name}" (ID: ${r._id}), City: "${r.city}", Rating: ${r.rating}★, Tier: "${r.tier}", Avg Cost for Two: ₹${r.avgCostForTwo}, Address: "${r.address}". Menu Items: ${items.map((i) => `${i.name} [Half Portion: ₹${i.halfPrice || i.fullPrice}, Full Portion: ₹${i.fullPrice}]`).join('; ')}`;
}).join('\n')}`;
    }

    // System Prompt for Shushi AI
    const systemPrompt = `You are "Shushi AI", an intelligent culinary concierge for bookmyorder.online.
Your tone is warm, polite, highly appetizing, concise, and 100% accurate.
User Query: "${prompt}"
User Dietary Preference: "${dietaryPreference || 'Any'}"

${specificMatchContext}

Live Database Context:
${venueContext}

Instructions:
1. If user asks for portion pricing (e.g. half price, full price, paneer roll in manit canteen), use the exact Half Portion Price and Full Portion Price specified in the Direct Search Match or Database Context above. State clearly: e.g. "Half Paneer Roll at MANIT Central College Canteen is ₹70 and Full is ₹120".
2. Match shorthand venue names (e.g., "manit canteen", "sky lounge", "aroma") to their full registered name.
3. Keep the response under 120 words.`;

    let aiReply = '';
    const genAI = getGenAI();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        aiReply = result.response.text();
      } catch (geminiError) {
        console.warn('Gemini API response fallback:', geminiError.message);
      }
    }

    // Guaranteed fallback handler for 100% price accuracy even without Gemini API
    if (!aiReply) {
      if (fuzzyMatch) {
        const { item, venue } = fuzzyMatch;
        const halfP = item.halfPrice || item.fullPrice;
        const fullP = item.fullPrice;
        aiReply = `At ${venue?.name || 'MANIT Central College Canteen'}, ${item.name} is priced at ₹${halfP} for Half portion and ₹${fullP} for Full portion! You can pre-order directly below to skip student queues.`;
      } else if (directVenues.length > 0) {
        const venue = directVenues[0];
        aiReply = `Welcome to ${venue.name}! Rated ${venue.rating}★ in ${venue.city}. Average cost for two is ₹${venue.avgCostForTwo}. Select the venue card below to check live table availability and pre-order food!`;
      } else {
        aiReply = `Here are top recommendations tailored for you! Try MANIT Central College Canteen for quick roll & beverage pre-orders or Sky Lounge Rooftop for fine dining.`;
      }
    }

    // Match recommended restaurants from database to return in response
    let recommendedRestaurants = [];
    if (fuzzyMatch && fuzzyMatch.venue) {
      recommendedRestaurants = [fuzzyMatch.venue];
    } else {
      const lowerCombine = (aiReply + ' ' + prompt).toLowerCase();
      recommendedRestaurants = findMatchingRestaurants(lowerCombine, allRestaurants);
    }

    if (recommendedRestaurants.length === 0) {
      recommendedRestaurants = allRestaurants.slice(0, 2);
    }

    const recommendedDishes = fuzzyMatch ? [fuzzyMatch.item] : allMenuItems.slice(0, 2);

    return res.json({
      success: true,
      reply: aiReply,
      recommendedRestaurants,
      recommendedDishes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
