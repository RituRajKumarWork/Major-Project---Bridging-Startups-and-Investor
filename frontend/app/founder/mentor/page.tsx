'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const shouldAutoScroll = useRef(true);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get('/api/founders/mentor/history');
        const conversations = response.data.conversations || [];

        // Convert conversations to messages format
        const historyMessages: Message[] = [];
        conversations.reverse().forEach((conv: any) => {
          historyMessages.push(
            { role: 'user', content: conv.user_message },
            { role: 'assistant', content: conv.assistant_response }
          );
        });

        setMessages(historyMessages);
      } catch (error: any) {
        console.error('Failed to load history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Check if user is near bottom of scroll container
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Scroll to bottom only if user is near bottom or it's a new message
  const scrollToBottom = (force = false) => {
    if (force || shouldAutoScroll.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Update shouldAutoScroll when user scrolls
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldAutoScroll.current = checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Only auto-scroll on new messages, not on initial render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Scroll to bottom after history loads
      if (!loadingHistory) {
        setTimeout(() => {
          scrollToBottom(true);
        }, 200);
      }
      return;
    }

    // Only scroll if it's a new message (not loading history)
    if (!loadingHistory && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, loadingHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    shouldAutoScroll.current = true; // User sent a message, so auto-scroll

    try {
      const response = await api.post('/api/founders/mentor/chat', {
        message: userMessage,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ]);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <Card className="flex-1 flex flex-col shadow-lg border-purple-200/50 overflow-hidden min-h-0">
        <CardHeader className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white rounded-t-xl p-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-purple-400/30 rounded-lg backdrop-blur-sm border border-white/20">
              <Sparkles className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl font-bold mb-1">AI Mentor</CardTitle>
              <CardDescription className="text-white/90 text-sm font-normal">
                Get personalized advice based on your profile and financial data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 p-6 bg-gradient-to-b from-gray-50 to-white min-h-0 overflow-hidden">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-inner min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}
          >
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <p className="text-lg font-medium mb-2">Start a conversation with your AI mentor</p>
                <p className="text-sm">
                  Ask questions about your business, growth strategies, fundraising, or anything else!
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md transition-all ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="mb-3 last:mb-0 pl-5 list-disc space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 last:mb-0 pl-5 list-decimal space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-gray-100 text-purple-600 px-1.5 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2">
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ children }) => <pre className="my-2">{children}</pre>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-purple-400 pl-4 italic my-2 text-gray-600">
                                {children}
                              </blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a href={href} className="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-3 pt-2 flex-shrink-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your mentor a question..."
              rows={2}
              className="resize-none border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
