import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MetricCard from './MetricCard';
import CreateGigDrawer from './createGig/CreateGigDrawer';
import { useAuth } from '../contexts/AuthContext';
import productService from '../lib/services/productService';
import orderService from '../lib/services/orderService';
import { extractOrdersListFromApiResponse, normalizeOrderStatus } from '../lib/utils/vendorOrderUtils';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package,
  Star,
  Users,
  CreditCard,
  BarChart3,
} from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreateGigDrawerOpen, setIsCreateGigDrawerOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const vendorKey = user?.vendorId || user?.id;

  useEffect(() => {
    const fetchVendorProducts = async () => {
      if (!vendorKey) {
        setProducts([]);
        setIsProductsLoading(false);
        return;
      }
      try {
        setIsProductsLoading(true);
        const response = await productService.getAllProducts({
          vendor_id: vendorKey,
          approval_status: 'all',
          limit: 200,
        });
        const list = Array.isArray(response?.data)
          ? response.data
          : (Array.isArray(response?.data?.products) ? response.data.products : []);
        setProducts(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Error loading vendor dashboard products:', error);
        setProducts([]);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchVendorProducts();
  }, [vendorKey]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!vendorKey) {
        setRecentOrders([]);
        return;
      }
      try {
        setOrdersLoading(true);
        const res = await orderService.getVendorOrders(vendorKey, { page: 1, limit: 8 });
        const list = extractOrdersListFromApiResponse(res);
        setRecentOrders(Array.isArray(list) ? list.slice(0, 5) : []);
      } catch (e) {
        console.error('Error loading recent orders:', e);
        setRecentOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    loadRecent();
  }, [vendorKey]);

  const recentOrderStatusColor = (status) => {
    const s = normalizeOrderStatus({ status });
    if (s === 'delivered') return 'bg-green-500';
    if (s === 'shipped') return 'bg-blue-500';
    if (s === 'cancelled' || s === 'refunded') return 'bg-red-500';
    if (s === 'processing' || s === 'accepted') return 'bg-yellow-500';
    return 'bg-amber-500';
  };

  const formatRecentOrderTotal = (order) => {
    const cur = order?.currency || 'USD';
    const sym = cur === 'AED' ? 'AED ' : cur === 'EUR' ? '€' : '$';
    const n = Number(order?.totalAmount ?? order?.total ?? 0);
    return `${sym}${n.toFixed(2)}`;
  };

  const getMappedStatus = (product) => {
    const approval = String(product?.approval_status || '').toLowerCase();
    const lifecycle = String(product?.status || '').toLowerCase();

    if (approval === 'approved') return 'approved';
    if (approval === 'pending') return 'pending';
    if (approval === 'rejected') return 'rejected';
    if (lifecycle === 'draft') return 'draft';
    if (lifecycle === 'inactive' || lifecycle === 'discontinued') return 'inactive';
    if (lifecycle === 'active') return 'active';
    return 'unknown';
  };

  const statusTabs = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      const mapped = getMappedStatus(product);
      acc[mapped] = (acc[mapped] || 0) + 1;
      return acc;
    }, {});

    return [
      { key: 'all', label: 'All', count: products.length },
      { key: 'approved', label: 'Approved', count: counts.approved || 0 },
      { key: 'pending', label: 'Pending', count: counts.pending || 0 },
      { key: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
      { key: 'draft', label: 'Draft', count: counts.draft || 0 },
      { key: 'inactive', label: 'Inactive', count: counts.inactive || 0 },
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedStatus === 'all') return products;
    return products.filter((product) => getMappedStatus(product) === selectedStatus);
  }, [products, selectedStatus]);

  const getStatusBadgeClass = (mappedStatus) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-700',
      inactive: 'bg-slate-100 text-slate-700',
      active: 'bg-blue-100 text-blue-700',
      unknown: 'bg-zinc-100 text-zinc-700',
    };
    return styles[mappedStatus] || styles.unknown;
  };

  return (
    <div className="space-y-8 relative">
      <CreateGigDrawer
        open={isCreateGigDrawerOpen}
        onClose={() => setIsCreateGigDrawerOpen(false)}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Products Status Overview</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedStatus === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Approval</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {isProductsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No products found for selected status.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const mappedStatus = getMappedStatus(product);
                  return (
                    <tr key={product._id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{product.title || '-'}</div>
                        <div className="text-xs text-gray-500">{product.sku || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        AED {Number(product.price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product.stock_quantity ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(mappedStatus)}`}>
                          {String(product.approval_status || mappedStatus).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 uppercase">{product.status || '-'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
            <p className="text-blue-100">Welcome to your Vendor Dashboard</p>
          </div>
          <div className="flex space-x-3">
            <button
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              onClick={() => setIsCreateGigDrawerOpen(true)}
              type="button"
            >
              + Create Gigs
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              My Networks
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Launch Tour
            </button>
          </div>
        </div>
      </div>

      {/* Account Health Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="My Rating"
            value="8/10"
            subtitle="Customer satisfaction"
            icon={Star}
            trend="up"
            trendValue="+0.2"
          />
          <MetricCard
            title="Order Acceptance Rate"
            value="60%"
            subtitle="Last 30 days"
            icon={ShoppingBag}
            trend="down"
            trendValue="-5%"
          />
          <MetricCard
            title="Order Fulfillment Rate"
            value="70%"
            subtitle="On-time delivery"
            icon={Package}
            trend="up"
            trendValue="+3%"
          />
          <MetricCard
            title="Late Dispatch Rate"
            value="80%"
            subtitle="Timely shipping"
            icon={TrendingUp}
            trend="up"
            trendValue="+2%"
          />
          <MetricCard
            title="Order Return Rate"
            value="15%"
            subtitle="Return requests"
            icon={BarChart3}
            trend="down"
            trendValue="-2%"
          />
        </div>
      </div>

      {/* Global Snapshot Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Global Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Sales"
            value="AED 0.0"
            subtitle="Today so far"
            icon={DollarSign}
            trend="up"
            trendValue="+0%"
          />
          <MetricCard
            title="Total Potential Sales"
            value="500"
            subtitle="Pending orders"
            icon={TrendingUp}
            trend="up"
            trendValue="+25"
          />
          <MetricCard
            title="Open Orders"
            value="0"
            subtitle="Total Count"
            icon={ShoppingBag}
            trend="down"
            trendValue="-5"
          />
          <MetricCard
            title="Campaigns"
            value="0"
            subtitle="Active Campaigns"
            icon={BarChart3}
            trend="up"
            trendValue="+1"
          />
        </div>
      </div>

      {/* Vendor Tools Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Vendor Tools & Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="My Gigs"
            value="10"
            subtitle="Active Gigs"
            icon={Package}
            trend="up"
            trendValue="+2"
          />
          <MetricCard
            title="My Qoyn Wallet"
            value="5000"
            subtitle="Expires in 29 Days"
            icon={CreditCard}
            trend="up"
            trendValue="+500"
          />
          <MetricCard
            title="My Cash Wallet"
            value="$1000"
            subtitle="Available Balance"
            icon={DollarSign}
            trend="up"
            trendValue="+$150"
          />
          <MetricCard
            title="My Network"
            value="200"
            subtitle="Total connections"
            icon={Users}
            trend="up"
            trendValue="+12"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
          <button
            type="button"
            onClick={() => router.push('/vendor/orders')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {ordersLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No orders yet. When customers buy your products, they will appear here.</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const id = order._id || order.id;
                const label = order.orderNumber || (id ? String(id).slice(-8) : '—');
                const customer = order.customer?.name
                  || order.shippingAddress?.fullName
                  || 'Customer';
                const status = normalizeOrderStatus(order);
                return (
                  <button
                    key={id || label}
                    type="button"
                    onClick={() => id && router.push(`/vendor/orders/${id}`)}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-100 last:border-0 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${recentOrderStatusColor(status)}`} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900 block truncate">
                          Order #{label}
                        </span>
                        <p className="text-xs text-gray-500 truncate">
                          {customer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-900 block">
                        {formatRecentOrderTotal(order)}
                      </span>
                      <p className="text-xs text-gray-500 capitalize">{status}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wireless Headphones</span>
                <span className="text-sm font-medium text-gray-900">45 sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Smart Watch</span>
                <span className="text-sm font-medium text-gray-900">32 sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phone Case</span>
                <span className="text-sm font-medium text-gray-900">28 sales</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
                <span className="text-sm text-gray-600">4.8/5.0 average rating</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>"Great product quality and fast shipping!"</p>
                <p className="text-xs text-gray-500 mt-1">- Recent customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
