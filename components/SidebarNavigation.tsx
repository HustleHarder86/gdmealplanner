"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/src/contexts/SidebarContext";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  Home,
  Book,
  BookUser,
  Calendar,
  Activity,
  Apple,
  GraduationCap,
  Palette,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Home", icon: Home },
      // Dashboard will be added later when we have it
    ],
  },
  {
    label: "Meal Planning",
    items: [
      { href: "/recipes", label: "Recipes", icon: Book },
      { href: "/my-recipes", label: "My Recipes", icon: BookUser, requiresAuth: true },
      { href: "/meal-planner-v2", label: "Meal Planner", icon: Calendar },
    ],
  },
  {
    label: "Tracking",
    items: [
      { href: "/tracking/glucose", label: "Glucose", icon: Activity, requiresAuth: true },
      { href: "/tracking/nutrition", label: "Nutrition", icon: Apple, requiresAuth: true },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/education", label: "Learn", icon: GraduationCap },
      { href: "/components", label: "UI Demo", icon: Palette, badge: "Demo" },
    ],
  },
];

const accountItems: NavItem[] = [
  { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
];

export default function SidebarNavigation() {
  const { isExpanded, isMobileOpen, toggleExpanded, toggleMobile, closeMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      closeMobile();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActivePath = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-neutral-600" />
        ) : (
          <Menu className="h-5 w-5 text-neutral-600" />
        )}
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity sidebar-backdrop"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <nav
        data-sidebar
        className={`fixed left-0 top-0 h-full bg-white border-r border-neutral-200 shadow-sm z-40 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-16"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <Link 
              href="/" 
              className={`flex items-center transition-all duration-300 ${
                isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"
              }`}
              onClick={closeMobile}
            >
              <span className="text-2xl font-bold text-primary-600">PPP</span>
              {isExpanded && (
                <span className="ml-2 text-sm font-medium text-neutral-800 truncate">
                  Pregnancy Plate Planner
                </span>
              )}
            </Link>
            
            {/* Desktop Toggle Button */}
            <button
              onClick={toggleExpanded}
              className="hidden lg:flex p-1 rounded-md hover:bg-neutral-100 transition-colors"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-neutral-500" />
              )}
            </button>
          </div>

          {/* User Profile Section */}
          {user && (
            <div className="p-4 border-b border-neutral-200">
              <div className={`flex items-center ${isExpanded ? "space-x-3" : "justify-center"}`}>
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                {isExpanded && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-neutral-500">Signed in</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 sidebar-scrollbar">
            {navigationGroups.map((group) => (
              <div key={group.label} className="mb-6">
                {isExpanded && (
                  <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    {group.label}
                  </h3>
                )}
                <ul className="space-y-1 px-2">
                  {group.items.map((item) => {
                    // Skip auth-required items if user is not logged in
                    if (item.requiresAuth && !user) return null;
                    
                    const Icon = item.icon;
                    const isActive = isActivePath(item.href);
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors group relative ${
                            isActive
                              ? "bg-primary-100 text-primary-700 border border-primary-200"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          }`}
                          title={!isExpanded ? item.label : undefined}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isExpanded ? "mr-3" : "mx-auto"
                            } ${isActive ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-700"}`}
                          />
                          {isExpanded && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-200 text-neutral-700 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          
                          {/* Tooltip for collapsed state */}
                          {!isExpanded && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                              {item.label}
                              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Account Section */}
          <div className="border-t border-neutral-200 p-2">
            {user && (
              <>
                {isExpanded && (
                  <h3 className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Account
                  </h3>
                )}
                <ul className="space-y-1">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.href);
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors group relative ${
                            isActive
                              ? "bg-primary-100 text-primary-700 border border-primary-200"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          }`}
                          title={!isExpanded ? item.label : undefined}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isExpanded ? "mr-3" : "mx-auto"
                            } ${isActive ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-700"}`}
                          />
                          {isExpanded && <span className="flex-1 truncate">{item.label}</span>}
                          
                          {/* Tooltip for collapsed state */}
                          {!isExpanded && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                              {item.label}
                              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  
                  {/* Sign Out Button */}
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-3 py-2 rounded-lg transition-colors group relative text-neutral-700 hover:bg-red-50 hover:text-red-600"
                      title={!isExpanded ? "Sign Out" : undefined}
                    >
                      <LogOut
                        className={`h-5 w-5 ${
                          isExpanded ? "mr-3" : "mx-auto"
                        } text-neutral-500 group-hover:text-red-500`}
                      />
                      {isExpanded && <span className="flex-1 text-left truncate">Sign Out</span>}
                      
                      {/* Tooltip for collapsed state */}
                      {!isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                          Sign Out
                          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  </li>
                </ul>
              </>
            )}
            
            {/* Sign In Button for non-authenticated users */}
            {!user && (
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center px-3 py-2 rounded-lg transition-colors group relative bg-primary-600 text-white hover:bg-primary-700"
                title={!isExpanded ? "Sign In" : undefined}
              >
                <User
                  className={`h-5 w-5 ${isExpanded ? "mr-3" : "mx-auto"}`}
                />
                {isExpanded && <span className="flex-1 truncate">Sign In</span>}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                    Sign In
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                  </div>
                )}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}