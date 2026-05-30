import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Plus, Search, X, Star, TrendingUp, Edit2, Trash2, RefreshCw, CheckCircle2, Truck, PackageCheck, Ban, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { showAlert } from '../utils/alert';
import { adminApi } from '../services/api';
import { formatINR } from '../utils';


const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
  'Shipped': 'bg-purple-100 text-purple-800 border-purple-200',
  'Delivered': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

const mockCustomers = [
  {name: 'Priya Sharma', email: 'priya.sharma@email.com', orders: 12, spent: '₹1,24,999', status: 'Gold', color: 'bg-amber-100 text-amber-800 border-amber-200'},
  {name: 'Rahul Verma', email: 'rahul.verma@email.com', orders: 8, spent: '₹82,499', status: 'Silver', color: 'bg-gray-100 text-gray-800 border-gray-200'},
  {name: 'Anjali Gupta', email: 'anjali.gupta@email.com', orders: 15, spent: '₹2,12,499', status: 'Platinum', color: 'bg-purple-100 text-purple-800 border-purple-200'},
  {name: 'Karan Singh', email: 'karan.singh@email.com', orders: 5, spent: '₹45,999', status: 'Bronze', color: 'bg-orange-100 text-orange-800 border-orange-200'},
  {name: 'Neha Patel', email: 'neha.patel@email.com', orders: 20, spent: '₹3,45,999', status: 'Platinum', color: 'bg-purple-100 text-purple-800 border-purple-200'},
];

export default function AdminDashboard() {
  const { products, addProduct, removeProduct, updateProduct } = useStore();
  const { isAdminUser, logout: userLogout } = useUser();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [serverOrders, setServerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', price: '', stock: '', category: '', imageFile: '' }
  });
  const [imagePreview, setImagePreview] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [syncing, setSyncing] = useState(false);

  const syncWithServer = useCallback(async () => {
    const serverProducts = await adminApi.getProducts();
    return serverProducts;
  }, []);

  useEffect(() => {
    syncWithServer()
      .then((serverProducts) => {
        useStore.getState().syncProducts(serverProducts);
      })
      .catch(() => {});
  }, [syncWithServer]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const orders = await adminApi.getOrders();
      setServerOrders(orders);
    } catch {
      // Server orders not available — using local orders
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'orders' || activeSection === 'overview') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadOrders();
    }
  }, [activeSection, loadOrders]);

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    reset();
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
  };

  useEffect(() => {
    if (!isAdminUser) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAdminUser, navigate]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isSearchOpen]);

  const handleLogout = async () => {
    await userLogout();
    navigate('/admin/login');
  };

  const onSubmit = async (data) => {
    const price = Number(data.price);
    const stock = Number(data.stock);

    if (!data.name.trim()) {
      showAlert('Product name is required.', 'warning');
      return;
    }
    if (price < 0) {
      showAlert('Price must be a positive number.', 'warning');
      return;
    }
    if (stock < 0) {
      showAlert('Stock cannot be negative.', 'warning');
      return;
    }

    const { imageFile, ...productData } = data;

    // Start image upload in background (don't block product creation)
    let imageUrl = imagePreview;
    const file = imageFile?.[0];
    const uploadPromise = file && file instanceof File
      ? adminApi.uploadProductImage(file).then(url => { imageUrl = url; }).catch(() => {
          showAlert('Image upload failed. Using local preview.', 'warning');
        })
      : Promise.resolve();

    // Add to Firestore first to get the real ID
    let serverProduct;
    try {
      serverProduct = await adminApi.addProduct({ name: productData.name, price, stock, category: productData.category, image: imageUrl });
    } catch {
      // Firestore unavailable, add locally only
      addProduct({ ...productData, price, stock, image: imageUrl });
      reset();
      setImagePreview('');
      setShowAddModal(false);
      showAlert('Product added locally!', 'success');
      return;
    }

    // Wait for upload to finish
    await uploadPromise;

    // Add to local store with the Firestore ID so sync doesn't duplicate
    addProduct({ ...productData, price, stock, image: imageUrl, id: serverProduct?.id });

    // Update the Firestore document with the final image URL
    if (serverProduct && imageUrl !== imagePreview) {
      try {
        await adminApi.updateProduct(serverProduct.id, { image: imageUrl });
      } catch { /* ignore */ }
    }

    reset();
    setImagePreview('');
    setShowAddModal(false);

    showAlert('Product added successfully!', 'success');
  };

  const handleEditSubmit = async (data) => {
    if (!editingProduct) return;

    const price = Number(data.price);
    const stock = Number(data.stock);

    let imageUrl = editingProduct.image;
    const file = data.imageFile?.[0];
    if (file && file instanceof File) {
      setUploadingImage(true);
      try {
        imageUrl = await adminApi.uploadProductImage(file, data.name);
      } catch {
        showAlert('Image upload failed. Keeping existing image.', 'warning');
      }
      setUploadingImage(false);
    }

    const updates = { name: data.name, price, stock, category: data.category, image: imageUrl };
    updateProduct(editingProduct.id, updates);

    try {
      await adminApi.updateProduct(editingProduct.id, updates);
    } catch {
      // Server sync is best-effort
    }

    setShowEditModal(false);
    setEditingProduct(null);
    showAlert('Product updated successfully!', 'success');
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = serverOrders.filter(order =>
    order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.address?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdminUser) return null; // Prevent flicker before redirect

  return (
    <div className="min-h-screen bg-[#faf6f0] font-sans flex text-gray-900">

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-rose-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-rose-950 font-serif">Add New Product</h3>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-rose-950 bg-rose-50 hover:bg-amber-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-rose-950 mb-1">Product Name</label>
                <input required type="text" placeholder="e.g. Royal Silk Sherwani" {...register('name', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-rose-950 mb-1">Price (₹)</label>
                  <input required type="number" min="0" placeholder="0.00" {...register('price', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-rose-950 mb-1">Stock</label>
                  <input required type="number" min="0" placeholder="0" {...register('stock', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-rose-950 mb-1">Category</label>
                <select required {...register('category', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300">
                  <option value="" disabled>Select Category</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            <div>
              <label className="block text-sm font-bold text-rose-950 mb-1">Product Photo</label>
              <input type="file" accept="image/*" {...register('imageFile', { onChange: handleImageChange })} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-all border-2 border-gray-200 rounded-xl p-2 bg-white cursor-pointer" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-lg border border-rose-100" />}
            </div>
              <button type="submit" disabled={uploadingImage} className="w-full bg-amber-500 text-rose-950 font-bold py-3 mt-2 rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider shadow-md disabled:opacity-50">{uploadingImage ? 'Uploading...' : 'Save Product'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-rose-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-rose-950 font-serif">Edit Product</h3>
              <button type="button" onClick={() => { setShowEditModal(false); setEditingProduct(null); }} className="text-gray-400 hover:text-rose-950 bg-rose-50 hover:bg-amber-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form key={editingProduct.id} onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-rose-950 mb-1">Product Name</label>
                <input required type="text" defaultValue={editingProduct.name} {...register('name', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-rose-950 mb-1">Price (₹)</label>
                  <input required type="number" min="0" defaultValue={editingProduct.price} {...register('price', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-rose-950 mb-1">Stock</label>
                  <input required type="number" min="0" defaultValue={editingProduct.stock || 0} {...register('stock', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-rose-950 mb-1">Category</label>
                <select required defaultValue={editingProduct.category} {...register('category', { required: true })} className="block w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white shadow-sm hover:border-gray-300">
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            <div>
              <label className="block text-sm font-bold text-rose-950 mb-1">Product Photo</label>
              <input type="file" accept="image/*" {...register('imageFile', { onChange: handleImageChange })} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-all border-2 border-gray-200 rounded-xl p-2 bg-white cursor-pointer" />
              <img src={imagePreview || editingProduct.image} alt="Current" className="mt-2 w-full h-40 object-cover rounded-lg border border-rose-100" />
            </div>
              <button type="submit" disabled={uploadingImage} className="w-full bg-amber-500 text-rose-950 font-bold py-3 mt-2 rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider shadow-md disabled:opacity-50">{uploadingImage ? 'Uploading...' : 'Update Product'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-rose-950 border-r border-rose-900 flex flex-col hidden md:flex shadow-2xl z-10 rounded-r-2xl">
        <div className="h-16 flex items-center justify-center px-6 border-b border-rose-800">
          <h1 className="text-2xl font-bold tracking-widest font-serif text-white uppercase leading-none mt-2">
            PEHENAVAS<span className="text-amber-400 font-sans text-xs tracking-normal ml-1 align-top opacity-90 block text-center mt-1">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: 'overview', label: 'Overview', icon: LayoutDashboard },
            { key: 'products', label: 'Products', icon: Package },
            { key: 'orders', label: 'Orders', icon: ShoppingCart },
            { key: 'customers', label: 'Customers', icon: Users },
          ].map((item) => {
            const IconComp = item.icon;
            return (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-medium border-l-4 text-left ${
                activeSection === item.key
                  ? 'bg-rose-900 text-white font-bold border-amber-400 shadow-inner'
                  : 'text-rose-200 hover:bg-rose-900 hover:text-white border-transparent hover:border-amber-400/50'
              }`}
            >
              <IconComp className={`w-5 h-5 ${activeSection === item.key ? 'text-amber-400' : ''}`} />
              <span>{item.label}</span>
            </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-rose-800">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-3 w-full text-red-400 hover:bg-rose-900 hover:text-red-300 rounded-lg transition-colors font-bold">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-rose-950 font-serif capitalize">{activeSection}</h2>
          <div className="flex space-x-4">
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="relative w-64"
            >
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products or orders..." 
                className="pl-10 pr-10 py-2.5 border-2 border-transparent shadow-sm rounded-full focus:ring-0 focus:border-amber-500 bg-white w-full transition-all outline-none cursor-pointer" 
                readOnly
              />
            </button>
<button onClick={async () => {
               setSyncing(true);
               try {
                 const serverProducts = await syncWithServer();
                 useStore.getState().syncProducts(serverProducts);
                 showAlert('Products synced with server.', 'success');
               } catch {
                 showAlert('Could not connect to server. Using local data.', 'warning');
               } finally {
                 setSyncing(false);
               }
             }} disabled={syncing} className="flex items-center space-x-2 bg-rose-100 text-rose-950 px-4 py-2.5 rounded-full hover:bg-rose-200 transition shadow-sm font-bold text-sm">
               <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
               <span>{syncing ? 'Syncing...' : 'Sync'}</span>
             </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-amber-500 text-rose-950 px-6 py-2.5 rounded-full hover:bg-amber-400 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-bold uppercase tracking-wide text-sm">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </header>

        {/* Enhanced Search Modal - Similar to Main Page */}
        {isSearchOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Search Input */}
              <div className="p-6 bg-gradient-to-b from-rose-50 to-white border-b border-rose-100">
                <div className="flex items-center gap-4 bg-white border-2 border-amber-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5 focus-within:-translate-y-1">
                  <Search className="w-6 h-6 text-amber-500" />
                  <input
                    type="text"
                    placeholder="Search for products or orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400 text-rose-950 font-medium"
                  />
                  <button 
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-rose-950 bg-rose-50 hover:bg-amber-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50">
                {searchQuery.trim() === "" ? (
                  <div className="p-12 text-center text-gray-500">
                    <p className="text-lg">Start typing to search products or orders</p>
                  </div>
                ) : filteredProducts.length === 0 && filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p className="text-lg">No results found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Products Section */}
                    {filteredProducts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider mb-4">Products ({filteredProducts.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="cursor-pointer group block bg-white rounded-lg overflow-hidden border border-rose-100 hover:border-amber-300 transition-all"
                            >
                              <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-3 aspect-[3/4] shadow-sm">
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">{product.name}</h4>
                                <p className="text-amber-600 font-bold text-sm">₹{product.price.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-rose-900/60 mt-1">{product.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders Section */}
                    {filteredOrders.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider mb-4">Orders ({filteredOrders.length})</h3>
                        <div className="space-y-2">
                          {filteredOrders.map((order, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-rose-100 hover:border-amber-300 hover:bg-rose-50 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-rose-950">{order.id}</p>
                                  <p className="text-sm text-rose-900/70">{order.name}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${order.color}`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-rose-900/60">{order.item}</p>
                                <p className="font-bold text-rose-950 font-serif">{order.amount}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Original inline search bar for reference (can be removed) */}

        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-rose-950 font-serif">Revenue Analytics</h3>
                  <p className="text-sm font-medium text-rose-900/60 mt-1">Daily fashion drops & seasonal performance</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">+24.5%</span>
                </div>
              </div>
              <div className="h-48 mt-6 flex items-end justify-between space-x-2">
                {[30, 45, 35, 60, 50, 75, 65, 85, 70, 95, 80, 100].map((val, idx) => (
                  <div key={idx} className="w-full bg-rose-50 rounded-t-md relative group h-full flex items-end">
                    <div className="w-full bg-amber-400 rounded-t-md group-hover:bg-amber-500 transition-all duration-300 relative" style={{ height: `${val}%` }}>
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-rose-950 text-white text-xs font-bold py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                        ₹{(val * 1234).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-rose-900/50 mt-3 font-bold uppercase tracking-widest px-1">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm relative flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-rose-950 font-serif">Best-Sellers</h3>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow-sm" />
              </div>
              <div className="space-y-4 flex-1">
                {[
                  {name: 'Royal Silk Sherwani', sold: 342, rating: 4.9, img: 'https://via.placeholder.com/150'},
                  {name: 'Embroidered Lehenga', sold: 289, rating: 4.8, img: 'https://via.placeholder.com/150'},
                  {name: 'Classic White Kurta', sold: 195, rating: 4.6, img: 'https://via.placeholder.com/150'},
                  {name: 'Velvet Bandhgala', sold: 154, rating: 4.7, img: 'https://via.placeholder.com/150'}
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-4 p-2.5 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 cursor-pointer group">
                    <img src={item.img} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100 shadow-sm group-hover:shadow transition" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-rose-950 truncate">{item.name}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1.5 space-x-2">
                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{item.sold} sold</span>
                        <span className="flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-500 inline mr-1" />{item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveSection('products')} className="w-full mt-4 py-3 text-xs font-bold text-rose-900 bg-rose-50 rounded-xl hover:bg-rose-100 hover:text-rose-950 transition-colors uppercase tracking-widest shadow-sm">View Full Catalog</button>
            </div>
          </div>
        )}

        {activeSection === 'overview' && (
          <div className="mb-10">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-2xl font-bold text-rose-950 font-serif">Visual Inventory Feed</h3>
                <p className="text-sm font-medium text-rose-900/60 mt-1">Real-time stock of active apparel variations</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden group hover:shadow-lg transition duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[4/5] bg-rose-50 overflow-hidden border-b border-rose-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute top-3 left-3">
                       <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md backdrop-blur-md border ${product.stock > 20 ? 'bg-green-100/90 text-green-800 border-green-200' : 'bg-red-100/90 text-red-800 border-red-200'}`}>
                          {product.stock} Units Left
                       </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">{product.category}</div>
                    <h4 className="font-bold text-rose-950 truncate text-lg mb-1">{product.name}</h4>
                    <div className="flex justify-between items-end mt-3">
                       <span className="text-xl font-bold text-rose-950 font-serif">₹{product.price.toLocaleString('en-IN')}</span>
                       <div className="flex space-x-1">
                          <button onClick={() => openEditModal(product)} className="p-2 text-rose-400 hover:bg-amber-100 hover:text-amber-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={async () => {
                            removeProduct(product.id);
                            try {
                              await adminApi.removeProduct(product.id);
                            } catch { /* ignore */ }
                          }} className="p-2 text-rose-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-4 pt-4 border-t border-rose-50">
                       {['S', 'M', 'L'].map(s => (
                          <span key={s} className="w-7 h-7 rounded-md bg-rose-50 text-rose-950 text-xs font-bold flex items-center justify-center border border-rose-100">{s}</span>
                       ))}
                       <div className="flex-1"></div>
                       <span className="w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm" title="Black"></span>
                       <span className="w-5 h-5 rounded-full bg-rose-800 border-2 border-white shadow-sm -ml-2" title="Maroon"></span>
                       <span className="w-5 h-5 rounded-full bg-amber-100 border-2 border-white shadow-sm -ml-2" title="Cream"></span>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-rose-900/60 font-medium bg-white rounded-2xl border border-rose-100 border-dashed">
                  No products found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'overview' && (
          <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-rose-100 flex justify-between items-center bg-rose-50/30">
              <div>
                <h3 className="text-xl font-bold text-rose-950 font-serif">Order Status Ticker</h3>
                <p className="text-sm font-medium text-rose-900/60 mt-0.5">Real orders from Firestore</p>
              </div>
              <button onClick={() => setActiveSection('orders')} className="text-sm font-bold text-amber-600 hover:text-amber-700 transition uppercase tracking-wider">View All Orders &rarr;</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-rose-900/50 text-[10px] uppercase tracking-widest border-b border-rose-100">
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">Customer</th>
                    <th className="px-6 py-4 font-bold">Items</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {serverOrders.length > 0 ? serverOrders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-rose-50/30 transition duration-150">
                      <td className="px-6 py-4 font-bold text-rose-950 text-sm">#{order.id}</td>
                      <td className="px-6 py-4 font-bold text-rose-900/80 text-sm">{order.address?.fullName || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-rose-900/70">{order.items?.length || 0} item(s)</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-950 text-right font-serif text-base">{order.total ? formatINR(order.total) : 'N/A'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-rose-900/60 font-medium">
                        No orders yet. Orders will appear here once customers start purchasing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'products' && (
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm font-medium text-rose-900/60">Manage your product inventory</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden group hover:shadow-lg transition duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[4/5] bg-rose-50 overflow-hidden border-b border-rose-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute top-3 left-3">
                       <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md backdrop-blur-md border ${product.stock > 20 ? 'bg-green-100/90 text-green-800 border-green-200' : 'bg-red-100/90 text-red-800 border-red-200'}`}>
                          {product.stock} Units Left
                       </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">{product.category}</div>
                    <h4 className="font-bold text-rose-950 truncate text-lg mb-1">{product.name}</h4>
                    <div className="flex justify-between items-end mt-3">
                       <span className="text-xl font-bold text-rose-950 font-serif">₹{product.price.toLocaleString('en-IN')}</span>
                       <div className="flex space-x-1">
                          <button onClick={() => openEditModal(product)} className="p-2 text-rose-400 hover:bg-amber-100 hover:text-amber-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={async () => {
                            removeProduct(product.id);
                            try {
                              await adminApi.removeProduct(product.id);
                            } catch { /* ignore */ }
                          }} className="p-2 text-rose-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-4 pt-4 border-t border-rose-50">
                       {['S', 'M', 'L'].map(s => (
                          <span key={s} className="w-7 h-7 rounded-md bg-rose-50 text-rose-950 text-xs font-bold flex items-center justify-center border border-rose-100">{s}</span>
                       ))}
                       <div className="flex-1"></div>
                       <span className="w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm" title="Black"></span>
                       <span className="w-5 h-5 rounded-full bg-rose-800 border-2 border-white shadow-sm -ml-2" title="Maroon"></span>
                       <span className="w-5 h-5 rounded-full bg-amber-100 border-2 border-white shadow-sm -ml-2" title="Cream"></span>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-rose-900/60 font-medium bg-white rounded-2xl border border-rose-100 border-dashed">
                  No products yet. Click "Add Product" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm font-medium text-rose-900/60">Track and manage customer orders</p>
              </div>
              <button onClick={loadOrders} disabled={loadingOrders} className="flex items-center space-x-2 bg-rose-100 text-rose-950 px-4 py-2.5 rounded-full hover:bg-rose-200 transition shadow-sm font-bold text-sm">
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-rose-900/50 text-[10px] uppercase tracking-widest border-b border-rose-100">
                      <th className="px-6 py-4 font-bold">Order ID</th>
                      <th className="px-6 py-4 font-bold">Customer</th>
                      <th className="px-6 py-4 font-bold">Items</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Amount</th>
                      <th className="px-6 py-4 font-bold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {loadingOrders ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-rose-900/60 font-medium">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredOrders.length > 0 ? filteredOrders.map((order) => (
                      <tr key={order.id || order.$id} className="hover:bg-rose-50/30 transition duration-150">
                        <td className="px-6 py-4 font-bold text-rose-950 text-sm">#{order.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-rose-900/80 text-sm">{order.address?.fullName || 'N/A'}</p>
                          <p className="text-xs text-rose-900/50">{order.userEmail || order.address?.phone || ''}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-rose-900/70">
                          {order.items?.length || 0} item(s)
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status || 'Pending'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await adminApi.updateOrderStatus(order.id, newStatus);
                                setServerOrders(prev =>
                                  prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
                                );
                                showAlert(`Order #${order.id} status updated to ${newStatus}`, 'success');
                              } catch {
                                showAlert('Failed to update status', 'warning');
                              }
                            }}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm outline-none cursor-pointer ${STATUS_STYLES[order.status] || STATUS_STYLES['Pending']}`}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-950 text-right font-serif text-base">
                          {order.total ? formatINR(order.total) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-rose-900/60 text-right">
                          {order.date || ''}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-rose-900/60 font-medium">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'customers' && (
          <div>
            <p className="text-sm font-medium text-rose-900/60 mb-6">View your customer base and loyalty tiers</p>
            <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-rose-900/50 text-[10px] uppercase tracking-widest border-b border-rose-100">
                      <th className="px-6 py-4 font-bold">Customer</th>
                      <th className="px-6 py-4 font-bold">Email</th>
                      <th className="px-6 py-4 font-bold">Orders</th>
                      <th className="px-6 py-4 font-bold">Total Spent</th>
                      <th className="px-6 py-4 font-bold">Loyalty Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {mockCustomers.map((customer, i) => (
                      <tr key={i} className="hover:bg-rose-50/30 transition duration-150">
                        <td className="px-6 py-4 font-bold text-rose-950 text-sm">{customer.name}</td>
                        <td className="px-6 py-4 text-rose-900/70 text-sm">{customer.email}</td>
                        <td className="px-6 py-4 text-rose-950 font-bold text-sm">{customer.orders}</td>
                        <td className="px-6 py-4 font-bold text-rose-950 font-serif text-sm">{customer.spent}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${customer.color}`}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}