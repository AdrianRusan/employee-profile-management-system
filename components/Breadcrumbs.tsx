'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard for dashboard routes
    if (paths[0] === 'dashboard') {
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' });
      paths.shift(); // Remove 'dashboard' from paths
    }

    // Build breadcrumbs from remaining paths
    let currentPath = '/dashboard';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Format label: capitalize and replace hyphens with spaces
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      label = label.replace(/-/g, ' ');

      // Handle special cases for better labels
      if (label === 'Profiles' && index === 0) {
        label = 'Profiles';
      } else if (label === 'Feedback' && index === 0) {
        label = 'Feedback';
      } else if (label === 'Absences' && index === 0) {
        label = 'Absences';
      }
      // For ID paths (profile detail pages), show as "Profile" with ID
      else if (paths[index - 1] === 'profiles' && /^[a-zA-Z0-9-]+$/.test(path)) {
        label = 'Profile Details';
      }

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on dashboard home
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-gray-600">
        {/* Home/Dashboard Link */}
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-gray-900 transition-colors"
            aria-label="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <Fragment key={crumb.href}>
              <li>
                <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </li>
              <li>
                {isLast ? (
                  <span
                    className="font-medium text-gray-900"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
