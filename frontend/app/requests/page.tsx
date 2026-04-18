'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Check, X, User, Building2, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectionRequest {
  id: string;
  founder_id: string;
  investor_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    user_id: string;
    name?: string;
    company_name?: string;
    email?: string;
    domain?: string;
    stage_interest?: string;
    description?: string;
  };
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/api/requests');
      const requests = (response.data.requests || []) as ConnectionRequest[];
      // Deduplicate by id to prevent showing the same request twice
      const uniqueRequests: ConnectionRequest[] = Array.from(
        new Map(requests.map((req: ConnectionRequest) => [req.id, req])).values()
      );
      setRequests(uniqueRequests);
    } catch (error: any) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await api.put(`/api/requests/${requestId}/accept`);
      toast.success('Connection request accepted');
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await api.put(`/api/requests/${requestId}/reject`);
      toast.success('Connection request rejected');
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-6 flex-1 overflow-y-auto pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Requests</CardTitle>
            <CardDescription>Manage your incoming connection requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const sender = request.sender_profile;
                  const isFounder = sender?.company_name;
                  const displayName = isFounder ? sender.company_name : sender?.name || 'Unknown';
                  const initials = isFounder
                    ? sender.company_name?.charAt(0).toUpperCase() || 'C'
                    : sender?.name?.charAt(0).toUpperCase() || 'U';

                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {isFounder ? (
                                <Building2 className="h-6 w-6" />
                              ) : (
                                <User className="h-6 w-6" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{displayName}</h3>
                              {sender?.email && (
                                <p className="text-sm text-muted-foreground">{sender.email}</p>
                              )}
                              {sender?.domain && (
                                <Badge variant="outline" className="mt-2">
                                  {sender.domain}
                                </Badge>
                              )}
                              {sender?.stage_interest && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Interested in: {sender.stage_interest}
                                </p>
                              )}
                              {sender?.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {sender.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <p className="text-xs text-muted-foreground">
                                Requested on {formatDate(request.created_at)}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAccept(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(request.id)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

