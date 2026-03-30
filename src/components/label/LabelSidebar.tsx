import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, HelpCircle, Settings, LogOut, X, Moon, Sun, Music, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { format } from 'date-fns';

interface LabelSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  dark?: boolean;
  onToggleTheme?: () => void;
}

const getMainNav = (isAdmin: boolean) => [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/label' },
  { id: 'sound-intelligence', label: 'Sound Intelligence', icon: Music, path: '/label/sound-intelligence' },
  ...(isAdmin ? [{ id: 'amplification', label: 'Paid Amplification', icon: Megaphone, path: '/label/amplification' }] : []),
  { id: 'plans', label: 'Content Plans', icon: Calendar, path: '/label/plans' },
];

const bottomNav = [
  { id: 'help', label: 'Help', icon: HelpCircle, path: null },
  { id: 'settings', label: 'Settings', icon: Settings, path: null },
];

export default function LabelSidebar({ onClose, collapsed = false, dark = false, onToggleTheme }: LabelSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { labelName, labelLogoUrl } = useUserProfile();
  const { isAdmin } = useAdminRole();
  const mainNav = getMainNav(isAdmin);

  const displayName = labelName || 'Label Portal';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleNav = (item: typeof mainNav[0]) => {
    if (item.path) {
      navigate(item.path);
      onClose?.();
    }
  };

  const isActive = (item: typeof mainNav[0]) => {
    if (!item.path) return false;
    if (item.id === 'dashboard') {
      return location.pathname === '/label' || location.pathname.startsWith('/label/artist');
    }
    return location.pathname === item.path;
  };

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (collapsed) {
    return (
      <div style={{
        width: 64,
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 16,
      }}>
        <img src={waveboundLogo} alt="Wavebound" style={{ width: 28, height: 28, marginBottom: 28 }} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {mainNav.map(item => {
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                title={item.label + (!item.path ? ' (Coming soon)' : '')}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--ink-tertiary)',
                  transition: 'all 150ms ease',
                  position: 'relative',
                }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: 'var(--accent)' }} />}
                <item.icon size={22} strokeWidth={1.8} />
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ink-tertiary)', transition: 'all 150ms' }}
          >
            {dark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </button>
          {bottomNav.map(item => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => {}}
              style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ink-tertiary)', transition: 'all 150ms' }}
            >
              <item.icon size={20} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 260,
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Close button for mobile overlay */}
      {onClose && (
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-tertiary)', zIndex: 10 }}>
          <X size={20} />
        </button>
      )}

      {/* Greeting */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {labelLogoUrl ? (
            <img
              src={labelLogoUrl}
              alt={displayName}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'contain', flexShrink: 0, border: '2px solid var(--border)' }}
            />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--bg) 0%, var(--border) 100%)',
              border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink-tertiary)' }}>{initials}</span>
            </div>
          )}
          <div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
              {displayName}
            </div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 400, color: 'var(--ink-tertiary)' }}>
              {today}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--border)', marginTop: 28 }} />
      </div>

      {/* Main nav */}
      <nav style={{ padding: '20px 12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mainNav.map(item => {
          const active = isActive(item);
          const comingSoon = !item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="label-nav-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                height: 48, padding: '0 12px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-secondary)',
                fontFamily: '"DM Sans", sans-serif', fontSize: 14,
                fontWeight: active ? 600 : 500,
                transition: 'all 150ms ease',
                position: 'relative', textAlign: 'left', width: '100%',
                opacity: comingSoon ? 0.6 : 1,
              }}
            >
              {active && <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, background: 'var(--accent)' }} />}
              <item.icon size={22} strokeWidth={1.8} style={{ color: active ? 'var(--accent)' : 'var(--ink-tertiary)', transition: 'color 150ms' }} />
              <span>{item.label}</span>
              {comingSoon && <span style={{ fontSize: 10, color: 'var(--ink-faint)', marginLeft: 'auto' }}>Soon</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: 'auto', padding: '0 12px' }}>
        <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="label-nav-item"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 40, padding: '0 12px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--ink-secondary)',
            fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
            transition: 'all 150ms', textAlign: 'left', width: '100%',
          }}
        >
          {dark ? <Sun size={18} strokeWidth={1.8} style={{ color: 'var(--ink-tertiary)' }} /> : <Moon size={18} strokeWidth={1.8} style={{ color: 'var(--ink-tertiary)' }} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {bottomNav.map(item => (
          <button
            key={item.id}
            onClick={() => {}}
            className="label-nav-item"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              height: 40, padding: '0 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--ink-secondary)',
              fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
              transition: 'all 150ms', textAlign: 'left', width: '100%',
            }}
          >
            <item.icon size={18} strokeWidth={1.8} style={{ color: 'var(--ink-tertiary)' }} />
            {item.label}
          </button>
        ))}

        <button
          onClick={handleSignOut}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 400,
            color: 'var(--ink-tertiary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '8px 12px', marginTop: 4,
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-tertiary)')}
        >
          Log out
        </button>

        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          color: 'var(--ink-faint)', letterSpacing: '0.5px',
          padding: '12px 12px 16px', textAlign: 'left',
        }}>
          Powered by Wavebound
        </div>
      </div>
    </div>
  );
}
