'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PendingOAuthData {
  email: string;
  name: string;
  provider: string;
  providerId: string;
  org: string;
  avatar?: string;
}

function JoinOrganizationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [oauthData, setOauthData] = useState<PendingOAuthData | null>(null);
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo?: string } | null>(null);

  // Fetch pending OAuth data from secure cookie via API
  useEffect(() => {
    async function fetchPendingData() {
      try {
        const response = await fetch('/api/auth/pending-oauth');

        if (!response.ok) {
          throw new Error('No pending OAuth data');
        }

        const data = await response.json();

        if (!data.email || !data.name || !data.provider || !data.providerId || !data.org) {
          throw new Error('Missing registration information');
        }

        setOauthData(data);

        // Fetch organization info
        const orgResponse = await fetch(`/api/organizations/${data.org}/info`);
        const orgData = await orgResponse.json();

        if (orgData.error) {
          throw new Error(orgData.error);
        }

        setOrgInfo(orgData);
      } catch (error) {
        console.error('Failed to fetch OAuth data:', error);
        toast.error('Session expired. Please try signing in again.');
        router.push('/login');
      } finally {
        setIsFetchingData(false);
      }
    }

    fetchPendingData();
  }, [router]);

  const handleJoinOrganization = async () => {
    if (!oauthData) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/join-via-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: oauthData.email,
          name: oauthData.name,
          organizationSlug: oauthData.org,
          provider: oauthData.provider,
          providerId: oauthData.providerId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join organization');
      }

      // Clear the pending OAuth cookie
      await fetch('/api/auth/pending-oauth', { method: 'DELETE' });

      toast.success('Successfully joined organization!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    router.push('/register/complete');
  };

  const handleCancel = async () => {
    await fetch('/api/auth/pending-oauth', { method: 'DELETE' });
    router.push('/login');
  };

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!orgInfo || !oauthData) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading organization information...</p>
      </div>
    );
  }

  const providerName = oauthData.provider.charAt(0).toUpperCase() + oauthData.provider.slice(1);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">Join your team</CardTitle>
        <CardDescription className="text-muted-foreground">
          Your email domain matches an existing organization
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6 space-y-6">
        {/* Organization Card */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
          <Avatar className="h-14 w-14">
            <AvatarImage src={orgInfo.logo} alt={orgInfo.name} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {orgInfo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{orgInfo.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Team workspace</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
          <Avatar className="h-10 w-10">
            <AvatarImage src={oauthData.avatar} alt={oauthData.name} />
            <AvatarFallback>{oauthData.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{oauthData.name}</p>
            <p className="text-sm text-muted-foreground truncate">{oauthData.email}</p>
          </div>
          <Badge variant="secondary">{providerName}</Badge>
        </div>

        <div className="space-y-3">
          <Button onClick={handleJoinOrganization} className="w-full h-11 text-base font-medium" disabled={isLoading}>
            {isLoading ? 'Joining...' : (
              <>
                Join {orgInfo.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button onClick={handleCreateNew} variant="outline" className="w-full h-11">
            <Building2 className="mr-2 h-4 w-4" />
            Create a new organization
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <button
            onClick={handleCancel}
            className="font-medium text-primary hover:underline"
          >
            Cancel and return to login
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

export default function JoinOrganizationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <JoinOrganizationForm />
    </Suspense>
  );
}
