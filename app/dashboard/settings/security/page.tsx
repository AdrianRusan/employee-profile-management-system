'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ShieldCheck, ShieldOff, AlertCircle, Key, RefreshCw, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

// Provider icons
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

export default function SecuritySettingsPage() {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [providerToDisconnect, setProviderToDisconnect] = useState<'google' | 'github' | null>(null);

  const utils = trpc.useUtils();

  // Get 2FA status
  const { data: status, isLoading } = trpc.twoFactor.status.useQuery(undefined, {
    staleTime: 1 * 60 * 1000, // 1 minute - security status should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get connected OAuth providers
  const { data: oauthData, isLoading: oauthLoading } = trpc.auth.getConnectedProviders.useQuery(undefined, {
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Disconnect provider mutation
  const disconnectMutation = trpc.auth.disconnectProvider.useMutation({
    onSuccess: () => {
      toast.success('Provider disconnected successfully');
      setProviderToDisconnect(null);
      utils.auth.getConnectedProviders.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDisconnectProvider = () => {
    if (providerToDisconnect) {
      disconnectMutation.mutate({ provider: providerToDisconnect });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <GoogleIcon className="h-5 w-5" />;
      case 'github':
        return <GitHubIcon className="h-5 w-5" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  // Disable 2FA mutation
  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      setShowDisable(false);
      setDisableCode('');
      setError('');
      utils.twoFactor.status.invalidate();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      setNewBackupCodes(data.backupCodes);
      setRegenerateCode('');
      setError('');
      utils.twoFactor.status.invalidate();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleDisable = () => {
    if (!disableCode.trim()) {
      setError('Please enter a verification code');
      return;
    }
    disableMutation.mutate({ code: disableCode });
  };

  const handleRegenerate = () => {
    if (regenerateCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    regenerateMutation.mutate({ code: regenerateCode });
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    utils.twoFactor.status.invalidate();
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(newBackupCodes.join('\n'));
  };

  if (isLoading || oauthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {status?.enabled ? (
                <>
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">2FA Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldOff className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">2FA Disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Enable 2FA to secure your account
                    </p>
                  </div>
                </>
              )}
            </div>

            {status?.enabled ? (
              <Button variant="destructive" onClick={() => setShowDisable(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={() => setShowSetup(true)}>
                Enable 2FA
              </Button>
            )}
          </div>

          {status?.enabled && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Backup Codes</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {status.backupCodesCount} codes available
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Backup codes can be used to access your account if you lose your authenticator device.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegenerate(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Backup Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your connected OAuth providers for sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connected Providers */}
          {oauthData?.providers && oauthData.providers.length > 0 ? (
            <div className="space-y-3">
              {oauthData.providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.provider)}
                    <div>
                      <p className="font-medium">{getProviderName(provider.provider)}</p>
                      <p className="text-sm text-muted-foreground">
                        Connected {new Date(provider.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProviderToDisconnect(provider.provider as 'google' | 'github')}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No OAuth providers connected</p>
              <p className="text-sm mt-1">
                Connect Google or GitHub from the login page to enable social sign-in
              </p>
            </div>
          )}

          {/* Available Providers to Connect */}
          {oauthData?.providers && oauthData.providers.length < 2 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Connect another account
                </p>
                <div className="flex flex-wrap gap-2">
                  {!oauthData.providers.find((p) => p.provider === 'google') && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="/api/auth/google">
                        <GoogleIcon className="h-4 w-4 mr-2" />
                        Connect Google
                      </a>
                    </Button>
                  )}
                  {!oauthData.providers.find((p) => p.provider === 'github') && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="/api/auth/github">
                        <GitHubIcon className="h-4 w-4 mr-2" />
                        Connect GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Warning about needing login method */}
          {oauthData && !oauthData.hasPassword && oauthData.providers.length === 1 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need at least one login method. Either set a password or connect another OAuth provider before disconnecting.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use a strong, unique password for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Enable two-factor authentication for enhanced security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Keep your backup codes in a secure location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Review your login activity regularly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Never share your authentication codes with anyone</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <TwoFactorSetup
            onComplete={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authentication code or a backup code to disable 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will make your account less secure. You can re-enable it at any time.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification Code</Label>
              <Input
                id="disable-code"
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="123456 or backup code"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableMutation.isPending || !disableCode.trim()}
              >
                {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </Button>
              <Button variant="outline" onClick={() => setShowDisable(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog
        open={showRegenerate}
        onOpenChange={(open) => {
          setShowRegenerate(open);
          if (!open) {
            setNewBackupCodes([]);
            setRegenerateCode('');
            setError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              {newBackupCodes.length > 0
                ? 'Save these new backup codes in a secure location'
                : 'Enter your authentication code to generate new backup codes'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {newBackupCodes.length > 0 ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your old backup codes have been invalidated. Save these new codes securely!
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                    {newBackupCodes.map((code, index) => (
                      <code key={index} className="text-sm font-mono">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopyBackupCodes}>Copy All Codes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRegenerate(false);
                      setNewBackupCodes([]);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generating new backup codes will invalidate your old codes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="regenerate-code">Authentication Code</Label>
                  <Input
                    id="regenerate-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={regenerateCode}
                    onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRegenerate}
                    disabled={regenerateMutation.isPending || regenerateCode.length !== 6}
                  >
                    {regenerateMutation.isPending ? 'Generating...' : 'Generate New Codes'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRegenerate(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Provider Confirmation */}
      <AlertDialog
        open={!!providerToDisconnect}
        onOpenChange={(open) => !open && setProviderToDisconnect(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {providerToDisconnect && getProviderName(providerToDisconnect)}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in with {providerToDisconnect && getProviderName(providerToDisconnect)}.
              {oauthData && !oauthData.hasPassword && oauthData.providers.length <= 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: You have no password set. Disconnecting this provider will lock you out of your account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectProvider}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
