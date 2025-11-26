'use client';

import { useState } from 'react';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, Shield } from 'lucide-react';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const utils = trpc.useUtils();

  // Setup mutation - generates QR code and secret
  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
      setError('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Enable mutation - verifies code and enables 2FA
  const enableMutation = trpc.twoFactor.enable.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep('backup');
      setError('');
      utils.twoFactor.status.invalidate();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    enableMutation.mutate({ code: verificationCode });
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleComplete = () => {
    onComplete?.();
  };

  // Step 1: Initial setup
  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">What you'll need:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>An authenticator app like Google Authenticator, Authy, or 1Password</li>
              <li>Your smartphone or device with the app installed</li>
              <li>A few minutes to complete the setup</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? 'Setting up...' : 'Get Started'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Scan QR code and verify
  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual entry option */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Can't scan? Enter this code manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                  {secret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  className="shrink-0"
                >
                  {copiedSecret ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification code input */}
            <div className="space-y-2">
              <Label htmlFor="code">Enter 6-digit code from your app</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={enableMutation.isPending || verificationCode.length !== 6}
                className="flex-1"
              >
                {enableMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Save backup codes
  if (step === 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            2FA Enabled Successfully
          </CardTitle>
          <CardDescription>
            Save these backup codes in a secure location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These backup codes can be used to access your account if you lose your authenticator device.
              Each code can only be used once. Store them securely!
            </AlertDescription>
          </Alert>

          {/* Backup codes display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Backup Codes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCodes}
              >
                {copiedBackupCodes ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <Button onClick={handleComplete} className="w-full">
            I've Saved My Backup Codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
