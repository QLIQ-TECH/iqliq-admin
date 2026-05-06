'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Gift } from 'lucide-react';

const Header = ({ onMenuClick, userType = 'superadmin', user }) => {
  const profileInitial =
    (user?.name && String(user.name).trim().charAt(0).toUpperCase()) ||
    (user?.email && String(user.email).trim().charAt(0).toUpperCase()) ||
    'A';

  const referralHref = userType === 'vendor' ? '/vendor/referral' : '/admin/referral';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: menu (mobile); desktop title skipped for vendors — sidebar already shows IQLIQ */}
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {userType !== 'vendor' && (
            <div className="hidden lg:block">
              <div className="leading-tight">
                <h1 className="text-2xl font-bold text-gray-900">IQLIQ</h1>
                <p className="text-sm text-gray-600">
                  {userType === 'superadmin' ? 'Super Admin Dashboard' : 'Vendor Dashboard'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <Link
            href={referralHref}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition"
          >
            {/* <Gift className="h-4 w-4" /> */}
            Refer Now
          </Link>

          <button className="p-2 rounded-md hover:bg-gray-100 relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          <div
            className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0 cursor-default"
            title={
              user
                ? [user.name, user.email].filter(Boolean).join(' · ') || undefined
                : userType === 'superadmin'
                  ? 'Super Admin'
                  : 'Vendor'
            }
          >
            <span className="text-white font-bold text-sm">{user ? profileInitial : 'A'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
