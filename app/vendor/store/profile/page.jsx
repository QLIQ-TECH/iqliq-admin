'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import FormInput from '../../../../components/shared/FormInput';
import FormSelect from '../../../../components/shared/FormSelect';
import { Store, Save, Upload, Plus, Eye, Edit, MapPin, Phone, Mail, Star, ShoppingBag, DollarSign, X } from 'lucide-react';
import vendorProfileService from '../../../../lib/services/vendorProfileService';
import storeService from '../../../../lib/services/storeService';

export default function StoreProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    storeLogo: '',
    storeBanner: '',
    storeUrl: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    email: '',
    businessHours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed'
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchStoreProfile();
      fetchVendorStores();
    }
  }, [user, isLoading, router]);

  const fetchStoreProfile = async () => {
    try {
      setLoading(true);
      console.log('🏪 Fetching store profile for vendor:', user?.vendorId || user?.id);
      
      const response = await vendorProfileService.getVendorStoreProfile(user?.vendorId || user?.id);
      console.log('📊 Store profile response:', response);
      
      const profileData = response.data || response;
      if (profileData && Object.keys(profileData).length > 0) {
        console.log('📋 Setting profile data:', profileData);
        setFormData({
          storeName: profileData.storeName || '',
          storeDescription: profileData.storeDescription || '',
          storeLogo: profileData.storeLogo || '',
          storeBanner: profileData.storeBanner || '',
          storeUrl: profileData.storeUrl || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zipCode: profileData.zipCode || '',
          country: profileData.country || 'USA',
          phone: profileData.phone || '',
          email: profileData.email || '',
          businessHours: profileData.businessHours || {
            monday: '9:00 AM - 6:00 PM',
            tuesday: '9:00 AM - 6:00 PM',
            wednesday: '9:00 AM - 6:00 PM',
            thursday: '9:00 AM - 6:00 PM',
            friday: '9:00 AM - 6:00 PM',
            saturday: '10:00 AM - 4:00 PM',
            sunday: 'Closed'
          },
          socialMedia: profileData.socialMedia || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          }
        });
      } else {
        console.log('📋 No profile data found or empty response, using defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching store profile:', error);
      console.error('❌ Full error details:', error.response?.data || error);
      
      // Check if it's a 404 - might be that the profile doesn't exist yet
      if (error.response?.status === 404) {
        console.log('📋 Store profile not found (404), using empty form for initial setup');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStores = async () => {
    try {
      setStoresLoading(true);
      console.log('🏪 Fetching stores for vendor:', user?.vendorId || user?.id);
      
      // Use storeService instead of vendorProfileService for better reliability
      const response = await storeService.getStoresByVendor(user?.vendorId || user?.id, true);
      console.log('📊 Vendor stores response:', response);
      
      // Extract store data from various possible response structures
      let storesData = [];
      if (Array.isArray(response)) {
        storesData = response;
      } else if (response?.data?.data?.stores && Array.isArray(response.data.data.stores)) {
        storesData = response.data.data.stores;
      } else if (response?.data?.stores && Array.isArray(response.data.stores)) {
        storesData = response.data.stores;
      } else if (response?.data && Array.isArray(response.data)) {
        storesData = response.data;
      } else if (response?.stores && Array.isArray(response.stores)) {
        storesData = response.stores;
      }
      
      setStores(storesData);
    } catch (error) {
      console.error('❌ Error fetching vendor stores:', error);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log('🏪 Updating store profile:', formData);
      
      const response = await vendorProfileService.updateVendorStoreProfile(formData);
      console.log('✅ Store profile updated:', response);
      
      // Force refresh the profile data after successful update
      await fetchStoreProfile();
      
      alert('Store profile updated successfully!');
    } catch (error) {
      console.error('❌ Error updating store profile:', error);
      console.error('❌ Full error details:', error.response?.data || error);
      
      // Check if it's an API endpoint issue
      if (error.response?.status === 404 || error.message?.includes('404')) {
        alert('Store profile API endpoint not found. Please contact support.');
      } else if (error.response?.status === 401) {
        alert('You are not authorized to update this profile. Please login again.');
      } else {
        alert(`Failed to update store profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStore = async () => {
    try {
      setIsCreatingStore(true);
      
      const storeDataToSubmit = {
        ...newStoreData,
        ownerId: user?.vendorId || user?.id,
        isActive: true
      };
      
      console.log('Creating store with data:', storeDataToSubmit);
      
      const response = await storeService.createStore(storeDataToSubmit);
      console.log('Store created response:', response);
      
      // Refresh stores list
      await fetchVendorStores();
      
      // Close modal and reset form
      setShowCreateStoreModal(false);
      setNewStoreData({
        name: '',
        description: '',
        logo: '',
        banner: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        }
      });
      
      alert('Store created successfully!');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Error creating store: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleNewStoreInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setNewStoreData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setNewStoreData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="vendor"
        onLogout={logout}
        user={user}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
            <p className="text-gray-600 mt-1">Manage your store information</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Store Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Store Name"
                    name="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="My Awesome Store"
                  />
                  <FormInput
                    label="Store URL"
                    name="storeUrl"
                    value={formData.storeUrl}
                    onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                    placeholder="my-store"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                  <textarea
                    name="storeDescription"
                    value={formData.storeDescription}
                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell customers about your store..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.storeLogo}
                        onChange={(e) => setFormData({ ...formData, storeLogo: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Logo URL"
                      />
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Banner</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.storeBanner}
                        onChange={(e) => setFormData({ ...formData, storeBanner: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Banner URL"
                      />
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Store Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormInput
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <FormInput
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <FormInput
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                  <FormInput
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                  <FormInput
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Vendor Stores Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Stores</h2>
                <p className="text-gray-600 mt-1">Manage your store locations and information</p>
              </div>
              <button 
                onClick={() => setShowCreateStoreModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Store</span>
              </button>
            </div>

            {storesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Stores Found</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any stores yet. Create your first store to get started.
                </p>
                <button 
                  onClick={() => setShowCreateStoreModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Store</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <div key={store.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Store Banner */}
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                      {store.banner ? (
                        <img 
                          src={store.banner} 
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          store.status === 'active' ? 'bg-green-100 text-green-800' :
                          store.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {store.status}
                        </span>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {store.logo ? (
                            <img 
                              src={store.logo} 
                              alt={store.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Store className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{store.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{store.rating}</span>
                              <span className="text-sm text-gray-500">({store.reviewCount} reviews)</span>
                            </div>
                          </div>
                        </div>
                        {store.isVerified && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{store.description}</p>

                      {/* Store Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-600">
                            <ShoppingBag className="w-4 h-4" />
                            <span className="text-sm font-medium">{store.totalProducts}</span>
                          </div>
                          <p className="text-xs text-gray-500">Products</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-600">
                            <Store className="w-4 h-4" />
                            <span className="text-sm font-medium">{store.totalOrders}</span>
                          </div>
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm font-medium">${store.totalRevenue?.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>

                      {/* Store Contact */}
                      <div className="space-y-2 mb-4">
                        {store.address && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        )}
                        {store.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{store.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Store Modal */}
      {showCreateStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create New Store</h2>
                <button 
                  onClick={() => setShowCreateStoreModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateStore(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newStoreData.name}
                      onChange={handleNewStoreInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter store name"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Description
                    </label>
                    <textarea
                      name="description"
                      value={newStoreData.description}
                      onChange={handleNewStoreInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your store"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Logo URL
                    </label>
                    <input
                      type="url"
                      name="logo"
                      value={newStoreData.logo}
                      onChange={handleNewStoreInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Banner URL
                    </label>
                    <input
                      type="url"
                      name="banner"
                      value={newStoreData.banner}
                      onChange={handleNewStoreInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/banner.png"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newStoreData.email}
                      onChange={handleNewStoreInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="store@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newStoreData.phone}
                      onChange={handleNewStoreInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Store Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="address.street"
                          value={newStoreData.address.street}
                          onChange={handleNewStoreInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Street Address"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="address.city"
                          value={newStoreData.address.city}
                          onChange={handleNewStoreInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="address.state"
                          value={newStoreData.address.state}
                          onChange={handleNewStoreInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="State/Province"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="address.country"
                          value={newStoreData.address.country}
                          onChange={handleNewStoreInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="address.postalCode"
                          value={newStoreData.address.postalCode}
                          onChange={handleNewStoreInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Postal Code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateStoreModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingStore || !newStoreData.name}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingStore ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

