'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/MainLayout';
import { MessageList } from '@/components/messages/MessageList';
import { ChatPanel } from '@/components/messages/ChatPanel';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>();
  const [selectedConnectionName, setSelectedConnectionName] = useState<string>('');

  useEffect(() => {
    const connection = searchParams.get('connection');
    if (connection) {
      setSelectedConnectionId(connection);
    }
  }, [searchParams]);

  const handleSelectConnection = (connectionId: string, name: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedConnectionName(name);
  };

  return (
    <ProtectedRoute allowedRoles={['founder', 'investor']}>
      <MainLayout>
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Messages List - Middle Column */}
          <div className="w-80 border-r bg-white flex-shrink-0">
            <MessageList
              selectedConnectionId={selectedConnectionId}
              onSelectConnection={handleSelectConnection}
            />
          </div>

          {/* Chat Panel - Right Column */}
          <div className="flex-1">
            <ChatPanel
              connectionId={selectedConnectionId || ''}
              connectionName={selectedConnectionName}
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
