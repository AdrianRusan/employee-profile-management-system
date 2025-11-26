'use client';

import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Brand Panel - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Geometric accent */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">EPMS</h1>
              <p className="text-sm text-gray-400">Employee Portal</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Manage your team<br />
            <span className="text-gray-400">with confidence</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-md mb-12">
            Streamline employee profiles, track absences, and foster growth with meaningful feedback.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {['Role-based access control', 'AI-powered feedback', 'Team analytics'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
        {/* Mobile logo - only shown on smaller screens */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">EPMS</span>
        </div>

        {children}
      </div>
    </div>
  );
}
