import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Users, CalendarCheck, IndianRupee, Activity, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

const data = [
  { name: 'Mon', bookings: 4, revenue: 396 },
  { name: 'Tue', bookings: 7, revenue: 693 },
  { name: 'Wed', bookings: 5, revenue: 495 },
  { name: 'Thu', bookings: 12, revenue: 1188 },
  { name: 'Fri', bookings: 8, revenue: 792 },
  { name: 'Sat', bookings: 15, revenue: 1485 },
  { name: 'Sun', bookings: 11, revenue: 1089 },
];

export default function Overview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    paidDemos: 0,
    freeEnquiries: 0,
    totalClients: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const overviewResponse = await axios.get(`${window.API_BASE_URL}/api/admin/overview`);
        const { totalClients, totalBookings, totalEnquiries, paidDemos, totalRevenue } = overviewResponse.data;

        const bookingsResponse = await axios.get(`${window.API_BASE_URL}/api/admin/bookings`);
        const bookings = bookingsResponse.data;

        setStats({
          totalRevenue,
          totalBookings,
          paidDemos,
          freeEnquiries: totalEnquiries,
          totalClients
        });

        // Get 4 most recent
        const sorted = [...bookings].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        setRecentBookings(sorted.slice(0, 4));
        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Overview Dashboard</h1>
          <p className="text-textMuted text-sm">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="text-sm bg-surfaceLight px-4 py-2 rounded-lg border border-borderLine text-textMuted">
          Last 7 Days
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} trend="+0%" />
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={CalendarCheck} trend="+0%" />
        <StatCard title="Paid Demos" value={stats.paidDemos} icon={Activity} trend="+0%" />
        <StatCard title="Free Enquiries" value={stats.freeEnquiries} icon={MessageSquare} trend="0%" negative />
        <StatCard title="Total Clients" value={stats.totalClients} icon={Users} trend="+0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Revenue & Bookings Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C518" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F5C518" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px' }}
                  itemStyle={{ color: '#E2B308' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F5C518" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-textMuted text-sm">Loading recent activity...</p>
            ) : recentBookings.length === 0 ? (
              <p className="text-textMuted text-sm">No recent bookings found.</p>
            ) : recentBookings.map((b) => (
              <div key={b._id} className="flex items-center gap-4 border-b border-borderLine/50 pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-surfaceLight flex items-center justify-center">
                  <span className="text-xs text-textMuted">{b.user?.name ? b.user.name.substring(0,2).toUpperCase() : 'US'}</span>
                </div>
                <div>
                  <p className="text-sm text-textMain font-medium">{b.user?.name || 'New Booking Request'}</p>
                  <p className="text-xs text-textMuted">{b.bookingType === 'demo' ? `Demo ₹${b.price || 99}` : 'Enquiry'} • {b.serviceName}</p>
                </div>
                <div className="ml-auto text-xs text-textMuted">{new Date(b.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, negative }) {
  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <p className="text-textMuted font-medium text-sm">{title}</p>
        <div className="p-2 bg-surfaceLight rounded-lg border border-borderLine">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-textMain tracking-tight">{value}</h3>
        <div className={clsx("flex items-center text-sm font-medium", negative ? "text-red-400" : "text-green-400")}>
          <ArrowUpRight className={clsx("w-4 h-4 mr-1", negative && "rotate-90")} />
          {trend}
        </div>
      </div>
    </div>
  );
}
