'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, MessageSquare, Check, X, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Investor {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  domain?: string;
  stage_interest?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  connection_status?: string;
  connection_id?: string;
  is_requested_by_current_user?: boolean;
}

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

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInvestors(), loadRequests()]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvestors = async () => {
    try {
      const response = await api.get('/api/founders/investors');
      setInvestors(response.data.investors || []);
    } catch (error: any) {
      toast.error('Failed to load investors');
    }
  };

  const loadRequests = async () => {
    try {
      const response = await api.get('/api/requests');
      const requests = (response.data.requests || []) as ConnectionRequest[];
      // Deduplicate by id to prevent showing the same request twice
      const uniqueRequests: ConnectionRequest[] = Array.from(
        new Map(requests.map((req: ConnectionRequest) => [req.id, req])).values()
      );
      setPendingRequests(uniqueRequests);
    } catch (error: any) {
      // Silently fail - requests might not be available
      console.error('Failed to load requests:', error);
    }
  };

  const handleConnect = async (investorId: string) => {
    try {
      await api.post('/api/founders/investors/connect', { investor_id: investorId });
      toast.success('Connection request sent');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send connection request');
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.put(`/api/connections/${connectionId}/accept`);
      toast.success('Connection accepted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept connection');
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await api.put(`/api/connections/${connectionId}/reject`);
      toast.success('Connection rejected');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject connection');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'secondary',
      accepted: 'default',
      rejected: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  // Separate investors into connected and pending
  const connectedInvestors = investors.filter(inv => inv.connection_status === 'accepted');
  const pendingInvestors = investors.filter(inv => inv.connection_status === 'pending');
  const availableInvestors = investors.filter(inv => !inv.connection_status);

  const renderInvestorCard = (investor: Investor) => (
    <Card key={investor.user_id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>
              {investor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold">{investor.name}</h3>
              <p className="text-sm text-muted-foreground">{investor.email}</p>
            </div>
            {investor.domain && (
              <Badge variant="outline">{investor.domain}</Badge>
            )}
            {investor.stage_interest && (
              <p className="text-sm">Interested in: {investor.stage_interest}</p>
            )}
            {investor.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {investor.description}
              </p>
            )}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {investor.connection_status === 'accepted' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/messages?connection=${investor.connection_id}`)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              ) : investor.connection_status === 'pending' && investor.is_requested_by_current_user ? (
                // Only show badge, no button
                getStatusBadge(investor.connection_status)
              ) : investor.connection_status === 'pending' && !investor.is_requested_by_current_user && investor.connection_id ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAccept(investor.connection_id!)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(investor.connection_id!)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(investor.user_id)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        {/* Page Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Investor Network</CardTitle>
                <CardDescription>Discover and connect with investors, manage your connections</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Connected Investors Section */}
        {connectedInvestors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Investors</CardTitle>
              <CardDescription>Investors you're connected with - send them messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connectedInvestors.map(renderInvestorCard)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests Section */}
        {(pendingInvestors.length > 0 || pendingRequests.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Connection requests waiting for your response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Pending investors from main list */}
                {pendingInvestors.map(renderInvestorCard)}

                {/* Pending requests from requests API */}
                {pendingRequests.map((request) => {
                  const sender = request.sender_profile;
                  const displayName = sender?.name || 'Unknown';

                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold">{displayName}</h3>
                              {sender?.email && (
                                <p className="text-sm text-muted-foreground">{sender.email}</p>
                              )}
                            </div>
                            {sender?.domain && (
                              <Badge variant="outline">{sender.domain}</Badge>
                            )}
                            {sender?.stage_interest && (
                              <p className="text-sm">Interested in: {sender.stage_interest}</p>
                            )}
                            {sender?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {sender.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
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
            </CardContent>
          </Card>
        )}

        {/* Available Investors Section */}
        {availableInvestors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discover Investors</CardTitle>
              <CardDescription>Connect with new investors in your network</CardDescription>
            </CardHeader>
            <CardContent>
              {availableInvestors.length === 0 ? (
                <p className="text-muted-foreground">No investors found</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableInvestors.map(renderInvestorCard)}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {connectedInvestors.length === 0 && pendingInvestors.length === 0 && pendingRequests.length === 0 && availableInvestors.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No investors found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
