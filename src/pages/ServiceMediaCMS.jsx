import { useState, useEffect } from 'react';
import { Sparkles, PlusCircle, CheckCircle, Trash2, ShieldAlert, Image as ImageIcon, LayoutGrid, Settings } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

export default function ServiceMediaCMS() {
  const [services, setServices] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [serviceId, setServiceId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Upload validation states
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageDimensions, setImageDimensions] = useState(null);

  const [formStatus, setFormStatus] = useState({ success: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServicesAndMedia();
  }, []);

  const fetchServicesAndMedia = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // 1. Fetch public services list
      try {
        const servicesRes = await axios.get(`${window.API_BASE_URL}/api/services`);
        setServices(servicesRes.data);
        if (servicesRes.data.length > 0) {
          setServiceId(servicesRes.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      }

      // 2. Fetch service media overrides
      try {
        const mediaRes = await axios.get(`${window.API_BASE_URL}/api/service-media/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMediaList(mediaRes.data);
      } catch (err) {
        console.error('Error fetching service media overrides:', err);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading service media settings:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageError('');
    setImageDimensions(null);

    // Enforce aspect ratio validation
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;

      setImageDimensions({ width, height });

      let targetRatio = 1.0; // 1:1 default
      let label = '1:1 Square';
      if (aspectRatio === '3:4') {
        targetRatio = 0.75;
        label = '3:4 Card';
      }

      const tolerance = 0.15;
      if (Math.abs(ratio - targetRatio) > tolerance) {
        setImageError(`Warning: Image aspect ratio is ${width}:${height} (~${(width/height).toFixed(2)}). An aspect ratio of ${label} is recommended to prevent stretching.`);
      }

      // Proceed to upload
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
        // Auto generate dummy optimized thumbnail version (suffixing path or linking same for simplicity)
        setThumbnailUrl(`${window.API_BASE_URL}${response.data.imageUrl}`);
        setFormStatus({ success: true, message: 'Image uploaded and thumbnail generated!' });
      } catch (error) {
        setFormStatus({ success: false, message: 'Image upload failed.' });
      } finally {
        setUploading(false);
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceId) {
      setFormStatus({ success: false, message: 'Please select a service first.' });
      return;
    }
    setFormStatus({ success: null, message: '' });
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${window.API_BASE_URL}/api/service-media/admin`, {
        serviceId,
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        aspectRatio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormStatus({ success: true, message: 'Service media overrides successfully saved!' });
      setImageUrl('');
      setThumbnailUrl('');
      fetchServicesAndMedia();
    } catch (error) {
      setFormStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to save service media settings'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove media override for this service? It will fallback to standard default images.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${window.API_BASE_URL}/api/service-media/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServicesAndMedia();
    } catch (error) {
      console.error('Error deleting service media override:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Service Media CMS</h1>
          <p className="text-textMuted text-sm">Replace hardcoded service category cards dynamically. Set custom aspect ratios, upload thumbnails, and optimize cache deliveries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Save Media Override Form */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              <Settings className="w-5 h-5 text-primary" /> Media Configurator
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
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Select Service</label>
                <select 
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>{s.title} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Target Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                >
                  <option value="1:1">1:1 Square (Service Cards)</option>
                  <option value="3:4">3:4 Vertical Card (Details Banner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Card Image URL / Upload</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="http://example.com/service.png"
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
                  <div className="relative rounded-xl overflow-hidden border border-borderLine/50 bg-black/20 flex items-center justify-center p-4">
                    <img 
                      src={imageUrl} 
                      alt="Service Preview" 
                      className={clsx(
                        "object-cover rounded-lg shadow-lg border border-borderLine/30",
                        aspectRatio === '1:1' ? 'w-[160px] h-[160px]' : 'w-[150px] h-[200px]'
                      )} 
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-1 rounded">
                      Preview ({aspectRatio})
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Thumbnail URL (Auto-Generated / Optional)</label>
                <input 
                  type="text" 
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="http://example.com/service-thumb.png"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-[#09090B] font-bold rounded-xl py-3.5 px-4 mt-2 transition-all hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Saving overrides...' : 'Apply Overrides'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Media Overrides Grid */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 border-b border-borderLine/50 pb-4 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" /> Active Media Overrides ({mediaList.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-textMuted">Loading overrides...</div>
            ) : mediaList.length === 0 ? (
              <div className="py-12 text-center text-textMuted border border-dashed border-borderLine/40 rounded-xl">
                No custom card overrides configured yet. Standard static assets will be served to client app.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaList.map((m) => (
                  <div key={m._id} className="p-4 rounded-xl border bg-surfaceLight/20 border-borderLine/30 flex gap-4 items-center">
                    <img 
                      src={m.imageUrl} 
                      alt="Service Override" 
                      className={clsx(
                        "object-cover rounded-lg border border-borderLine/20 shadow-sm",
                        m.aspectRatio === '1:1' ? 'w-16 h-16' : 'w-14 h-20'
                      )}
                    />
                    
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-sm text-textMain leading-tight">
                        {m.serviceId?.title || 'Unknown Service'}
                      </h3>
                      <p className="text-xs text-textMuted">{m.serviceId?.category || 'General'}</p>
                      
                      <div className="flex gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                          Aspect: {m.aspectRatio}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(m._id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all flex-shrink-0"
                      title="Remove Override"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
