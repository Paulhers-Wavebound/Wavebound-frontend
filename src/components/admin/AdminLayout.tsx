import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const tabs = [
  { to: '/admin/onboarding', label: 'Onboarding' },
  { to: '/admin/plans', label: 'Plan Review' },
  { to: '/admin/edit', label: 'Edit' },
  { to: '/admin/artists', label: 'All Artists' },
  { to: '/admin/labels', label: 'Labels' },
];

export default function AdminLayout() {
  const { isAdmin, loading, error, retry } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAdmin && !error) {
      toast({ title: 'Access denied', description: 'Admin privileges required.', variant: 'destructive' });
      navigate('/label', { replace: true });
    }
  }, [loading, isAdmin, error, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Skeleton className="h-8 w-48 bg-[#1C1C1E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 font-medium">Couldn't verify admin access</p>
          <p className="text-sm text-[#a8a29e]">{error}</p>
          <button onClick={retry} className="text-sm text-orange-500 underline mt-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ede8dc]">
      <header className="sticky top-0 z-50 border-b border-[#1C1C1E] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="px-4 h-14 flex items-center gap-8">
          <Link to="/admin/onboarding" className="text-lg font-bold tracking-tight text-[#ede8dc] cursor-pointer hover:opacity-80 transition-opacity">
            Wavebound <span className="text-[#a8a29e] font-normal text-sm ml-1">Admin</span>
          </Link>
          <nav className="flex gap-1">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1C1C1E] text-[#ede8dc]'
                      : 'text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#1C1C1E]/50'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="px-2 py-4">
        <Outlet />
      </main>
    </div>
  );
}
