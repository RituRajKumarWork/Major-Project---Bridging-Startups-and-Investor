'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Connection {
  id: string;
  founder_id: string;
  investor_id: string;
  status: string;
  created_at: string;
  founder_profile?: {
    company_name: string;
    user_id: string;
  };
  investor_profile?: {
    name: string;
    user_id: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface MessageListProps {
  selectedConnectionId?: string;
  onSelectConnection: (connectionId: string, name: string) => void;
}

export function MessageList({ selectedConnectionId, onSelectConnection }: MessageListProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
    // Poll for new connections every 10 seconds
    const interval = setInterval(loadConnections, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConnections = async () => {
    try {
      const response = await api.get('/api/chat/connections');
      const connectionsData = response.data.connections || [];

      // Fetch last message for each connection
      const connectionsWithMessages = await Promise.all(
        connectionsData.map(async (conn: Connection) => {
          try {
            const messagesRes = await api.get(`/api/chat/messages/${conn.id}?limit=1`);
            const messages = messagesRes.data.messages || [];
            return {
              ...conn,
              last_message: messages[messages.length - 1] || null,
            };
          } catch {
            return { ...conn, last_message: null };
          }
        })
      );

      // Connections already include profile data from backend
      setConnections(connectionsWithMessages);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionName = (conn: Connection) => {
    // Use connection ID as fallback, in production you'd fetch profile data
    if (user?.role === 'founder') {
      return conn.investor_profile?.name || `Investor ${conn.investor_id.slice(0, 8)}`;
    } else {
      return conn.founder_profile?.company_name || `Founder ${conn.founder_id.slice(0, 8)}`;
    }
  };

  const getConnectionInitial = (conn: Connection) => {
    const name = getConnectionName(conn);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading conversations...</div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400 text-center px-4">
          No conversations yet. Connect with someone to start messaging.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <div className="divide-y">
        {connections.map((conn) => {
          const name = getConnectionName(conn);
          const initial = getConnectionInitial(conn);
          const isSelected = conn.id === selectedConnectionId;
          const lastMessage = conn.last_message;

          return (
            <button
              key={conn.id}
              onClick={() => onSelectConnection(conn.id, name)}
              className={cn(
                'w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors relative',
                isSelected && 'bg-purple-50'
              )}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
              )}
              <Avatar className="h-12 w-12 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  {lastMessage && (
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDistanceToNow(new Date(lastMessage.created_at), {
                        addSuffix: true,
                      })
                        .replace('about ', '')
                        .replace('less than a minute', 'now')}
                    </span>
                  )}
                </div>
                {lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

