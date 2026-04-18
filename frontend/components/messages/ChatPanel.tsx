'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Send, Upload, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  connectionId: string;
  connectionName: string;
}

export function ChatPanel({ connectionId, connectionName }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (after?: string) => {
    try {
      const params = after ? { after } : {};
      const response = await api.get(`/api/chat/messages/${connectionId}`, { params });
      const newMessages = response.data.messages || [];

      if (after) {
        setMessages((prev) => [...prev, ...newMessages]);
      } else {
        setMessages(newMessages);
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      // Silently fail for loading messages to avoid spam
    }
  };

  useEffect(() => {
    if (!connectionId) return;

    loadMessages();

    // Poll for new messages every 5 seconds
    pollingRef.current = setInterval(() => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        loadMessages(lastMessage.created_at);
      } else {
        loadMessages();
      }
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [connectionId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: 'temp',
      connection_id: connectionId,
      sender_id: user?.id || '',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await api.post('/api/chat/messages', {
        connection_id: connectionId,
        content,
      });

      // Replace temp message with real one
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp'),
        response.data.message,
      ]);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
      setMessages((prev) => prev.filter((m) => m.id !== 'temp'));
    } finally {
      setSending(false);
    }
  };

  if (!connectionId) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const initial = connectionName.charAt(0).toUpperCase();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-purple-600">
            <AvatarFallback className="bg-purple-600 text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{connectionName}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-4 py-2',
                    isOwn
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isOwn ? 'text-purple-100' : 'text-gray-500'
                    )}
                  >
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="h-20 border-t bg-white px-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Upload className="h-5 w-5" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Message ${connectionName}...`}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700"
          size="icon"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

