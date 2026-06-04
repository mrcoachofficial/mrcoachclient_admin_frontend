import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Upload, Edit, Trash2 } from 'lucide-react';

export default function ServicesCMS() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  
  // Hero banner state
  const [heroImage, setHeroImage] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);



  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${window.API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchServices();
    fetchHeroImage();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/services`);
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  const fetchHeroImage = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/services/hero-image`);
      setHeroImage(response.data.imageUrl);
    } catch (error) {
      console.error('Error fetching hero image:', error);
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingHero(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const relativeUrl = uploadRes.data.imageUrl;
      setHeroImage(relativeUrl);

      // Automatically save to config immediately after upload
      await axios.put(`${window.API_BASE_URL}/api/admin/config`, {
        key: 'servicesHeroImage',
        value: relativeUrl
      });
      alert('Services hero banner uploaded and updated successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Check console.');
    } finally {
      setUploadingHero(false);
    }
  };

  const saveHeroImage = async () => {
    setSavingHero(true);
    try {
      await axios.put(`${window.API_BASE_URL}/api/admin/config`, {
        key: 'servicesHeroImage',
        value: heroImage
      });
      alert('Services hero banner updated successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save config');
    } finally {
      setSavingHero(false);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${window.API_BASE_URL}/api/admin/services/${editingService._id}`, {
        title: editingService.title,
        price: Number(editingService.price),
        description: editingService.description,
        category: editingService.category,
        imageUrl: editingService.imageUrl
      });
      setEditingService(null);
      fetchServices();
      alert('Service updated successfully!');
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this service?')) return;
    try {
      await axios.delete(`${window.API_BASE_URL}/api/admin/services/${id}`);
      fetchServices();
      alert('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const handleImageUpload = async (serviceId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 1. Upload to multer endpoint
      const uploadRes = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.imageUrl;

      // 2. Update service with new image URL
      await axios.put(`${window.API_BASE_URL}/api/admin/services/${serviceId}`, { imageUrl });
      
      // Refresh list
      fetchServices();
      alert('Image uploaded and synced to Flutter app successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };



  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textMain mb-1">Services CMS</h1>
        <p className="text-textMuted text-sm">Upload images here to instantly update your Flutter mobile app.</p>
      </div>

      {/* Services Hero Image Configuration */}
      <div className="glass rounded-2xl p-6 border border-borderLine/50 mb-8 max-w-xl">
        <h2 className="text-md font-bold text-textMain mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" /> Services Page Hero Banner
        </h2>
        <p className="text-xs text-textMuted mb-4">
          This image appears at the top of the "Explore Our Services" page in the Flutter mobile app.
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="Enter hero image URL or upload one"
              className="flex-1 bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
            />
            <label className="bg-surfaceLight border border-borderLine text-textMain text-xs font-semibold rounded-xl px-4 py-2.5 cursor-pointer hover:bg-surface flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingHero ? '...' : 'Upload'}</span>
              <input type="file" onChange={handleHeroUpload} className="hidden" accept="image/*" />
            </label>
          </div>

          {heroImage && (
            <div className="relative rounded-xl overflow-hidden border border-borderLine/50 bg-black/20 aspect-[16/9] flex items-center justify-center">
              <img 
                src={heroImage.startsWith('http') ? heroImage : `${window.API_BASE_URL}${heroImage}`} 
                alt="Hero Banner Preview" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded">
                Landscape Preview (16:9)
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button 
              onClick={saveHeroImage}
              disabled={savingHero}
              className="px-4 py-2.5 bg-primary text-[#09090B] font-semibold rounded-xl text-xs hover:bg-primaryHover transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              Save Hero Banner
            </button>
          </div>
        </div>
      </div>



      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 border border-borderLine/50 max-w-xl w-full">
            <h2 className="text-lg font-semibold mb-4 text-textMain font-bold">Edit Service</h2>
            <form onSubmit={handleUpdateService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 font-semibold">Service Name</label>
                <input 
                  type="text" 
                  value={editingService.title} 
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })} 
                  required 
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-semibold">Price (₹)</label>
                <input 
                  type="number" 
                  value={editingService.price} 
                  onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} 
                  required 
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-textMuted mb-1 font-semibold">Category</label>
                <input 
                  type="text" 
                  value={editingService.category} 
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })} 
                  required 
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-textMuted mb-1 font-semibold">Description</label>
                <textarea 
                  value={editingService.description} 
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} 
                  required 
                  rows={3}
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-textMuted mb-1 font-semibold">Service Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editingService.imageUrl || ''} 
                    onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })} 
                    className="flex-1 bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                    placeholder="/uploads/image.jpg or https://images.unsplash.com/..."
                  />
                  <label className="bg-surfaceLight border border-borderLine text-textMain text-xs font-semibold rounded-xl px-4 py-2.5 cursor-pointer hover:bg-surface flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingEditImage ? '...' : 'Upload'}</span>
                    <input 
                      type="file" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploadingEditImage(true);
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const uploadRes = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setEditingService({ ...editingService, imageUrl: uploadRes.data.imageUrl });
                      } catch (err) {
                        console.error(err);
                        alert('Upload failed');
                      } finally {
                        setUploadingEditImage(false);
                      }
                    }} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </label>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setEditingService(null)} 
                className="px-4 py-2 border border-borderLine rounded-xl text-sm text-textMuted hover:text-textMain transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary text-[#09090B] font-semibold rounded-xl text-sm hover:bg-primaryHover transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-textMuted">Loading services...</p>
        ) : (
          services.filter(s => s.category !== 'CategoryBanner').map(service => (
            <div key={service._id} className="glass rounded-2xl overflow-hidden flex flex-col">
              <div className="h-48 bg-surfaceLight relative group">
                {service.imageUrl ? (
                  <img 
                    src={getImageUrl(service.imageUrl)} 
                    alt={service.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-textMuted">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-primary text-black px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primaryHover transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleImageUpload(service._id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-textMain text-lg">{service.title}</h3>
                  <span className="text-primary font-bold">₹{service.price}</span>
                </div>
                <p className="text-sm text-textMuted line-clamp-2 mb-4">{service.description}</p>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-borderLine">
                  <span className="text-xs px-2 py-1 bg-surfaceLight border border-borderLine rounded text-textMuted">
                    {service.category}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingService(service)}
                      className="p-1.5 text-textMuted hover:text-textMain transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteService(service._id)}
                      className="p-1.5 text-textMuted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
