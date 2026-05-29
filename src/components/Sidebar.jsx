import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, User, CalendarDays, Settings, Image as ImageIcon, Box, LogOut, Gift, Bell, Sliders, Library, Ticket } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Users, label: 'Bookings & Leads', path: '/bookings' },
  { icon: User, label: 'Users CMS', path: '/users' },
  { icon: Ticket, label: 'Event Bookings', path: '/event-bookings' },
  { icon: ImageIcon, label: 'Services CMS', path: '/services' },
  { icon: Sliders, label: 'Home Carousel CMS', path: '/carousel' },
  { icon: Library, label: 'Service Media CMS', path: '/service-media' },
  { icon: CalendarDays, label: 'Slots', path: '/slots' },
  { icon: Box, label: 'Products', path: '/products' },
  { icon: Gift, label: 'Rewards CMS', path: '/rewards' },
  { icon: Bell, label: 'Notifications CMS', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login'; // Force full reload to clear App.jsx state
  };

  return (
    <aside className="w-64 border-r border-borderLine bg-surface flex flex-col glass z-10 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-borderLine">
        <h1 className="text-xl font-bold tracking-wider text-textMain">
          MR<span className="text-primary">COACH</span>
        </h1>
        <span className="ml-2 text-[10px] uppercase tracking-widest text-primary border border-primary/30 px-1.5 py-0.5 rounded bg-primary/10">Admin</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-4">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-textMuted hover:bg-surfaceLight hover:text-textMain"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-borderLine">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-textMain">Admin User</p>
            <p className="text-xs text-textMuted">admin@mrcoach.in</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
