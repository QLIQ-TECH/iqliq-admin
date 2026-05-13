'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import AdvancedFilter from '../../../components/shared/AdvancedFilter';
import ExportButton from '../../../components/shared/ExportButton';
import { ShoppingCart, Package, Truck, CheckCircle, XCircle, Eye, DollarSign, Users, TrendingUp, Clock, AlertCircle, Store, User } from 'lucide-react';
import orderService from '../../../lib/services/orderService';
import vendorService from '../../../lib/services/vendorService';

export default function OrdersPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all-orders');
  const [vendorStats, setVendorStats] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [vendorStoreOrders, setVendorStoreOrders] = useState([]);
  const [showVendorStoreModal, setShowVendorStoreModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    other: 0,
    processing: 0,
    delivered: 0,
    revenue: 0
  });

  const extractOrdersFromResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.orders)) return response.data.orders;
    if (Array.isArray(response?.orders)) return response.orders;
    if (Array.isArray(response?.data?.data?.orders)) return response.data.data.orders;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchOrders();
      fetchVendors();
    }
  }, [user, isLoading, router]);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      if (response.success) {
        setVendors(response.data || []);
        console.log('✅ Vendors fetched successfully:', response.data?.length || 0, 'vendors');
      }
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
    }
  };

  const getVendorInfo = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId || v.id === vendorId);
    return vendor ? {
      name: vendor.name || vendor.businessName || vendor.email,
      email: vendor.email,
      stores: vendor.stores || []
    } : {
      name: 'Unknown Vendor',
      email: 'unknown@example.com',
      stores: []
    };
  };

  const calculateVendorStats = (ordersData) => {
    const vendorMap = new Map();
    
    ordersData.forEach(order => {
      // Extract vendor information from order items
      order.items?.forEach(item => {
        const vendorId = item.vendorId || 'unknown';
        const storeId = item.storeId || 'unknown';
        
        // Get proper vendor information
        const vendorInfo = getVendorInfo(vendorId);
        const vendorName = vendorInfo.name;
        
        // Try to get store name from vendor's stores or use item store name
        let storeName = item.storeName || 'Unknown Store';
        if (vendorInfo.stores && vendorInfo.stores.length > 0) {
          const store = vendorInfo.stores.find(s => s._id === storeId || s.id === storeId);
          if (store) {
            storeName = store.name || storeName;
          }
        }
        
        // Create a unique key for vendor-store combination
        const vendorStoreKey = `${vendorId}-${storeId}`;
        
        if (!vendorMap.has(vendorStoreKey)) {
          vendorMap.set(vendorStoreKey, {
            vendorId,
            vendorName,
            vendorEmail: vendorInfo.email,
            storeId,
            storeName,
            totalOrders: 0,
            pendingOrders: 0,
            acceptedOrders: 0,
            rejectedOrders: 0,
            otherOrders: 0,
            processingOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            totalItems: 0
          });
        }
        
        const vendor = vendorMap.get(vendorStoreKey);
        vendor.totalOrders++;
        vendor.totalItems += item.quantity;
        vendor.totalRevenue += (item.price * item.quantity);
        
        // Count orders by status
        if (order.status === 'pending') vendor.pendingOrders++;
        else if (order.status === 'accepted') vendor.acceptedOrders++;
        else if (order.status === 'rejected') vendor.rejectedOrders++;
        else if (order.status === 'other') vendor.otherOrders++;
        else if (order.status === 'processing') vendor.processingOrders++;
        else if (order.status === 'delivered') vendor.deliveredOrders++;
        else if (order.status === 'cancelled') vendor.cancelledOrders++;
      });
    });
    
    return Array.from(vendorMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      const ordersData = extractOrdersFromResponse(response);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      
      // Calculate overall stats
      const total = ordersData.length;
      const pending = ordersData.filter(o => o.status === 'pending').length;
      const accepted = ordersData.filter(o => o.status === 'accepted').length;
      const rejected = ordersData.filter(o => o.status === 'rejected').length;
      const other = ordersData.filter(o => o.status === 'other').length;
      const processing = ordersData.filter(o => o.status === 'processing').length;
      const delivered = ordersData.filter(o => o.status === 'delivered').length;
      const revenue = ordersData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      setStats({ total, pending, accepted, rejected, other, processing, delivered, revenue });
      
      // Calculate vendor stats
      const vendorStatsData = calculateVendorStats(ordersData);
      setVendorStats(vendorStatsData);
      
      console.log('✅ Orders fetched successfully:', ordersData.length, 'orders');
      console.log('📊 Vendor stats calculated:', vendorStatsData.length, 'vendors');
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filters) => {
    let filtered = [...orders];
    
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
    }
    if (filters.minAmount) {
      filtered = filtered.filter(o => o.total >= parseFloat(filters.minAmount));
    }
    
    setFilteredOrders(filtered);
  };

  const handleClearFilters = () => {
    setFilteredOrders(orders);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setFilteredOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Refresh stats
        fetchOrders();
        
        console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
      } else {
        console.error('❌ Failed to update order status:', response.message);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
    }
  };

  const handleVendorClick = (vendor) => {
    const vendorInfo = getVendorInfo(vendor.vendorId);
    setSelectedVendor({
      ...vendor,
      ...vendorInfo
    });
    setShowVendorStoreModal(true);
  };

  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setShowVendorStoreModal(false);
    
    try {
      setLoading(true);
      const response = await orderService.getVendorStoreOrders(selectedVendor.vendorId, store.id || store._id);
      if (response.success) {
        setVendorStoreOrders(response.data || []);
        setActiveTab('vendor-orders');
      }
    } catch (error) {
      console.error('❌ Error fetching vendor store orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToVendorStats = () => {
    setSelectedVendor(null);
    setSelectedStore(null);
    setVendorStoreOrders([]);
    setActiveTab('vendor-stats');
  };

  const filterConfig = [
    {
      name: 'status',
      label: 'Order Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    },
    {
      name: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      name: 'dateTo',
      label: 'Date To',
      type: 'date'
    },
    {
      name: 'minAmount',
      label: 'Min Amount',
      type: 'number',
      placeholder: '0.00'
    }
  ];

  const columns = [
    { 
      key: 'orderNumber', 
      label: 'Order ID', 
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="font-mono font-medium text-blue-600">{value || 'N/A'}</span>
          <div className="text-xs text-gray-500">ID: {row._id?.slice(-8) || 'N/A'}</div>
        </div>
      )
    },
    { 
      key: 'userId', 
      label: 'Customer', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {row.shippingAddress?.fullName || 'Guest'}
          </div>
          <div className="text-xs text-gray-500">
            {row.shippingAddress?.email || value || 'No email'}
          </div>
        </div>
      )
    },
    { 
      key: 'items', 
      label: 'Items', 
      sortable: false,
      render: (value) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {value?.length || 0} items
          </div>
          <div className="text-xs text-gray-500">
            {value?.reduce((sum, item) => sum + item.quantity, 0) || 0} total qty
          </div>
        </div>
      )
    },
    { 
      key: 'totalAmount', 
      label: 'Amount', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            ${value?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500">
            {row.currency?.toUpperCase() || 'USD'}
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === 'delivered' ? 'bg-green-100 text-green-800' :
              value === 'processing' ? 'bg-blue-100 text-blue-800' :
              value === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
              value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              value === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
              value === 'rejected' ? 'bg-red-100 text-red-800' :
              value === 'other' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {value}
            </span>
            <select
              value={value}
              onChange={(e) => handleStatusUpdate(row._id, e.target.value)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="other">Other</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-xs text-gray-500">
            Payment: {row.paymentStatus || 'unknown'}
          </div>
        </div>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      sortable: true,
      render: (value) => (
        <div>
          <div className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      )
    },
  ];

  const actions = (row) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedOrder(row);
        setShowModal(true);
      }}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
      title="View Details"
    >
      <Eye className="w-5 h-5" />
    </button>
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="superadmin"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="superadmin"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage all platform orders and vendor statistics</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOrders}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <AdvancedFilter filters={filterConfig} onApply={handleFilter} onClear={handleClearFilters} />
              <ExportButton data={filteredOrders} filename="orders-export" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <StatsCard
              title="Total Orders"
              value={stats.total}
              icon={ShoppingCart}
              color="blue"
            />
            <StatsCard
              title="Pending"
              value={stats.pending}
              icon={Package}
              color="yellow"
            />
            <StatsCard
              title="Accepted"
              value={stats.accepted}
              icon={CheckCircle}
              color="emerald"
            />
            <StatsCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="red"
            />
            <StatsCard
              title="Other"
              value={stats.other}
              icon={AlertCircle}
              color="purple"
            />
            <StatsCard
              title="Processing"
              value={stats.processing}
              icon={Truck}
              color="indigo"
            />
            <StatsCard
              title="Delivered"
              value={stats.delivered}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Total Revenue"
              value={`$${stats.revenue.toFixed(2)}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('all-orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all-orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>All Orders</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('vendor-stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'vendor-stats'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Vendor Statistics</span>
                  </div>
                </button>
                {selectedVendor && selectedStore && (
                  <button
                    onClick={() => setActiveTab('vendor-orders')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'vendor-orders'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4" />
                      <span>{selectedVendor.vendorName} - {selectedStore.name}</span>
                    </div>
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'all-orders' && (
            <div>
              {/* Orders Table */}
              <DataTable
                data={filteredOrders}
                columns={columns}
                actions={actions}
                searchable={true}
                pagination={true}
                emptyMessage="No orders found"
              />
            </div>
          )}

          {activeTab === 'vendor-stats' && (
            <div>
              {/* Vendor Statistics Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Vendor Order Statistics</h3>
                  <p className="text-sm text-gray-600 mt-1">Performance metrics for each vendor and their stores</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor & Store
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Orders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accepted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rejected
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Other
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancelled
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorStats.map((vendor, index) => (
                        <tr key={`${vendor.vendorId}-${vendor.storeId}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {vendor.vendorName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <button
                                  onClick={() => handleVendorClick(vendor)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {vendor.vendorName}
                                </button>
                                <div className="text-sm text-gray-500">
                                  Store: {vendor.storeName}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {vendor.vendorEmail} | Store ID: {vendor.storeId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.totalOrders}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {vendor.pendingOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              {vendor.acceptedOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {vendor.rejectedOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {vendor.otherOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {vendor.processingOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {vendor.deliveredOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {vendor.cancelledOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vendor.totalItems}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${vendor.totalRevenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {vendorStats.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No vendor data</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No orders found to calculate vendor statistics.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendor-orders' && selectedVendor && selectedStore && (
            <div>
              {/* Vendor Store Orders Header */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Orders for {selectedVendor.vendorName} - {selectedStore.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {vendorStoreOrders.length} orders found
                    </p>
                  </div>
                  <button
                    onClick={handleBackToVendorStats}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <span>← Back to Vendor Statistics</span>
                  </button>
                </div>
              </div>

              {/* Vendor Store Orders Table */}
              <DataTable
                data={vendorStoreOrders}
                columns={columns}
                actions={actions}
                searchable={true}
                pagination={true}
                emptyMessage="No orders found for this vendor store"
              />
            </div>
          )}

          {/* Vendor Store Selection Modal */}
          <Modal
            isOpen={showVendorStoreModal}
            onClose={() => {
              setShowVendorStoreModal(false);
              setSelectedVendor(null);
            }}
            title="Select Store"
            size="md"
          >
            {selectedVendor && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Vendor Information</h4>
                  <p className="text-sm text-gray-600">{selectedVendor.vendorName}</p>
                  <p className="text-xs text-gray-500">{selectedVendor.vendorEmail}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Available Stores</h4>
                  {selectedVendor.stores && selectedVendor.stores.length > 0 ? (
                    <div className="space-y-2">
                      {selectedVendor.stores.map((store, index) => (
                        <button
                          key={store.id || store._id || index}
                          onClick={() => handleStoreSelect(store)}
                          className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{store.name}</p>
                              <p className="text-xs text-gray-500">{store.description || 'No description'}</p>
                            </div>
                            <Store className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Store className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No stores found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This vendor doesn't have any stores configured.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* Order Details Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedOrder(null);
            }}
            title="Order Details"
            size="xl"
          >
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order Number</label>
                      <p className="text-gray-900 font-mono text-lg">{selectedOrder.orderNumber}</p>
                      <p className="text-xs text-gray-500">ID: {selectedOrder._id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          selectedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                          selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Payment Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">{selectedOrder.shippingAddress?.fullName || selectedOrder.deliveryAddress?.fullName || 'Guest'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedOrder.shippingAddress?.email || selectedOrder.deliveryAddress?.email || 'No email'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{selectedOrder.shippingAddress?.phone || selectedOrder.deliveryAddress?.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Method</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedOrder.paymentMethod || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Total Amount</label>
                        <p className="text-sm font-semibold text-gray-900">
                          ${selectedOrder.totalAmount?.toFixed(2)} {selectedOrder.currency?.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Order Date</label>
                        <p className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping Address</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.shippingAddress?.fullName || selectedOrder.shippingAddress?.addressLine1 ? (
                      <p className="text-sm text-gray-900">
                        {selectedOrder.shippingAddress?.fullName || 'Name not provided'}<br/>
                        {selectedOrder.shippingAddress?.addressLine1 || 'Address not provided'}<br/>
                        {selectedOrder.shippingAddress?.addressLine2 && (
                          <>{selectedOrder.shippingAddress.addressLine2}<br/></>
                        )}
                        {selectedOrder.shippingAddress?.city || 'City not provided'}, {selectedOrder.shippingAddress?.state || 'State not provided'} {selectedOrder.shippingAddress?.postalCode || '00000'}<br/>
                        {selectedOrder.shippingAddress?.country || 'Country not provided'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No shipping address provided</p>
                    )}
                  </div>
                </div>
                
                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-16 h-16 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center"
                              style={{ display: item.image ? 'none' : 'flex' }}
                            >
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Product Info */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h5>
                                <p className="text-xs text-gray-500 mb-2">SKU: {item.sku || 'N/A'}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-600">Qty: <span className="font-medium text-gray-900">{item.quantity}</span></span>
                                  <span className="text-gray-600">Price: <span className="font-medium text-gray-900">${item.price?.toFixed(2)}</span></span>
                                </div>
                              </div>
                              
                              {/* Vendor & Store Info */}
                              <div className="space-y-2">
                                {/* Vendor Details */}
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <h6 className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    Vendor Details
                                  </h6>
                                  <p className="text-sm text-gray-900">{item.vendorName || 'Unknown Vendor'}</p>
                                  <p className="text-xs text-gray-500">ID: {item.vendorId || 'N/A'}</p>
                                </div>
                                
                                {/* Store Details */}
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <h6 className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                                    <Store className="w-3 h-3 mr-1" />
                                    Store Details
                                  </h6>
                                  <p className="text-sm text-gray-900">{item.storeName || 'Unknown Store'}</p>
                                  <p className="text-xs text-gray-500">ID: {item.storeId || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-center py-4">No items found</p>}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">${selectedOrder.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT:</span>
                      <span className="text-gray-900">${selectedOrder.vat?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">${selectedOrder.shippingCost?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">-${selectedOrder.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${selectedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}

