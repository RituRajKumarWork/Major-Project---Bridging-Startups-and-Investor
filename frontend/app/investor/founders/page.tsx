'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, MessageSquare, Check, X, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Founder {
  user_id: string;
  company_name: string;
  domain: string;
  funding_stage: string;
  valuation: number;
  description?: string;
  social_links?: Record<string, string>;
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

export default function FoundersPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundingStageFilter, setFundingStageFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [fundingStageFilter, domainFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadFounders(), loadRequests()]);
    } finally {
      setLoading(false);
    }
  };

  const loadFounders = async () => {
    try {
      const params: any = {};
      if (fundingStageFilter && fundingStageFilter !== 'all') params.funding_stage = fundingStageFilter;
      if (domainFilter) params.domain = domainFilter;

      const response = await api.get('/api/investors/founders', { params });
      setFounders(response.data.founders || []);
    } catch (error: any) {
      toast.error('Failed to load founders');
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

  const handleConnect = async (founderId: string) => {
    try {
      await api.post('/api/investors/founders/connect', { founder_id: founderId });
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

  // Separate founders into connected and pending
  const connectedFounders = founders.filter(f => f.connection_status === 'accepted');
  const pendingFounders = founders.filter(f => f.connection_status === 'pending');
  const availableFounders = founders.filter(f => !f.connection_status);

  const renderFounderCard = (founder: Founder) => (
    <Card key={founder.user_id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{founder.company_name}</h3>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{founder.domain}</Badge>
              <Badge>{founder.funding_stage}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Valuation: ${founder.valuation.toLocaleString()}
            </p>
          </div>
          {founder.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {founder.description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {founder.connection_status === 'accepted' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/messages?connection=${founder.connection_id}`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Button>
            ) : founder.connection_status === 'pending' && founder.is_requested_by_current_user ? (
              // Only show badge, no button
              getStatusBadge(founder.connection_status)
            ) : founder.connection_status === 'pending' && !founder.is_requested_by_current_user && founder.connection_id ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAccept(founder.connection_id!)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(founder.connection_id!)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleConnect(founder.user_id)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Connect
              </Button>
            )}
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
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Discover Founders</CardTitle>
                <CardDescription>Find and connect with promising startups, manage your connections</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Connected Founders Section */}
        {connectedFounders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Founders</CardTitle>
              <CardDescription>Founders you're connected with - send them messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connectedFounders.map(renderFounderCard)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests Section */}
        {(pendingFounders.length > 0 || pendingRequests.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Connection requests waiting for your response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Pending founders from main list */}
                {pendingFounders.map(renderFounderCard)}

                {/* Pending requests from requests API */}
                {pendingRequests.map((request) => {
                  const sender = request.sender_profile;
                  const displayName = sender?.company_name || 'Unknown';

                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Founders Section */}
        {availableFounders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discover Founders</CardTitle>
              <CardDescription>Connect with new startups in your network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Filter by domain..."
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={fundingStageFilter} onValueChange={setFundingStageFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Funding Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B">Series B</SelectItem>
                    <SelectItem value="Series C+">Series C+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableFounders.map(renderFounderCard)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {connectedFounders.length === 0 && pendingFounders.length === 0 && pendingRequests.length === 0 && availableFounders.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No founders found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
