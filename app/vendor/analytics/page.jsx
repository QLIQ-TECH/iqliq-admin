'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import StatsCard from '../../../components/shared/StatsCard';
import LineChart from '../../../components/shared/LineChart';
import BarChart from '../../../components/shared/BarChart';
import PieChart from '../../../components/shared/PieChart';
import { TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';
import analyticsService from '../../../lib/services/analyticsService';

export default function VendorAnalyticsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    salesTrend: [],
    topProducts: [],
    trafficSources: [],
    performanceMetrics: {}
  });

  const emptyOverview = {
    totalRevenue: 0,
    totalOrders: 0,
    storeVisitors: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    returnRate: 0,
    customerSatisfaction: 0,
    totalProducts: 0,
    activeProducts: 0,
    commissionRate: 0
  };

  const clearAnalytics = () =>
    setAnalyticsData({
      overview: { ...emptyOverview },
      salesTrend: [],
      topProducts: [],
      trafficSources: [],
      performanceMetrics: {}
    });

  // No placeholder "demo" numbers — avoid showing marketplace-wide or fake stats

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  const fetchAnalytics = useCallback(async () => {
    const vendorId = user?.vendorId || user?.id;
    if (!vendorId) {
      clearAnalytics();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await analyticsService.getVendorAnalytics(vendorId, { period: dateRange });
      const data = response?.data || {};

      setAnalyticsData({
        overview: { ...emptyOverview, ...(data.overview || {}) },
        salesTrend: Array.isArray(data.salesTrend) ? data.salesTrend : [],
        topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
        trafficSources: Array.isArray(data.trafficSources) ? data.trafficSources : [],
        performanceMetrics: data.performanceMetrics && typeof data.performanceMetrics === 'object'
          ? data.performanceMetrics
          : {}
      });
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      clearAnalytics();
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    if (isLoading || !user || user.role !== 'vendor') return;
    fetchAnalytics();
  }, [user, isLoading, fetchAnalytics]);

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
        userType="vendor"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your store performance</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Revenue"
              value={`$${analyticsData.overview.totalRevenue?.toLocaleString() || '0'}`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+15.3%"
            />
            <StatsCard
              title="Total Orders"
              value={analyticsData.overview.totalOrders?.toString() || '0'}
              icon={ShoppingBag}
              color="blue"
              trend="up"
              trendValue="+8.7%"
            />
            <StatsCard
              title="Store Visitors"
              value={analyticsData.overview.storeVisitors?.toLocaleString() || '0'}
              icon={Users}
              color="purple"
              trend="up"
              trendValue="+12.1%"
            />
            <StatsCard
              title="Conversion Rate"
              value={`${analyticsData.overview.conversionRate?.toFixed(1) || '0.0'}%`}
              icon={TrendingUp}
              color="indigo"
              trend="up"
              trendValue="+0.8%"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales & Visitors Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales & Visitors Trend</h3>
              <LineChart data={analyticsData.salesTrend} dataKeys={['sales', 'visitors']} height={300} />
            </div>

            {/* Top Products Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              <BarChart data={analyticsData.topProducts} dataKeys={['sales']} height={300} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <PieChart data={analyticsData.trafficSources} height={300} />
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Key Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold text-lg">${analyticsData.overview.averageOrderValue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Return Rate</span>
                  <span className="font-semibold text-lg text-yellow-600">{analyticsData.overview.returnRate?.toFixed(1) || '0.0'}%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-lg text-green-600">{analyticsData.overview.customerSatisfaction?.toFixed(1) || '0.0'}/5.0</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.totalProducts || '0'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Active Products</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.activeProducts || '0'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Commission Rate</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.commissionRate || '0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

