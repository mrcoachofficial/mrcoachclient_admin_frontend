import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Upload } from 'lucide-react';

export default function HomepageServicesCMS() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const categoriesList = ['Fitness', 'Physio', 'Sports', 'Yoga', 'Therapy', 'Nutrition'];

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${window.API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchServices();
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

  const handleCategoryUpload = async (catName, file, type) => {
    const formData = new FormData();
    formData.append('image', file);

    const uploadKey = `${catName}_${type}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const token = localStorage.getItem('adminToken');
      // 1. Upload to multer endpoint
      const uploadRes = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      const imageUrl = uploadRes.data.imageUrl;

      // 2. Find if existing category banner exists
      const existing = services.find(s => s.category === type && s.title === catName);

      if (existing) {
        // Update existing service
        await axios.put(`${window.API_BASE_URL}/api/admin/services/${existing._id}`, { imageUrl }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new service representing this category banner
        await axios.post(`${window.API_BASE_URL}/api/services`, {
          title: catName,
          category: type,
          price: 0,
          description: `${type === 'CategoryBanner' ? 'Homepage Tile' : 'Inner Detail Banner'} for ${catName}`,
          imageUrl
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Refresh list
      fetchServices();
      alert(`Successfully updated image!`);
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Failed to upload category image');
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textMain mb-1 font-sans">Homepage Services CMS</h1>
        <p className="text-textMuted text-sm font-sans">Manage imagery for the 6 primary categories. You can configure the homepage tile and detail page banners separately.</p>
      </div>

      {loading ? (
        <p className="text-textMuted font-sans">Loading homepage services...</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {categoriesList.map(cat => {
            const tileBanner = services.find(s => s.category === 'CategoryBanner' && s.title === cat);
            const innerBanner = services.find(s => s.category === 'CategoryInnerBanner' && s.title === cat);

            const tileBannerUrl = tileBanner ? getImageUrl(tileBanner.imageUrl) : '';
            const innerBannerUrl = innerBanner ? getImageUrl(innerBanner.imageUrl) : '';

            return (
              <div key={cat} className="glass rounded-3xl overflow-hidden border border-borderLine/50 p-6 bg-surfaceLight/5 flex flex-col gap-6">
                <div className="flex justify-between items-center pb-4 border-b border-borderLine/30">
                  <h3 className="text-lg font-bold text-textMain font-sans">{cat} Category</h3>
                  <span className="text-xs text-textMuted px-3 py-1 rounded-full bg-surfaceLight/50 border border-borderLine/40 font-sans">
                    CMS Controlled
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Homepage Tile Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-textMuted font-sans uppercase tracking-wider">Homepage Tile (1:1 Ratio)</span>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-surfaceLight/30 relative border border-borderLine/30 flex items-center justify-center group">
                      {tileBannerUrl ? (
                        <img src={tileBannerUrl} alt={`${cat} tile`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-textMuted/30" />
                          <span className="text-xs text-textMuted block font-sans">Default Square Tile</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-primary text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primaryHover transition-colors shadow-lg">
                          <Upload className="w-4 h-4" />
                          <span className="font-sans">{uploading[`${cat}_CategoryBanner`] ? 'Uploading...' : 'Upload Tile'}</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleCategoryUpload(cat, e.target.files[0], 'CategoryBanner');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Inner Page Banner Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-textMuted font-sans uppercase tracking-wider">Inner Page Banner (4:3 Ratio)</span>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-surfaceLight/30 relative border border-borderLine/30 flex items-center justify-center group">
                      {innerBannerUrl ? (
                        <img src={innerBannerUrl} alt={`${cat} inner banner`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-textMuted/30" />
                          <span className="text-xs text-textMuted block font-sans">Default Inner Banner</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-primary text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primaryHover transition-colors shadow-lg">
                          <Upload className="w-4 h-4" />
                          <span className="font-sans">{uploading[`${cat}_CategoryInnerBanner`] ? 'Uploading...' : 'Upload Banner'}</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleCategoryUpload(cat, e.target.files[0], 'CategoryInnerBanner');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
