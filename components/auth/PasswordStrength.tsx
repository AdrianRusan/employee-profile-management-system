'use client';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function calculatePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', bgColor: '' };
  }

  let score = 0;

  // Length check
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;

  // Number check
  if (/[0-9]/.test(password)) score += 1;

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Additional length bonus
  if (password.length >= 16) score += 1;

  // Map score to strength
  if (score <= 2) {
    return {
      score: 1,
      label: 'Weak',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
    };
  } else if (score <= 4) {
    return {
      score: 2,
      label: 'Fair',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
    };
  } else if (score <= 6) {
    return {
      score: 3,
      label: 'Good',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
    };
  } else {
    return {
      score: 4,
      label: 'Strong',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
    };
  }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1 flex-1 rounded-full transition-colors ${
              bar <= strength.score ? strength.bgColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className={`text-sm font-medium ${strength.color}`}>
        {strength.label}
      </p>
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Password must contain:</p>
        <ul className="space-y-0.5 pl-4">
          <li className={password.length >= 12 ? 'text-green-600' : ''}>
            {password.length >= 12 ? '✓' : '○'} At least 12 characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
            {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
            {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
            {/[0-9]/.test(password) ? '✓' : '○'} One number
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
            {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} One special character
          </li>
        </ul>
      </div>
    </div>
  );
}
