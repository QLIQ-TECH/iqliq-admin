'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { authApi } from '../../../lib/apiClient';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import FormInput from '../../../components/shared/FormInput';
import FormSelect from '../../../components/shared/FormSelect';
import { Settings, Save } from 'lucide-react';

export default function VendorSettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    taxId: '',
    bankAccount: '',
    notificationEmail: true,
    notificationSMS: false
  });
  const EXTRA_SETTINGS_KEY = 'qliq-vendor-settings-extra';
  const USER_KEY = 'qliq-admin-user';

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
      let extra = {};
      if (typeof window !== 'undefined') {
        try {
          extra = JSON.parse(localStorage.getItem(EXTRA_SETTINGS_KEY) || '{}');
        } catch {
          extra = {};
        }
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: extra.businessName || user.businessName || '',
        taxId: extra.taxId || user.taxId || '',
        bankAccount: extra.bankAccount || user.bankAccount || '',
        notificationEmail: typeof extra.notificationEmail === 'boolean' ? extra.notificationEmail : true,
        notificationSMS: typeof extra.notificationSMS === 'boolean' ? extra.notificationSMS : false
      });
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Persist supported profile fields to auth service.
      await authApi.put('/profile', {
        name: formData.name,
        phone: formData.phone,
      });

      if (typeof window !== 'undefined') {
        // Persist custom vendor settings locally until dedicated backend fields are available.
        localStorage.setItem(
          EXTRA_SETTINGS_KEY,
          JSON.stringify({
            businessName: formData.businessName,
            taxId: formData.taxId,
            bankAccount: formData.bankAccount,
            notificationEmail: formData.notificationEmail,
            notificationSMS: formData.notificationSMS,
          })
        );

        // Keep auth user cache in sync for immediate UI consistency.
        const cachedUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        localStorage.setItem(
          USER_KEY,
          JSON.stringify({
            ...cachedUser,
            name: formData.name,
            phone: formData.phone,
          })
        );
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save vendor settings:', error);
      alert(`Failed to save settings: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <div>
                    <FormInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email is managed by authentication and can’t be updated from this page.
                    </p>
                  </div>
                  <FormInput
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <FormInput
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Tax ID"
                    name="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                  <FormInput
                    label="Bank Account"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationEmail}
                      onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationSMS}
                      onChange={(e) => setFormData({ ...formData, notificationSMS: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>SMS Notifications</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

