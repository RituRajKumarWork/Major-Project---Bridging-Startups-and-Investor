'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = params.connectionId as string;

  // Redirect to messages page with connection selected
  useEffect(() => {
    if (connectionId) {
      router.replace(`/messages?connection=${connectionId}`);
    }
  }, [connectionId, router]);

  return null;
}

