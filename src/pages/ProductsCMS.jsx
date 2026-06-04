import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Trash2, Plus, Edit3, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ProductsCMS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('In Stock');
  const [deliveryTime, setDeliveryTime] = useState('Free Delivery');
  const [location, setLocation] = useState('Ships from Chennai');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/admin/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${window.API_BASE_URL}/api/admin/products`, {
        title,
        price: Number(price),
        status,
        deliveryTime,
        location
      });
      setTitle('');
      setPrice(0);
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${window.API_BASE_URL}/api/admin/products/${editingProduct._id}`, {
        title: editingProduct.title,
        price: Number(editingProduct.price),
        status: editingProduct.status,
        deliveryTime: editingProduct.deliveryTime,
        location: editingProduct.location
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${window.API_BASE_URL}/api/admin/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    setUploadingId(productId);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await axios.post(`${window.API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = uploadRes.data.url;

      await axios.put(`${window.API_BASE_URL}/api/admin/products/${productId}`, {
        imageUrl
      });

      fetchProducts();
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Check console.');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Products CMS</h1>
          <p className="text-textMuted text-sm">Manage products for the MrCoach Shop page.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primaryHover text-[#09090B] font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showAddForm && (
        <div className="glass rounded-2xl p-6 border border-borderLine/50 mb-8 max-w-xl">
          <h2 className="text-lg font-semibold mb-4 text-textMain">Add New Shop Item</h2>
          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-textMuted mb-1">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50">
                <option value="In Stock" className="bg-surface text-textMain">In Stock</option>
                <option value="Out of Stock" className="bg-surface text-textMain">Out of Stock</option>
                <option value="Limited" className="bg-surface text-textMain">Limited</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Delivery Time</label>
              <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g. Free Delivery" className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-textMuted mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-borderLine rounded-xl text-sm text-textMuted hover:text-textMain transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-[#09090B] font-semibold rounded-xl text-sm hover:bg-primaryHover transition-all">Save Item</button>
            </div>
          </form>
        </div>
      )}

      {editingProduct && (
        <div className="glass rounded-2xl p-6 border border-borderLine/50 mb-8 max-w-xl">
          <h2 className="text-lg font-semibold mb-4 text-textMain">Edit Product</h2>
          <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-textMuted mb-1">Title</label>
              <input type="text" value={editingProduct.title} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} required className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Price (₹)</label>
              <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} required className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Status</label>
              <select value={editingProduct.status} onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })} className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50">
                <option value="In Stock" className="bg-surface text-textMain">In Stock</option>
                <option value="Out of Stock" className="bg-surface text-textMain">Out of Stock</option>
                <option value="Limited" className="bg-surface text-textMain">Limited</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Delivery Time</label>
              <input type="text" value={editingProduct.deliveryTime} onChange={(e) => setEditingProduct({ ...editingProduct, deliveryTime: e.target.value })} className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-textMuted mb-1">Location</label>
              <input type="text" value={editingProduct.location} onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })} className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border border-borderLine rounded-xl text-sm text-textMuted hover:text-textMain transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-[#09090B] font-semibold rounded-xl text-sm hover:bg-primaryHover transition-all">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-textMuted">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="glass rounded-2xl overflow-hidden border border-borderLine/50 flex flex-col">
              <div className="relative aspect-video bg-surfaceLight/50 flex items-center justify-center border-b border-borderLine/50">
                {product.imageUrl ? (
                  <img src={`${window.API_BASE_URL}${product.imageUrl}`} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-textMuted/50" />
                )}
                
                {/* Upload Image Overlay */}
                <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-semibold gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadingId === product._id ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(product._id, e.target.files[0])}
                    disabled={uploadingId !== null}
                  />
                </label>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-textMain leading-tight">{product.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    product.status === 'In Stock' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    product.status === 'Limited' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {product.status}
                  </span>
                </div>

                <p className="text-xl font-extrabold text-primary mb-4">₹{product.price.toLocaleString()}</p>
                
                <div className="text-xs text-textMuted space-y-1 mb-6 flex-1">
                  <p>• {product.deliveryTime}</p>
                  <p>• {product.location}</p>
                </div>

                <div className="flex gap-2 border-t border-borderLine/50 pt-4">
                  <button 
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 py-2 bg-surfaceLight border border-borderLine rounded-xl text-xs font-semibold text-textMain hover:bg-surfaceLight/80 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product._id)}
                    className="p-2 border border-borderLine rounded-xl text-textMuted hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
