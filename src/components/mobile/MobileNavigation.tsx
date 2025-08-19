"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface MobileNavItem {
  path: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

export default function MobileNavigation() {
  const pathname = usePathname();

  const navItems: MobileNavItem[] = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Home'
    },
    {
      path: '/meal-planner',
      icon: '📋',
      label: 'Meals'
    },
    {
      path: '/tracking/nutrition',
      icon: '🍽️',
      label: 'Track'
    },
    {
      path: '/tracking/glucose',
      icon: '🩸',
      label: 'Glucose'
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Profile'
    }
  ];

  return (
    <div className="mobile-nav-tabs safe-area-bottom">
      {navItems.map((item, index) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <Link
            key={index}
            href={item.path}
            className={`mobile-nav-tab touch-feedback ${isActive ? 'active' : ''}`}
          >
            <div className="text-xl mb-1">{item.icon}</div>
            <span className={`font-medium ${isActive ? 'text-primary-600' : 'text-neutral-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}