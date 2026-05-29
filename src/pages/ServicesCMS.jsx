import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Upload, Edit, Trash2 } from 'lucide-react';

export default function ServicesCMS() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/services');
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  const handleImageUpload = async (serviceId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 1. Upload to multer endpoint
      const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.imageUrl;

      // 2. Update service with new image URL
      await axios.put(`http://localhost:5000/api/admin/services/${serviceId}`, { imageUrl });
      
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-textMuted">Loading services...</p>
        ) : (
          services.map(service => (
            <div key={service._id} className="glass rounded-2xl overflow-hidden flex flex-col">
              <div className="h-48 bg-surfaceLight relative group">
                {service.imageUrl ? (
                  <img 
                    src={`http://localhost:5000${service.imageUrl}`} 
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
                    <button className="p-1.5 text-textMuted hover:text-textMain transition-colors"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 text-textMuted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
