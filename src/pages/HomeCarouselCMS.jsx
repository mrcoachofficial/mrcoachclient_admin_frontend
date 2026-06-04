import { useState, useEffect } from 'react';
import { Sparkles, PlusCircle, CheckCircle, Clock, Trash2, ShieldAlert, Play, Pause, Image as ImageIcon, Link, ArrowUp, ArrowDown, Move } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

export default function HomeCarouselCMS() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Explore Now');
  const [redirectType, setRedirectType] = useState('none');
  const [redirectId, setRedirectId] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [redirectionUrl, setRedirectionUrl] = useState('');

  // Image upload and ratio validation states
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageDimensions, setImageDimensions] = useState(null);

  const [formStatus, setFormStatus] = useState({ success: null, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${window.API_BASE_URL}/api/home-banners/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageError('');
    setImageDimensions(null);

    // 1. Enforce aspect ratio validation (Approx 4:5 ratio)
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      const targetRatio = 1.77; // 16:9 Landscape
      const tolerance = 0.3; // Allow some variations

      setImageDimensions({ width, height });

      if (Math.abs(ratio - targetRatio) > tolerance) {
        setImageError(`Warning: Image aspect ratio is ${width}:${height} (~${(width/height).toFixed(2)}). A 16:9 aspect ratio (e.g. 1920x1080) is recommended to prevent stretching.`);
      }

      // Proceed to upload anyway but show ratio warning
      const formData = new FormData();
      formData.append('image', file);
      setUploading(true);

      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        setImageUrl(`${window.API_BASE_URL}${response.data.imageUrl}`);
        setFormStatus({ success: true, message: 'Carousel banner uploaded successfully!' });
      } catch (error) {
        setFormStatus({ success: false, message: 'Image upload failed.' });
      } finally {
        setUploading(false);
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ success: null, message: '' });
    setSubmitting(true);

    const payload = {
      imageUrl,
      title,
      subtitle,
      ctaText,
      redirectType,
      redirectId,
      displayOrder: parseInt(displayOrder) || 0,
      isActive,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      redirectionUrl
    };

    try {
      const token = localStorage.getItem('adminToken');
      if (editingId) {
        await axios.put(`${window.API_BASE_URL}/api/home-banners/admin/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormStatus({ success: true, message: 'Carousel slide updated successfully!' });
      } else {
        await axios.post(`${window.API_BASE_URL}/api/home-banners/admin`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormStatus({ success: true, message: 'Carousel slide created successfully!' });
      }

      resetForm();
      fetchBanners();
    } catch (error) {
      setFormStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to save carousel slide'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setImageUrl('');
    setTitle('');
    setSubtitle('');
    setCtaText('Explore Now');
    setRedirectType('none');
    setRedirectId('');
    setDisplayOrder('0');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setRedirectionUrl('');
    setEditingId(null);
    setImageError('');
    setImageDimensions(null);
  };

  const handleEdit = (banner) => {
    setEditingId(banner._id);
    setImageUrl(banner.imageUrl);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setCtaText(banner.ctaText || 'Explore Now');
    setRedirectType(banner.redirectType || 'none');
    setRedirectId(banner.redirectId || '');
    setDisplayOrder(banner.displayOrder.toString());
    setIsActive(banner.isActive);
    setStartDate(banner.startDate ? banner.startDate.substring(0, 16) : '');
    setEndDate(banner.endDate ? banner.endDate.substring(0, 16) : '');
    setRedirectionUrl(banner.redirectionUrl || '');
  };

  const handleToggleActive = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${window.API_BASE_URL}/api/home-banners/admin/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this carousel slide?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${window.API_BASE_URL}/api/home-banners/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const adjustOrder = async (banner, direction) => {
    const change = direction === 'up' ? -1 : 1;
    const newOrder = Math.max(0, banner.displayOrder + change);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${window.API_BASE_URL}/api/home-banners/admin/${banner._id}`, {
        displayOrder: newOrder
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      console.error('Error ordering banner:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Home Carousel CMS</h1>
          <p className="text-textMuted text-sm">Manage dynamic app home sliders, aspect ratio alignment, deep links, scheduling, and live visibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create / Edit Form */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              <PlusCircle className="w-5 h-5 text-primary" /> {editingId ? 'Edit Slide' : 'Create Carousel Slide'}
            </h2>

            {formStatus.message && (
              <div className={clsx(
                "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border",
                formStatus.success 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              )}>
                {formStatus.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
                <span className="leading-normal">{formStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Banner Image URL / Upload</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="http://example.com/slide.png"
                    required
                    className="flex-1 bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                  <label className="bg-surfaceLight border border-borderLine text-textMain text-xs font-semibold rounded-xl px-4 py-3 cursor-pointer hover:bg-surface flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{uploading ? '...' : 'Upload'}</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                  </label>
                </div>

                {imageError && (
                  <p className="text-xs text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3 mb-2">{imageError}</p>
                )}

                {imageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-borderLine/50 bg-black/20 flex items-center justify-center p-2">
                    <img src={imageUrl} alt="Slide Preview" className="w-[320px] h-[180px] object-cover rounded-lg shadow-lg border border-borderLine/30" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-1 rounded">
                      Mobile Preview Frame (16:9 Landscape)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Slide Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Fitness Bootcamp 🏅"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Subtitle (Optional)</label>
                <input 
                  type="text" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Get 20% off all booking sessions this week"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">CTA Button Text</label>
                  <input 
                    type="text" 
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Explore Now"
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Display Order</label>
                  <input 
                    type="number" 
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Redirect Link Type</label>
                  <select 
                    value={redirectType}
                    onChange={(e) => setRedirectType(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                  >
                    <option value="none">No Redirection</option>
                    <option value="service">Services Category Screen</option>
                    <option value="event">Upcoming Event Screen</option>
                    <option value="rewards">Scratch Card Rewards</option>
                    <option value="booking">All Bookings Page</option>
                    <option value="product">Products Marketplace</option>
                    <option value="web">External Web URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Redirect Target (ID/URL)</label>
                  <input 
                    type="text" 
                    value={redirectId}
                    onChange={(e) => setRedirectId(e.target.value)}
                    placeholder={redirectType === 'web' ? 'https://google.com' : redirectType === 'service' ? 'Yoga' : '123'}
                    disabled={redirectType === 'none'}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 disabled:opacity-40" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Redirection URL</label>
                <input 
                  type="text" 
                  value={redirectionUrl}
                  onChange={(e) => setRedirectionUrl(e.target.value)}
                  placeholder="https://mrcoach.in/events/event-1"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Publish Time</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Expiry Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 ml-1">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-borderLine text-primary bg-surfaceLight focus:ring-primary/20 w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-textMain font-medium">Active & Visible inside Client App</label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-[#09090B] font-bold rounded-xl py-3.5 px-4 transition-all hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Slide' : 'Publish Banner'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-surfaceLight border border-borderLine text-textMain font-semibold rounded-xl py-3.5 px-4 hover:bg-surface text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Banners List */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 border-b border-borderLine/50 pb-4 flex items-center gap-2">
              <Move className="w-5 h-5 text-primary" /> Active Sliders ({banners.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-textMuted">Loading slides...</div>
            ) : banners.length === 0 ? (
              <div className="py-12 text-center text-textMuted border border-dashed border-borderLine/40 rounded-xl">
                No sliders configured. Publish your first banner on the left!
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((b) => (
                  <div key={b._id} className={clsx(
                    "p-4 rounded-xl border transition-all flex gap-4 items-start",
                    b.isActive ? "bg-surfaceLight/25 border-borderLine/40" : "bg-surfaceLight/10 border-borderLine/10 opacity-70"
                  )}>
                    <img src={b.imageUrl} alt={b.title} className="w-32 h-18 object-cover rounded-lg border border-borderLine/30 shadow" />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-textMain leading-tight">{b.title || 'Untitled Banner'}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold">
                          Order: {b.displayOrder}
                        </span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          b.isActive ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                          {b.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      {b.subtitle && <p className="text-xs text-textMuted leading-normal">{b.subtitle}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-textMuted pt-2">
                        <span className="flex items-center gap-1">
                          <Link className="w-3.5 h-3.5 text-primary" /> Redirection: <strong>{b.redirectType}</strong> {b.redirectId && <code>({b.redirectId})</code>}
                          {b.redirectionUrl && <span className="ml-2 text-textMain font-mono font-medium">({b.redirectionUrl})</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Start: {new Date(b.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 border-l border-borderLine/30 pl-4">
                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => adjustOrder(b, 'up')}
                          className="w-7 h-7 bg-surfaceLight border border-borderLine rounded hover:bg-surface text-textMain flex items-center justify-center"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => adjustOrder(b, 'down')}
                          className="w-7 h-7 bg-surfaceLight border border-borderLine rounded hover:bg-surface text-textMain flex items-center justify-center"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-1.5 mt-1">
                        <button 
                          onClick={() => handleToggleActive(b._id)}
                          className={clsx(
                            "w-7 h-7 rounded border transition-all flex items-center justify-center",
                            b.isActive ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20" : "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                          )}
                          title={b.isActive ? "Disable Banner" : "Enable Banner"}
                        >
                          {b.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleEdit(b)}
                          className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/20"
                          title="Edit"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(b._id)}
                          className="w-7 h-7 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
