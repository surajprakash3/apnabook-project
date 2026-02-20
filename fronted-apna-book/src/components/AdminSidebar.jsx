import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { label: 'Dashboard', icon: '🏠', to: '/admin/dashboard' },
  { label: 'Uploads', icon: '📚', to: '/admin/books' },
  { label: 'Orders', icon: '📦', to: '/admin/orders' },
  { label: 'Users', icon: '👥', to: '/admin/users' },
  { label: 'Categories', icon: '🏷️', to: '/admin/categories' },
  { label: 'Reports', icon: '📊', to: '/admin/reports' }
];

const getActiveItem = (pathname) => navItems.find((item) => item.to === pathname);

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeItem = useMemo(() => getActiveItem(location.pathname), [location.pathname]);
  const showLabels = !isCollapsed || isOpen;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#0b0d12]/95 px-5 py-4 text-white/90 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admin</p>
          <p className="text-sm font-semibold">{activeItem?.label ?? 'Dashboard'}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold">
          AP
        </div>
      </div>

      <div
        className={`admin-sidebar-overlay lg:hidden ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        role="presentation"
      />

      <aside
        className={`admin-sidebar-panel fixed inset-y-0 left-0 z-40 flex h-screen flex-col text-white transition-all duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          isCollapsed ? 'lg:w-[84px]' : 'lg:w-[260px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between px-6 py-6 ${isCollapsed ? 'lg:px-4' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <img className="admin-logo" src={logo} alt="Pustakly logo" />
            {showLabels && (
              <div>
                <p className="text-lg font-semibold">Pustakly</p>
                <span className="text-xs text-white/60">Admin Console</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 lg:inline-flex"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? '➡️' : '⬅️'}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className={`flex flex-1 flex-col gap-2 ${isCollapsed ? 'lg:px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`admin-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'is-active' : 'text-white/70 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {showLabels && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`pb-6 ${isCollapsed ? 'lg:px-2' : 'px-4'}`}>
          <button
            type="button"
            className="admin-nav-link flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
            onClick={handleLogout}
          >
            <span className="text-lg">🚪</span>
            {showLabels && 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
}
