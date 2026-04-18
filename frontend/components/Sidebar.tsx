'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  User,
  Upload,
  Sparkles,
  TrendingUp,
  Users,
  MessageCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: ('founder' | 'investor')[];
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems: NavItem[] = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/founder/data-lab', label: 'Data Lab', icon: Upload, roles: ['founder'] },
    { href: '/founder/mentor', label: 'Ask Mentor', icon: Sparkles, roles: ['founder'] },
    { href: '/founder/projections', label: 'Projections', icon: TrendingUp, roles: ['founder'] },
    { href: '/founder/investors', label: 'Investors', icon: Users, roles: ['founder'] },
    { href: '/investor/founders', label: 'Discover Founders', icon: Users, roles: ['investor'] },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (href: string) => {
    if (href === '/messages') {
      return pathname?.startsWith('/messages') || pathname?.startsWith('/chat');
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white flex flex-col shadow-2xl">
      {/* User Profile Section */}
      <div className="p-8 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-14 w-14 bg-gradient-to-br from-purple-600 to-purple-700 ring-2 ring-purple-500/30 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white text-xl font-bold">
              {user?.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base capitalize text-white mb-1 tracking-tight">
              {user?.role}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-purple-300 p-0 h-auto font-medium transition-colors duration-200"
              onClick={() => router.push('/profile')}
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg transition-all duration-200 font-medium text-sm py-3 px-4',
                  'hover:shadow-md hover:translate-x-1',
                  active && 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-purple-700 translate-x-1'
                )}
                onClick={() => router.push(item.href)}
              >
                <Icon className={cn(
                  'mr-3 h-5 w-5 transition-transform duration-200',
                  active && 'scale-110'
                )} />
                <span className="font-semibold">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Sign Out */}
      <div className="p-6 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="group w-full justify-start text-gray-300 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-200 font-medium text-sm py-3 px-4 hover:shadow-md"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-semibold">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

