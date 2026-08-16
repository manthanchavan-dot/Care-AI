import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Stethoscope, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function DashboardShell({ navItems, children }) {
  const { profile, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigation = (onNavigate) => (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-secondary text-primary' : 'text-slate-600 hover:bg-muted'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const sidebarContent = (onNavigate) => (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-4 w-4" />
        </div>
        <span className="font-display text-base font-bold">CareSlot AI</span>
      </div>

      {navigation(onNavigate)}

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-semibold text-slate-800">{profile?.full_name || 'User'}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">{profile?.role}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white px-4 py-6 lg:flex">
        {sidebarContent()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2 font-display text-base font-bold">
            <Stethoscope className="h-5 w-5 text-primary" />
            CareSlot AI
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative flex h-full w-72 flex-col bg-white px-4 py-6 shadow-xl">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation"
                className="absolute right-4 top-5 rounded-lg p-2 text-slate-600 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent(() => setMobileSidebarOpen(false))}
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
