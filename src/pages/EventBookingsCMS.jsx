import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Calendar, IndianRupee, Ticket, Sparkles, TrendingUp, Users, ArrowUpRight, CheckCircle2, AlertCircle, Eye, RefreshCw, Download, X } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

export default function EventBookingsCMS() {
  const [bookings, setBookings] = useState([]);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalAttendees: 0,
    paidBookingsCount: 0,
    topPerformingEvent: { title: 'N/A', ticketsSold: 0, revenue: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filters state
  const [filterEventName, setFilterEventName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Auto-polling interval reference
  const pollingRef = useRef(null);

  const fetchLiveBookingData = async () => {
    try {
      const bookingsResponse = await axios.get('http://localhost:5000/api/admin/event-bookings');
      setBookings(bookingsResponse.data);

      const overviewResponse = await axios.get('http://localhost:5000/api/admin/event-bookings/overview');
      setOverview(overviewResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event bookings:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBookingData();

    // Polling refresh every 5 seconds for real-time updates
    pollingRef.current = setInterval(() => {
      fetchLiveBookingData();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Filter and search logic
  const filteredBookings = bookings.filter(b => {
    // 1. Search Query (name, phone, email, event title)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (b.user_name || '').toLowerCase();
      const phone = (b.verified_mobile_number || '').toLowerCase();
      const email = (b.user_email || '').toLowerCase();
      const title = (b.event_title || '').toLowerCase();
      const paymentId = (b.payment_id || '').toLowerCase();

      const matchesSearch = name.includes(term) || phone.includes(term) || email.includes(term) || title.includes(term) || paymentId.includes(term);
      if (!matchesSearch) return false;
    }

    // 2. Event Name Filter
    if (filterEventName) {
      const title = (b.event_title || '').toLowerCase();
      if (!title.includes(filterEventName.toLowerCase())) return false;
    }

    // 3. Payment Status Filter
    if (filterPaymentStatus !== 'ALL') {
      const status = (b.payment_status || '').toUpperCase();
      if (status !== filterPaymentStatus) return false;
    }

    // 4. Amount Range Filter
    const amount = Number(b.amount_paid) || 0;
    if (filterMinAmount && amount < Number(filterMinAmount)) return false;
    if (filterMaxAmount && amount > Number(filterMaxAmount)) return false;

    // 5. Date Range Filter
    if (filterStartDate || filterEndDate) {
      const bDate = new Date(b.booking_date_time);
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (bDate < start) return false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (bDate > end) return false;
      }
    }

    return true;
  });

  // Export event bookings reports to Excel
  const handleExportReport = () => {
    if (filteredBookings.length === 0) return;

    const exportData = filteredBookings.map(b => ({
      'User Name': b.user_name || '',
      'Verified Mobile': b.verified_mobile_number || '',
      'Email': b.user_email || '',
      'Event Title': b.event_title || '',
      'Amount Paid': b.amount_paid || 0,
      'Ticket Quantity': b.ticket_quantity || 1,
      'Booking Date': b.booking_date_time ? new Date(b.booking_date_time).toLocaleString() : '',
      'Payment ID': b.payment_id || '',
      'Status': b.payment_status || '',
      'Source': b.booking_source || 'website'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Event Bookings');
    XLSX.writeFile(workbook, `MrCoach_Event_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  const getUniqueEventTitles = () => {
    const titles = bookings.map(b => b.event_title);
    return [...new Set(titles)].filter(Boolean);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">🎟 Website Event Bookings</h1>
          <p className="text-textMuted text-sm">Real-time sync logs and customer CRM integration from web event pages.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all border",
              showFilters 
                ? "bg-primary/20 border-primary text-primary" 
                : "bg-surfaceLight border-borderLine text-textMuted hover:text-textMain"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={handleExportReport}
            disabled={filteredBookings.length === 0}
            className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button 
            onClick={fetchLiveBookingData}
            className="flex items-center justify-center p-2 bg-surfaceLight border border-borderLine rounded-lg text-textMuted hover:text-textMain transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Event Revenue" value={`₹${overview.totalRevenue.toLocaleString()}`} icon={IndianRupee} desc="All successfully paid bookings" />
        <StatCard title="Total Tickets Sold" value={overview.totalTicketsSold} icon={Ticket} desc="Cumulative tickets purchased" />
        <StatCard title="Total Attendees" value={overview.totalAttendees} icon={Users} desc="Distinct contact phone numbers" />
        <StatCard title="Paid Bookings" value={overview.paidBookingsCount} icon={CheckCircle2} desc="Count of paid transactions" />
        <StatCard title="Top Performing Event" value={overview.topPerformingEvent.title} icon={TrendingUp} desc={`${overview.topPerformingEvent.ticketsSold} tickets sold • ₹${overview.topPerformingEvent.revenue.toLocaleString()}`} />
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="glass rounded-2xl p-6 mb-8 border border-borderLine/80 grid grid-cols-1 md:grid-cols-4 gap-4 transition-all">
          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Event Title</label>
            <select 
              value={filterEventName}
              onChange={(e) => setFilterEventName(e.target.value)}
              className="w-full bg-surface border border-borderLine rounded-lg py-2 px-3 text-sm text-textMain focus:outline-none focus:border-primary/50"
            >
              <option value="">All Events</option>
              {getUniqueEventTitles().map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Payment Status</label>
            <select 
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full bg-surface border border-borderLine rounded-lg py-2 px-3 text-sm text-textMain focus:outline-none focus:border-primary/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Booking Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-surface border border-borderLine rounded-lg py-1.5 px-2 text-xs text-textMain focus:outline-none focus:border-primary/50"
              />
              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-surface border border-borderLine rounded-lg py-1.5 px-2 text-xs text-textMain focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Amount Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number"
                placeholder="Min"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                className="bg-surface border border-borderLine rounded-lg py-1.5 px-2 text-xs text-textMain focus:outline-none"
              />
              <input 
                type="number"
                placeholder="Max"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                className="bg-surface border border-borderLine rounded-lg py-1.5 px-2 text-xs text-textMain focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main CRM Table Container */}
      <div className="glass rounded-2xl overflow-hidden border border-borderLine">
        <div className="flex items-center justify-between p-4 border-b border-borderLine bg-surfaceLight/30">
          <p className="text-sm font-semibold text-textMain">Sync Log Table</p>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search Name, Phone, Event or Payment ID..." 
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
              <tr className="border-b border-borderLine bg-surfaceLight/20 text-textMuted text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 w-12 text-center">S.No</th>
                <th className="p-4">Customer Info</th>
                <th className="p-4">Event Details</th>
                <th className="p-4 text-center">Tickets</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Payment Status</th>
                <th className="p-4">Booking Date</th>
                <th className="p-4">Booking Source</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLine/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-textMuted font-medium">
                    Loading synced event bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-textMuted">
                    No synced bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, index) => (
                  <tr key={b._id} className="hover:bg-surfaceLight/25 transition-colors">
                    <td className="p-4 text-center font-medium text-textMuted w-12">{index + 1}</td>
                    <td className="p-4">
                      <p className="font-semibold text-textMain">{b.user_name || 'Guest User'}</p>
                      <p className="text-xs text-textMuted select-all">{b.verified_mobile_number}</p>
                      {b.user_email && <p className="text-[11px] text-textMuted">{b.user_email}</p>}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-textMain">{b.event_title}</p>
                      <span className="text-[10px] text-textMuted select-all font-mono uppercase bg-surfaceLight border border-borderLine px-1.5 py-0.5 rounded">
                        ID: {b.event_id}
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold text-textMain">{b.ticket_quantity || 1}</td>
                    <td className="p-4 text-right font-mono font-semibold text-textMain">
                      ₹{(b.amount_paid || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                        b.payment_status?.toLowerCase() === 'paid'
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-textMain">
                        {b.booking_date_time ? new Date(b.booking_date_time).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-[10px] text-textMuted">
                        {b.booking_date_time ? new Date(b.booking_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                        {b.booking_source || 'website'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleOpenDetails(b)}
                        className="p-1.5 hover:bg-surfaceLight rounded text-textMuted hover:text-primary transition-all duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {detailModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-borderLine w-full max-w-2xl rounded-2xl overflow-hidden glass animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-borderLine">
              <div>
                <h2 className="text-lg font-bold text-textMain">Synced Event Ticket Details</h2>
                <p className="text-xs text-textMuted">Database Reference: {selectedBooking._id}</p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1 hover:bg-surfaceLight rounded-lg text-textMuted hover:text-textMain transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Section: Customer Details */}
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-surfaceLight/30 p-4 rounded-xl border border-borderLine/50 text-xs">
                  <div>
                    <p className="text-textMuted mb-0.5">Name</p>
                    <p className="font-semibold text-textMain">{selectedBooking.user_name}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Verified Mobile</p>
                    <p className="font-semibold text-textMain font-mono">{selectedBooking.verified_mobile_number}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Email Address</p>
                    <p className="font-semibold text-textMain">{selectedBooking.user_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">App User Mapping</p>
                    {selectedBooking.userId ? (
                      <span className="text-[10px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase">
                        Mapped (ID: {selectedBooking.userId})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                        Guest Booking
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Event & Payment Details */}
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Event & Payment Reference</h3>
                <div className="grid grid-cols-2 gap-4 bg-surfaceLight/30 p-4 rounded-xl border border-borderLine/50 text-xs">
                  <div>
                    <p className="text-textMuted mb-0.5">Event Name</p>
                    <p className="font-semibold text-textMain">{selectedBooking.event_title}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Event ID</p>
                    <p className="font-semibold text-textMain font-mono">{selectedBooking.event_id}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Payment Status</p>
                    <span className={clsx(
                      "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      selectedBooking.payment_status?.toLowerCase() === 'paid'
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {selectedBooking.payment_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Amount Paid</p>
                    <p className="font-semibold text-textMain font-mono">
                      ₹{selectedBooking.amount_paid} {selectedBooking.currency || 'INR'} ({selectedBooking.ticket_quantity || 1} Ticket(s))
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-borderLine/50 pt-2 mt-1">
                    <p className="text-textMuted mb-0.5">Razorpay / Payment Gateway ID</p>
                    <p className="font-mono text-textMain select-all">{selectedBooking.payment_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Website Order ID</p>
                    <p className="font-mono text-textMain select-all">{selectedBooking.website_order_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Payment Gateway Order ID</p>
                    <p className="font-mono text-textMain select-all">{selectedBooking.payment_gateway_order_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">Booking External Reference ID</p>
                    <p className="font-mono text-textMain select-all">{selectedBooking.booking_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Section: Synchronization & Metadata */}
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Sync Metadata</h3>
                <div className="grid grid-cols-2 gap-4 bg-surfaceLight/30 p-4 rounded-xl border border-borderLine/50 text-xs">
                  <div>
                    <p className="text-textMuted mb-0.5">Sync Syncing Date</p>
                    <p className="font-semibold text-textMain">
                      {selectedBooking.syncedAt ? new Date(selectedBooking.syncedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-textMuted mb-0.5">External Date of Event</p>
                    <p className="font-semibold text-textMain">
                      {selectedBooking.event_date ? new Date(selectedBooking.event_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-textMuted mb-1">Additional Payload Metadata</p>
                    <pre className="w-full bg-surface border border-borderLine p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-textMain max-h-40">
                      {JSON.stringify(selectedBooking.metadata || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-borderLine bg-surfaceLight/20">
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="bg-surfaceLight hover:bg-surfaceLight/80 border border-borderLine px-5 py-2.5 rounded-xl text-sm font-semibold text-textMain transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, desc }) {
  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <p className="text-textMuted font-semibold text-xs tracking-wider uppercase">{title}</p>
        <div className="p-2 bg-surfaceLight rounded-lg border border-borderLine">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-textMain tracking-tight mb-1 truncate select-all">{value}</h3>
        <p className="text-[11px] text-textMuted truncate">{desc}</p>
      </div>
    </div>
  );
}
