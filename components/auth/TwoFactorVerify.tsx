'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Shield } from 'lucide-react';

interface TwoFactorVerifyProps {
  email: string;
  onVerify: (code: string, isBackupCode: boolean, trustDevice: boolean) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function TwoFactorVerify({
  email,
  onVerify,
  onCancel,
  isLoading = false,
  error,
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      return;
    }

    // For TOTP, ensure it's 6 digits
    if (!useBackupCode && code.length !== 6) {
      return;
    }

    onVerify(code, useBackupCode, trustDevice);
  };

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      // Backup codes are alphanumeric, allow letters and numbers
      setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    } else {
      // TOTP codes are numeric only
      setCode(value.replace(/\D/g, ''));
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the {useBackupCode ? 'backup code' : '6-digit code'} from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Account
            </Label>
            <div className="text-sm font-medium">{email}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? 'Backup Code' : 'Authentication Code'}
            </Label>
            <Input
              id="code"
              type="text"
              inputMode={useBackupCode ? 'text' : 'numeric'}
              pattern={useBackupCode ? '[A-Z0-9]*' : '[0-9]*'}
              maxLength={useBackupCode ? 8 : 6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={useBackupCode ? 'ABCD1234' : '123456'}
              className="text-center text-lg tracking-widest"
              autoComplete="off"
              autoFocus
            />
            {!useBackupCode && (
              <p className="text-xs text-muted-foreground">
                Open your authenticator app and enter the 6-digit code
              </p>
            )}
            {useBackupCode && (
              <p className="text-xs text-muted-foreground">
                Enter one of your 8-character backup codes
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trustDevice"
              checked={trustDevice}
              onCheckedChange={(checked: boolean | 'indeterminate') => setTrustDevice(checked === true)}
            />
            <label
              htmlFor="trustDevice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Trust this device for 30 days
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !code.trim() ||
                (!useBackupCode && code.length !== 6)
              }
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={toggleBackupCode}
              className="w-full"
            >
              {useBackupCode
                ? 'Use authenticator app instead'
                : 'Use backup code instead'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Lost access to your authenticator app? Use a backup code to sign in.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
