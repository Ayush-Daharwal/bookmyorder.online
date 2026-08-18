import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Utensils, MessageSquare } from 'lucide-react';
import { getAiRecommendationApi } from '../services/api';

export default function AiFoodAssistant({ restaurantId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dietary, setDietary] = useState('veg');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am Shushi AI 🤖, your personal culinary concierge. Ask me for smart dish recommendations, high-protein meals, chef specials, or budget pairings!',
    },
  ]);

  const presetChips = [
    'Suggest high protein dinner',
    'Best spicy paneer starters',
    'Budget meal for 2 under ₹500',
    'Refreshing cold beverages',
  ];

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setPrompt('');
    setLoading(true);

    try {
      const res = await getAiRecommendationApi({
        prompt: textToSend,
        restaurantId,
        dietaryPreference: dietary,
      });

      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: res.data.reply,
          dishes: res.data.recommendedDishes || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: 'I recommend our signature Paneer Butter Masala paired with Garlic Butter Naan and Hazelnut Cold Brew!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Launcher Button with Luxury Style */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#14382B] via-[#1B4D36] to-[#0D261C] hover:from-[#1B4D36] hover:to-[#14382B] text-white px-5 py-3.5 rounded-full shadow-2xl border-2 border-amber-400/80 flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 group backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs tracking-wider text-sand-100 hidden sm:inline">Shushi AI</span>
        </button>
      )}

      {/* Collapsible Chat Drawer */}
      {isOpen && (
        <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-[90vw] sm:w-[400px] h-[520px] shadow-2xl border border-sand-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
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
              className="p-1.5 text-sand-200 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#D84315] text-white font-medium rounded-br-none'
                      : 'bg-[#FAF8F5] text-slate-800 border border-sand-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>

                {/* Dish Card Recommendations */}
                {m.dishes && m.dishes.length > 0 && (
                  <div className="mt-2 space-y-2 w-full">
                    {m.dishes.map((d) => (
                      <div
                        key={d._id}
                        className="bg-white p-2.5 rounded-xl border border-sand-200 flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{d.name}</p>
                          <p className="text-[10px] text-slate-500">₹{d.fullPrice}</p>
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
              <div className="flex items-center gap-2 text-slate-400 font-bold italic">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#14382B] border-t-transparent" />
                Thinking dish recommendations...
              </div>
            )}
          </div>

          {/* Preset Prompt Chips */}
          <div className="px-3 py-2 bg-[#FAF8F5] border-t border-sand-200 flex gap-1.5 overflow-x-auto text-[11px] font-bold">
            {presetChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-sand-200 text-slate-700 border border-sand-200 whitespace-nowrap transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-sand-200 flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for dishes, dietary options..."
              className="flex-1 bg-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#14382B]"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="p-2.5 bg-[#14382B] hover:bg-[#1B4D36] text-white rounded-xl shadow transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
