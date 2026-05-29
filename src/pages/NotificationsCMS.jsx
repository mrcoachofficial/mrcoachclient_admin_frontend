import { useState, useEffect } from 'react';
import { Bell, Search, PlusCircle, CheckCircle, Clock, Trash2, ShieldAlert, Play, Pause, Users, Image, Link, ChevronRight, Eye, MousePointerClick, Sparkles } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

export default function NotificationsCMS() {
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalFailed: 0,
    campaignsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [type, setType] = useState('promotion');
  const [priority, setPriority] = useState('medium');
  const [redirectUrl, setRedirectUrl] = useState('home');
  const [customRedirect, setCustomRedirect] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetEmail, setTargetEmail] = useState('');
  const [ctaText, setCtaText] = useState('View Details');
  const [expiresAt, setExpiresAt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Image Upload state
  const [uploading, setUploading] = useState(false);

  const [formStatus, setFormStatus] = useState({ success: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchAnalytics();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/notifications/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/notifications/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setBannerImage(`http://localhost:5000${response.data.imageUrl}`);
      setFormStatus({ success: true, message: 'Banner image uploaded successfully!' });
    } catch (error) {
      setFormStatus({ success: false, message: 'Image upload failed. Supports JPG/PNG/WebP only.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setFormStatus({ success: null, message: '' });
    setSubmitting(true);

    // Format redirect link depending on type selection
    let finalRedirect = redirectUrl;
    if (redirectUrl === 'web') {
      finalRedirect = customRedirect || 'https://mrcoach.in';
    } else if (redirectUrl === 'event') {
      finalRedirect = `/events/${customRedirect || '12'}`;
    } else if (redirectUrl === 'service') {
      finalRedirect = `/services/${customRedirect || '1'}`;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('http://localhost:5000/api/notifications/admin', {
        title,
        description,
        bannerImage,
        type,
        priority,
        redirectUrl: finalRedirect,
        targetAudience,
        ctaText,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormStatus({ success: true, message: 'Notification campaign published and triggered!' });
      // Reset form
      setTitle('');
      setDescription('');
      setBannerImage('');
      setTargetAudience('all');
      setTargetEmail('');
      setCustomRedirect('');
      setExpiresAt('');
      setScheduledAt('');
      
      fetchNotifications();
      fetchAnalytics();
    } catch (error) {
      setFormStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to publish notification campaign'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`http://localhost:5000/api/notifications/admin/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error toggling notification status:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification campaign? All users in-app copies will be deleted.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/notifications/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const search = searchTerm.toLowerCase();
    return (
      n.title?.toLowerCase().includes(search) ||
      n.description?.toLowerCase().includes(search) ||
      n.type?.toLowerCase().includes(search) ||
      n.targetAudience?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Notifications CMS & Push Engine</h1>
          <p className="text-textMuted text-sm">Design target-audience push and in-app notifications. Delivers instantly to all connected mobile clients.</p>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass rounded-xl p-4 border border-borderLine/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-textMuted">Total Campaigns</div>
            <div className="text-xl font-bold text-textMain">{analytics.campaignsCount}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-borderLine/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-textMuted">Delivered</div>
            <div className="text-xl font-bold text-textMain">{analytics.totalDelivered}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-borderLine/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-textMuted">Opened / Read</div>
            <div className="text-xl font-bold text-textMain">{analytics.totalOpened}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-borderLine/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-textMuted">Clicked CTA</div>
            <div className="text-xl font-bold text-textMain">{analytics.totalClicked}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-borderLine/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-textMuted">Failed</div>
            <div className="text-xl font-bold text-textMain">{analytics.totalFailed}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Create Notification Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              <PlusCircle className="w-5 h-5 text-primary" /> Create Campaign
            </h2>

            {formStatus.message && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                formStatus.success 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {formStatus.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
                <span className="leading-normal">{formStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Target Audience</label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Users (Broadcast)</option>
                  <option value="premium">Premium Users only</option>
                  <option value="new">New Users (Registered Last 7 Days)</option>
                  <option value="pending_booking">Users with Pending Booking</option>
                  <option value="completed_booking">Users with Completed Booking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fit Marathon is Live! 🏃"
                  required
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Description (Markdown Supported)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed message contents..."
                  required
                  rows="3"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 resize-none" 
                />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Banner Image URL / Upload</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="http://example.com/banner.png"
                    className="flex-1 bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                  <label className="bg-surfaceLight border border-borderLine text-textMain text-xs font-semibold rounded-xl px-4 py-3 cursor-pointer hover:bg-surface flex items-center gap-1">
                    <Image className="w-3.5 h-3.5" />
                    <span>{uploading ? '...' : 'Upload'}</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                  </label>
                </div>
                {bannerImage && (
                  <img src={bannerImage} alt="Banner Preview" className="w-full h-24 object-cover rounded-xl border border-borderLine" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                  >
                    <option value="promotion">Promotion</option>
                    <option value="reward">Reward</option>
                    <option value="event">Event</option>
                    <option value="booking">Booking Update</option>
                    <option value="reminder">Reminder</option>
                    <option value="announcement">Announcement</option>
                    <option value="offer">Offer</option>
                    <option value="alert">System Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Priority</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Deep Link / Screen</label>
                  <select 
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                  >
                    <option value="home">Home Screen</option>
                    <option value="services">Services Page</option>
                    <option value="bookings">Bookings screen</option>
                    <option value="rewards">Scratch Cards</option>
                    <option value="event">Event Deep-Link</option>
                    <option value="service">Service Deep-Link</option>
                    <option value="web">Web Link URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">CTA Action Text</label>
                  <input 
                    type="text" 
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="View Details"
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>

              {['web', 'event', 'service'].includes(redirectUrl) && (
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">
                    {redirectUrl === 'web' ? 'Redirect Web URL' : redirectUrl === 'event' ? 'Event ID' : 'Service ID'}
                  </label>
                  <input 
                    type="text" 
                    value={customRedirect}
                    onChange={(e) => setCustomRedirect(e.target.value)}
                    placeholder={redirectUrl === 'web' ? 'https://mrcoach.in/promo' : '12'}
                    required
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Schedule Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Expiry Date (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-[#09090B] font-bold rounded-xl py-3.5 px-4 mt-2 transition-all hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Publish Notification'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Campaigns List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLine/50 pb-4 mb-6">
              <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Active Broadcasts
              </h2>
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-textMuted" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search broadcasts..."
                  className="w-full bg-surfaceLight/40 border border-borderLine text-textMain text-xs rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-textMuted">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-textMuted border border-dashed border-borderLine/40 rounded-xl">
                No active notifications found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((n) => (
                  <div key={n._id} className={clsx(
                    "p-4 rounded-xl border transition-all flex gap-4",
                    n.isActive 
                      ? "bg-surfaceLight/25 border-borderLine/40" 
                      : "bg-surfaceLight/10 border-borderLine/10 opacity-70"
                  )}>
                    {n.bannerImage ? (
                      <img src={n.bannerImage} alt={n.title} className="w-16 h-16 object-cover rounded-lg border border-borderLine/30" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surfaceLight/50 flex items-center justify-center text-textMuted border border-borderLine/30">
                        <Bell className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-textMain leading-tight">{n.title}</h3>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          n.priority === 'high' 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {n.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-surfaceLight border border-borderLine text-textMuted uppercase font-semibold">
                          {n.type}
                        </span>
                      </div>

                      <p className="text-xs text-textMuted leading-normal line-clamp-2">{n.description || n.message}</p>
                      
                      <div className="flex items-center gap-3 text-[11px] text-textMuted pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-primary" /> Target: <strong>{n.targetAudience}</strong>
                        </span>
                        {n.redirectUrl && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3.5 h-3.5" /> Link: <code>{n.redirectUrl}</code>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Published: {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Analytics Dashboard Grid for Card */}
                      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-borderLine/20 mt-3 text-center">
                        <div className="bg-surfaceLight/20 p-1.5 rounded-lg border border-borderLine/10">
                          <div className="text-[10px] text-textMuted">Sent</div>
                          <div className="text-xs font-bold text-textMain">{n.sentCount || 0}</div>
                        </div>
                        <div className="bg-surfaceLight/20 p-1.5 rounded-lg border border-borderLine/10">
                          <div className="text-[10px] text-textMuted">Delivered</div>
                          <div className="text-xs font-bold text-indigo-400">{n.deliveredCount || 0}</div>
                        </div>
                        <div className="bg-surfaceLight/20 p-1.5 rounded-lg border border-borderLine/10">
                          <div className="text-[10px] text-textMuted">Opened</div>
                          <div className="text-xs font-bold text-green-400">{n.openedCount || 0}</div>
                        </div>
                        <div className="bg-surfaceLight/20 p-1.5 rounded-lg border border-borderLine/10">
                          <div className="text-[10px] text-textMuted">Clicks</div>
                          <div className="text-xs font-bold text-yellow-500">{n.clickedCount || 0}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-4 border-l border-borderLine/30 pl-4">
                      <button 
                        onClick={() => handleToggleStatus(n._id)}
                        title={n.isActive ? "Pause Campaign" : "Resume Campaign"}
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                          n.isActive 
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20" 
                            : "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                        )}
                      >
                        {n.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteNotification(n._id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
