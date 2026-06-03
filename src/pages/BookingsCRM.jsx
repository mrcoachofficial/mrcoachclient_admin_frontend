import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

// Placeholder data representing MongoDB output
const mockBookings = [
  { id: '1', name: 'Rahul Kumar', mobile: '+91 9876543210', service: 'Strength Training', date: '24 May 2026', time: '09:00 AM', mode: 'Online', type: 'Demo', status: 'pending', price: 99 },
  { id: '2', name: 'Priya Sharma', mobile: '+91 9123456789', service: 'Weight Loss Diet', date: '25 May 2026', time: '11:00 AM', mode: 'Online', type: 'Enquiry', status: 'confirmed', price: 0 },
  { id: '3', name: 'Arun M', mobile: '+91 9988776655', service: 'Physiotherapy', date: '26 May 2026', time: '05:00 PM', mode: 'Home Visit', type: 'Demo', status: 'pending', price: 99 },
];

export default function BookingsCRM() {
  const [activeTab, setActiveTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/bookings');
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/bookings/${id}`);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === 'All' ||
      (activeTab === 'Demos' && b.bookingType?.toLowerCase() === 'demo') ||
      (activeTab === 'Enquiries' && b.bookingType?.toLowerCase() === 'enquiry');

    const name = b.user?.name || 'Guest User';
    const mobile = b.mobileNumber || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mobile.includes(searchTerm);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Bookings & Leads</h1>
          <p className="text-textMuted text-sm">Manage your incoming clients and demo requests.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surfaceLight border border-borderLine px-4 py-2 rounded-lg text-sm text-textMuted hover:text-textMain transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Toolbar & Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-borderLine bg-surfaceLight/30">
          <div className="flex gap-2 bg-surface p-1 rounded-lg border border-borderLine">
            {['All', 'Demos', 'Enquiries'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-primary text-black" : "text-textMuted hover:text-textMain"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search Name or Mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-borderLine rounded-lg py-2 pl-9 pr-4 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-borderLine bg-surfaceLight/20 text-textMuted text-xs uppercase tracking-wider">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Client Info</th>
                <th className="p-4 font-medium">Service</th>
                <th className="p-4 font-medium">Slot</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Payment</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLine/50 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-textMuted">Loading live bookings from database...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-textMuted">No bookings found.</td></tr>
              ) : filteredBookings.map((booking, index) => (
                <tr key={booking._id} className="hover:bg-surfaceLight/30 transition-colors">
                  <td className="p-4 text-center font-medium text-textMuted w-16">
                    {index + 1}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-textMain">{booking.user?.name || 'Guest User'}</p>
                    <p className="text-xs text-textMuted">{booking.mobileNumber}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-textMain">{booking.serviceName}</p>
                    <span className="text-[10px] uppercase border border-borderLine px-2 py-0.5 rounded text-textMuted mt-1 inline-block">
                      {booking.mode}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-textMain">{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="text-xs text-textMuted">{booking.time}</p>
                  </td>
                  <td className="p-4">
                    {booking.bookingType?.toLowerCase() === 'demo' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Demo ₹{booking.price}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surfaceLight text-textMuted border border-borderLine">
                        Enquiry
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {booking.bookingType?.toLowerCase() === 'demo' ? (
                      <div className="flex flex-col gap-0.5">
                        <span className={clsx(
                          "inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          booking.paymentStatus === 'paid'
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                        {booking.razorpayPaymentId && (
                          <span className="text-[10px] text-textMuted font-mono select-all">
                            {booking.razorpayPaymentId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-textMuted text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteBooking(booking._id)}
                      className="p-2 text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Booking"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
