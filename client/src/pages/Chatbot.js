import React, { useState, useEffect, useRef } from 'react';
import { askChatbot } from '../services/chatbotAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roleUtils';
import { Navigate } from 'react-router-dom';
import { FiSend, FiCpu, FiZap, FiTrash2 } from 'react-icons/fi';

export default function Chatbot() {
  const { user, canonicalRole, isAdmin, isBuyerMode } = useAuth();

  // If Admin navigates to /chat, redirect immediately to the dedicated Admin RAG console
  if (isAdmin || canonicalRole === ROLES.ADMIN) {
    return <Navigate to="/admin/rag" replace />;
  }

  const isBuyer = isBuyerMode || canonicalRole === ROLES.BUYER;

  const initialGreeting = isBuyer
    ? "Hello! I am your Secondary Material Procurement Assistant. Ask me anything about circular procurement standards, recycled PET purity, EPR compliance credits, or secondary material quality norms."
    : "Hello! I am your Waste Resource Assistant. Ask me anything about circular economy rules, Fly Ash 2021 regulations, Plastic EPR targets, Hazardous waste disposal, or Green Credit policies.";

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: initialGreeting,
      sources: ["CPCB Knowledge Base"],
      relevant_rules: isBuyer ? ["EPR Procurement Targets", "Secondary Material Standards"] : ["Fly Ash Rules 2021", "EPR Guidelines 2022"]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const sellerPrompts = [
    "What are the Fly Ash Utilization Rules 2021 for generators?",
    "How to comply with EPR for plastic waste generation?",
    "How can hazardous waste be co-processed in cement kilns?",
    "What incentives exist under the Green Credit Program 2024?",
    "How to handle and manifest spent solvents from chemical plants?"
  ];

  const buyerPrompts = [
    "What purity thresholds are required for recycled PET flakes?",
    "How can our plant claim EPR credits for procuring secondary plastics?",
    "What are the Bureau of Indian Standards (BIS) norms for fly ash in PPC cement?",
    "How to verify the chain-of-custody for secondary metal scrap?",
    "Are secondary chemical byproducts eligible for hazardous waste exemption?"
  ];

  const samplePrompts = isBuyer ? buyerPrompts : sellerPrompts;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    if (!messageText) setInputValue('');
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const history = messages.slice(1).map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const data = await askChatbot(textToSend, history);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.reply,
        sources: data.sources || [],
        relevant_rules: data.relevant_rules || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I am having trouble connecting to the knowledge base right now. Please try again shortly.",
        sources: []
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: initialGreeting,
        sources: ["CPCB Knowledge Base"]
      }
    ]);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs flex-1 flex flex-col justify-between">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl border flex justify-center items-center ${
                isBuyer ? 'bg-teal-100 border-teal-200 text-teal-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
              }`}>
                <FiCpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 leading-normal">
                  {isBuyer ? 'Sustainability & Procurement Assistant' : 'Sustainability & Resource Assistant'}
                </h2>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isBuyer ? 'text-teal-700' : 'text-emerald-700'
                  }`}>
                    <FiZap className="w-3 h-3" /> Verified CPCB Compliance Knowledge Base
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              title="Clear Chat History"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex justify-center items-center text-emerald-700 shrink-0 text-xs">
                    <FiCpu className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl space-y-2 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed inline-block font-medium ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-xs font-semibold'
                        : 'bg-gray-50 text-gray-900 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-start text-[10px]">
                      {m.sources.map((src, sIdx) => (
                        <span key={sIdx} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-full">
                          Source: {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-emerald-700 text-white flex justify-center items-center shrink-0 text-xs font-bold shadow-2xs">
                    U
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex justify-center items-center text-emerald-700 shrink-0">
                  <FiCpu className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 font-medium">
                  Querying CPCB vector database...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
            <div className="flex flex-wrap gap-2">
              {samplePrompts.slice(0, 3).map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1 bg-white border border-gray-200 hover:border-emerald-500 text-[11px] text-gray-700 font-semibold rounded-full transition-colors truncate max-w-xs text-left cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about regulatory compliance, recycling standards, EPR..."
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FiSend className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
