'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DOMAINS, FUNDING_STAGES } from '@/lib/constants';

const founderProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  domain: z.enum([...DOMAINS] as [string, ...string[]], { message: 'Invalid domain. Please select from the allowed values.' }),
  funding_stage: z.enum([...FUNDING_STAGES] as [string, ...string[]], { message: 'Invalid funding stage. Please select from the allowed values.' }),
  valuation: z.string().min(1, 'Valuation is required'),
  description: z.string().optional(),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const investorProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  domain: z.string().optional(),
  stage_interest: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FounderProfileForm = z.infer<typeof founderProfileSchema>;
type InvestorProfileForm = z.infer<typeof investorProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isFounder = user?.role === 'founder';

  const founderForm = useForm<FounderProfileForm>({
    resolver: zodResolver(founderProfileSchema),
    defaultValues: {
      company_name: '',
      domain: '',
      funding_stage: '',
      valuation: '',
      description: '',
      linkedin: '',
      twitter: '',
      website: '',
    },
  });

  const investorForm = useForm<InvestorProfileForm>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      domain: '',
      stage_interest: '',
      description: '',
      logo_url: '',
      website: '',
    },
  });

  useEffect(() => {
    if (user) {
      // Prefill email for investor profile if not already set
      if (!isFounder && user.email) {
        investorForm.setValue('email', user.email);
      }
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (isFounder) {
        const response = await api.get('/api/founders/profile');
        const profile = response.data.profile;
        if (profile) {
          const socialLinks = profile.social_links || {};
          founderForm.reset({
            company_name: profile.company_name || '',
            domain: profile.domain || '',
            funding_stage: profile.funding_stage || '',
            valuation: profile.valuation?.toString() || '',
            description: profile.description || '',
            linkedin: socialLinks.linkedin || '',
            twitter: socialLinks.twitter || '',
            website: socialLinks.website || '',
          });
        }
      } else {
        const response = await api.get('/api/investors/profile');
        const profile = response.data.profile;
        if (profile) {
          investorForm.reset({
            name: profile.name || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || '',
            domain: profile.domain || '',
            stage_interest: profile.stage_interest || '',
            description: profile.description || '',
            logo_url: profile.logo_url || '',
            website: profile.website || '',
          });
        } else if (user?.email) {
          // If no profile exists, ensure email is prefilled
          investorForm.setValue('email', user.email);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const onFounderSubmit = async (data: FounderProfileForm) => {
    setSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (data.linkedin) socialLinks.linkedin = data.linkedin;
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.website) socialLinks.website = data.website;

      await api.put('/api/founders/profile', {
        company_name: data.company_name,
        domain: data.domain,
        funding_stage: data.funding_stage,
        valuation: parseFloat(data.valuation),
        description: data.description,
        social_links: socialLinks,
      });
      toast.success('Profile saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const onInvestorSubmit = async (data: InvestorProfileForm) => {
    setSaving(true);
    try {
      await api.put('/api/investors/profile', {
        ...data,
        logo_url: data.logo_url || undefined,
        website: data.website || undefined,
      });
      toast.success('Profile saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['founder', 'investor']}>
        <MainLayout>
          <div className="flex justify-center p-8">Loading...</div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['founder', 'investor']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{isFounder ? 'Founder Profile' : 'Investor Profile'}</CardTitle>
              <CardDescription>
                {isFounder ? 'Update your company information' : 'Update your investor information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFounder ? (
                <Form {...founderForm}>
                  <form onSubmit={founderForm.handleSubmit(onFounderSubmit)} className="space-y-6">
                    <FormField
                      control={founderForm.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={founderForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DOMAINS.map((domain) => (
                                <SelectItem key={domain} value={domain}>
                                  {domain}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={founderForm.control}
                      name="funding_stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Stage *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a funding stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FUNDING_STAGES.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={founderForm.control}
                      name="valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation (USD) *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={founderForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Social Links</h3>
                      <FormField
                        control={founderForm.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" placeholder="https://linkedin.com/company/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={founderForm.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" placeholder="https://twitter.com/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={founderForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" placeholder="https://example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...investorForm}>
                  <form onSubmit={investorForm.handleSubmit(onInvestorSubmit)} className="space-y-6">
                    <FormField
                      control={investorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DOMAINS.map((domain) => (
                                <SelectItem key={domain} value={domain}>
                                  {domain}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="stage_interest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Interest</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a funding stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FUNDING_STAGES.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={investorForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

