import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/Context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { aiService } from '@/services/aiService';
import type { Message } from '@/services/aiService';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 10); // Speed of typewriter
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
    </div>
  );
};

const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
          code: ({ children }) => <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">{children}</code>,
          pre: ({ children }) => <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto my-2">{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const AIChatBubble: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCopying, setIsCopying] = useState<number | null>(null);
  
  const allowedRoutes = [
    '/dashboard',
    '/matches',
    '/bookings',
    '/settings',
    '/feedback',
    '/profile',
  ];

  const isVisible = isAuthenticated && allowedRoutes.some(path => location.pathname.startsWith(path));

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your SkillSwap Assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setIsCopying(index);
    setTimeout(() => setIsCopying(null), 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await aiService.sendMessage(userMsg, messages);
      const assistantMsgIndex = newMessages.length;
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      setTypingMessageId(assistantMsgIndex);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[450px] h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between shadow-lg relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">SkillSwap AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-4 scroll-smooth bg-slate-50/50 dark:bg-slate-900/20"
            >
              <div className="space-y-6 pb-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 w-full",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      "w-8 h-8 shrink-0 mt-1 shadow-sm",
                      msg.role === 'assistant' ? "border border-indigo-100 dark:border-indigo-900" : ""
                    )}>
                      {msg.role === 'assistant' ? (
                        <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                          <Bot size={16} />
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <User size={16} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={cn(
                      "group relative flex flex-col gap-2 max-w-[80%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div
                        className={cn(
                          "rounded-2xl p-3.5 shadow-sm transition-all duration-200",
                          msg.role === 'user'
                            ? "bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-700"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 hover:shadow-md"
                        )}
                      >
                        {msg.role === 'assistant' && typingMessageId === index ? (
                          <Typewriter 
                            text={msg.content} 
                            onComplete={() => {
                              setTypingMessageId(null);
                              scrollToBottom();
                            }} 
                          />
                        ) : (
                          <MarkdownContent content={msg.content} />
                        )}
                      </div>
                      
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold"
                        >
                          {isCopying === index ? (
                            <><Check size={12} className="text-green-500" /> Copied!</>
                          ) : (
                            <><Copy size={12} /> Copy response</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 mr-auto max-w-[85%]">
                    <Avatar className="w-8 h-8 shrink-0 mt-1 border border-indigo-100 dark:border-indigo-900 shadow-sm animate-pulse">
                      <AvatarFallback className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-400">
                        <Bot size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                       <span className="text-xs text-slate-400 font-medium italic">Thinking...</span>
                       <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 relative z-10">
              <div className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 rounded-xl pr-10 min-h-[44px]"
                    disabled={isLoading}
                  />
                  {!isLoading && message.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                       <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !message.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-11 h-11 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium italic bg-white dark:bg-slate-950 px-2">
                  <Sparkles size={10} className="text-indigo-300" />
                  Powered by SkillSwap AI
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Toggle */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-4",
          isOpen 
            ? "bg-slate-900 border-slate-800 text-white rotate-90" 
            : "bg-indigo-600 border-indigo-500/30 text-white hover:bg-indigo-700 shadow-indigo-500/50"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
