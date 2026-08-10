'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Send, Bell, User } from 'lucide-react';

export const EmployeeNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'My Timesheet', href: '/timesheet', icon: Clock },
    { name: 'My Submissions', href: '/submissions', icon: Send },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User }
  ];

  return (
    <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
              isActive
                ? 'bg-[#F5F0FF] text-[#9333EA]'
                : 'text-[#1E293B] hover:bg-white/70'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-[#9333EA]' : 'text-[#475569]'}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};
