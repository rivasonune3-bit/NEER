'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map, 
  Search, 
  Sliders, 
  Activity, 
  Flame, 
  LifeBuoy, 
  Radio, 
  FileText, 
  ShieldCheck, 
  Settings, 
  Home, 
  Bell, 
  PhoneCall, 
  User, 
  ListTodo, 
  Navigation, 
  Package, 
  MessageSquare,
  Database,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Compass,
  Camera,
  MapPin,
  HeartPulse
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface SidebarProps {
  role?: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'authority',
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Authority Navigation Links
  const authorityNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/authority/explore', label: 'Explore India', icon: Map },
    { href: '/authority/check-risk', label: 'Check Flood Risk', icon: Search },
    { href: '/authority/gis-factors', label: 'GIS Factors', icon: Sliders },
    { href: '/authority/environmental', label: 'Environmental Monitoring', icon: Activity },
    { href: '/authority/alerts', label: 'Alerts', icon: Flame },
    { href: '/authority/incidents', label: 'Incidents', icon: LifeBuoy },
    { href: '/authority/citizens', label: 'Citizen Management', icon: Users },
    { href: '/authority/response-teams', label: 'Response Teams', icon: Radio },
    { href: '/ambulance', label: 'Ambulance & Medical', icon: HeartPulse },
    { href: '/authority/data-quality', label: 'Data Quality & Sources', icon: Database },
    { href: '/authority/reports', label: 'Reports', icon: FileText },
    { href: '/authority/safety-guidelines', label: 'Safety Guidelines', icon: ShieldCheck },
    { href: '/authority/settings', label: 'Settings', icon: Settings },
  ];

  // Citizen Navigation Links
  const citizenNavItems = [
    { href: '/citizen', label: 'Home', icon: Home },
    { href: '/citizen/check-area', label: 'Check My Area', icon: Search },
    { href: '/citizen/alerts', label: 'My Alerts', icon: Bell },
    { href: '/citizen/emergency', label: 'Emergency Help', icon: PhoneCall },
    { href: '/citizen/shelters', label: 'Nearby Shelters', icon: MapPin },
    { href: '/citizen/guidelines', label: 'Safety Guidelines', icon: ShieldCheck },
    { href: '/citizen/profile', label: 'Profile', icon: User },
  ];

  // Response Team Navigation Links
  const responseNavItems = [
    { href: '/response', label: 'Fleet Overview', icon: LayoutDashboard },
    { href: '/response/incidents', label: 'Assigned Incidents', icon: LifeBuoy },
    { href: '/ambulance', label: 'Ambulance Fleet', icon: HeartPulse },
    { href: '/response/map', label: 'Operations Map', icon: Compass },
    { href: '/response/team', label: 'Team & Resources', icon: Package },
    { href: '/response/reports', label: 'Field Reports & Evidence', icon: Camera },
    { href: '/response/profile', label: 'Team Profile', icon: User },
  ];

  const navItems = 
    role === 'citizen'
      ? citizenNavItems
      : role === 'response'
      ? responseNavItems
      : authorityNavItems;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/citizen') return pathname === '/citizen';
    if (href === '/response') return pathname === '/response';
    if (href === '/citizen/alerts' && pathname?.includes('alert')) return true;
    if (href === '/citizen/guidelines' && pathname?.includes('guideline')) return true;
    if (href === '/response/incidents' && pathname?.includes('incident')) return true;
    if (href === '/response/map' && (pathname?.includes('/map') || pathname?.includes('/team-location'))) return true;
    if (href === '/response/team' && (pathname?.includes('/team') || pathname?.includes('/resource-status'))) return true;
    return pathname?.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B192C] text-slate-300 border-r border-slate-800 transition-all duration-300">
      
      {/* Sidebar Header & Collapse Toggle */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-white">
              {role === 'citizen' ? 'Citizen Navigation' : role === 'response' ? 'Fleet Navigation' : 'Command Navigation'}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white hidden lg:block mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Mode Badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 font-medium text-center">
          NEER Platform v1.0
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden lg:block shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="sticky top-[65px] h-[calc(100vh-65px)]">
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs bg-[#0B192C] h-full z-50 flex flex-col shadow-2xl">
            <button
              onClick={onCloseMobile}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
