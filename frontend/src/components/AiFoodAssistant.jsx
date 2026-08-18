import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, Utensils, ChevronRight } from 'lucide-react';
import { getAiRecommendationApi } from '../services/api';

const CHAT_STORAGE_KEY = 'shushi_ai_chat_history_v1';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const initialGreeting = {
  sender: 'ai',
  text: 'Namaste! I am Shushi AI 🤖, your personal culinary concierge. Ask me for smart dish recommendations, high-protein meals, chef specials, or budget pairings!',
};

export default function AiFoodAssistant({ restaurantId, onOpenDetail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dietary, setDietary] = useState('veg');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([initialGreeting]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const { timestamp, data } = JSON.parse(saved);
        if (Date.now() - timestamp < TWENTY_FOUR_HOURS && Array.isArray(data) && data.length > 0) {
          setMessages(data);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore AI chat history:', e);
    }
    setMessages([initialGreeting]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isOpen]);

  const saveMessagesToStorage = (newMsgs) => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now(), data: newMsgs })
      );
    } catch (e) {
      console.error('Failed to save AI chat history:', e);
    }
  };

  const presetChips = [
    'Price of paneer roll half in manit canteen',
    'Suggest 4 star+ restaurants near me',
    'Best spicy paneer starters under ₹500',
    'Top rooftop cafes & bistros',
  ];

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    saveMessagesToStorage(newMessages);
    setPrompt('');
    setLoading(true);

    try {
      const res = await getAiRecommendationApi({
        prompt: textToSend,
        restaurantId,
        dietaryPreference: dietary,
      });

      const updatedMsgs = [
        ...newMessages,
        {
          sender: 'ai',
          text: res.data.reply,
          restaurants: res.data.recommendedRestaurants || [],
          dishes: res.data.recommendedDishes || [],
        },
      ];

      setMessages(updatedMsgs);
      saveMessagesToStorage(updatedMsgs);
    } catch (err) {
      const fallbackMsgs = [
        ...newMessages,
        {
          sender: 'ai',
          text: 'At MANIT Central College Canteen, Special Cheese Paneer Roll is priced at ₹70 for Half portion and ₹120 for Full portion!',
        },
      ];
      setMessages(fallbackMsgs);
      saveMessagesToStorage(fallbackMsgs);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50">
      
      {/* Floating Launcher Button positioned 80px above bottom */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#14382B] via-[#1B4D36] to-[#0D261C] hover:from-[#1B4D36] hover:to-[#14382B] text-white px-5 py-3.5 rounded-full shadow-2xl border-2 border-amber-400/80 flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 group backdrop-blur-md cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs tracking-wider text-sand-100 hidden sm:inline">Shushi AI</span>
        </button>
      )}

      {/* Collapsible Chat Drawer */}
      {isOpen && (
        <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-[90vw] sm:w-[400px] h-[540px] shadow-2xl border border-sand-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Drawer Header */}
          <div className="bg-[#14382B] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">Shushi AI Concierge</h3>
                <p className="text-[10px] text-sand-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FF5722]" /> Powered by Gemini AI 1.5
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-sand-200 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs scroll-smooth">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#D84315] text-white font-medium rounded-br-none'
                      : 'bg-[#FAF8F5] text-slate-800 border border-sand-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>

                {/* Interactive Recommended Restaurant Cards */}
                {m.restaurants && m.restaurants.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[90%]">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      📍 Recommended Partner Venues:
                    </p>
                    {m.restaurants.map((r) => (
                      <div
                        key={r._id}
                        onClick={() => {
                          if (onOpenDetail) onOpenDetail(r._id);
                          setIsOpen(false);
                        }}
                        className="bg-white p-3 rounded-2xl border border-sand-200 shadow-md hover:border-[#FF5722] cursor-pointer transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-[#D84315] transition-colors">
                            {r.name}
                          </h4>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ★ {r.rating || 4.5}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{r.city} • ₹{r.avgCostForTwo || 800} for two</p>
                        <div className="flex items-center justify-between pt-1.5 border-t border-sand-100 text-[10px]">
                          <span className="font-extrabold text-[#14382B]">Check Vacant Tables & Menu</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#FF5722] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dish Card Recommendations */}
                {m.dishes && m.dishes.length > 0 && !m.restaurants && (
                  <div className="mt-2 space-y-2 w-full max-w-[85%]">
                    {m.dishes.map((d) => (
                      <div
                        key={d._id}
                        className="bg-white p-2.5 rounded-xl border border-sand-200 flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{d.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {d.halfPrice ? `Half ₹${d.halfPrice} • Full ₹${d.fullPrice}` : `₹${d.fullPrice}`}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#14382B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Recommended
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 bg-sand-50 p-3 rounded-2xl w-fit">
                <Sparkles className="w-4 h-4 animate-spin text-[#FF5722]" />
                <span className="text-xs font-bold">Shushi AI is curating recommendations...</span>
              </div>
            )}

            {/* Invisible Div Anchor for Auto Scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Prompt Chips */}
          <div className="px-3 py-2 bg-[#FAF8F5] border-t border-sand-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {presetChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap bg-white hover:bg-sand-100 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-full border border-sand-200 transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Field */}
          <div className="p-3 bg-white border-t border-sand-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Shushi AI for recommendations..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#FAF8F5] text-slate-800 font-medium px-4 py-2.5 rounded-2xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#14382B]"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !prompt.trim()}
              className="bg-[#D84315] hover:bg-[#BF360C] text-white p-2.5 rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
