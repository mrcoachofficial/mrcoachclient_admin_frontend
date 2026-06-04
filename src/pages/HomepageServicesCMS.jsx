import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Upload } from 'lucide-react';

export default function HomepageServicesCMS() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCategories, setUploadingCategories] = useState({});
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

  const handleCategoryTileUpload = async (catName, file) => {
    const formData = new FormData();
    formData.append('image', file);

    setUploadingCategories(prev => ({ ...prev, [catName]: true }));

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
      const existing = services.find(s => s.category === 'CategoryBanner' && s.title === catName);

      if (existing) {
        // Update existing service
        await axios.put(`${window.API_BASE_URL}/api/admin/services/${existing._id}`, { imageUrl }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new service representing this category banner
        await axios.post(`${window.API_BASE_URL}/api/services`, {
          title: catName,
          category: 'CategoryBanner',
          price: 0,
          description: `Category Tile Banner for ${catName}`,
          imageUrl
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Refresh list
      fetchServices();
      alert(`Homepage service image for ${catName} updated successfully!`);
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Failed to upload category image');
    } finally {
      setUploadingCategories(prev => ({ ...prev, [catName]: false }));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textMain mb-1 font-sans">Homepage Services</h1>
        <p className="text-textMuted text-sm font-sans">Upload custom images for the main 6 service categories displayed on the mobile app home screen.</p>
      </div>

      <div className="glass rounded-2xl p-8 border border-borderLine/50 w-full">
        <h2 className="text-lg font-bold text-textMain mb-2 flex items-center gap-2 font-sans">
          <ImageIcon className="w-5 h-5 text-primary" /> Category Tile Images
        </h2>
        <p className="text-xs text-textMuted mb-6 font-sans">
          These images will override the default assets shown on the mobile app landing page category tiles.
        </p>

        {loading ? (
          <p className="text-textMuted font-sans">Loading homepage services...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesList.map(cat => {
              const banner = services.find(s => s.category === 'CategoryBanner' && s.title === cat);
              const bannerUrl = banner ? getImageUrl(banner.imageUrl) : '';

              return (
                <div key={cat} className="glass rounded-2xl overflow-hidden border border-borderLine/50 flex flex-col p-4 relative group bg-surfaceLight/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-md font-bold text-textMain font-sans">{cat}</span>
                    {bannerUrl ? (
                      <span className="text-[10px] text-green-400 font-semibold px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 font-sans">
                        Custom Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-textMuted font-semibold px-2 py-0.5 rounded bg-surfaceLight border border-borderLine font-sans">
                        Default Asset
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-surfaceLight/30 relative border border-borderLine/30 flex items-center justify-center">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt={cat} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-textMuted/30" />
                        <span className="text-xs text-textMuted block font-sans">Default Template Image</span>
                      </div>
                    )}

                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-primary text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primaryHover transition-colors shadow-lg">
                        <Upload className="w-4 h-4" />
                        <span className="font-sans">{uploadingCategories[cat] ? 'Uploading...' : 'Upload Image'}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleCategoryTileUpload(cat, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
