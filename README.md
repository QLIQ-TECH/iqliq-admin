# QLIQ Admin Panel - Multi-Vendor E-Commerce

A comprehensive admin panel for managing a multi-category, multi-vendor e-commerce platform similar to Amazon, Noon, and Flipkart.

## 🎯 Overview

This admin panel provides complete management capabilities for:
- **SuperAdmin:** Platform-wide control and monitoring
- **Vendor:** Store and product management

Built with Next.js 14, TypeScript/JavaScript, Tailwind CSS, and integrated with microservices architecture.

---

## ✨ Features

### 🔷 SuperAdmin Features (200+ capabilities)
- ✅ **Dashboard & Analytics** - Real-time metrics, revenue analytics, sales forecasting
- ✅ **Vendor Management** - Approval, verification, commission, payouts
- ✅ **Product Management** - Approval, quality control
- ✅ **Category & Catalog** - Multi-level categories, brands, attributes
- ✅ **Order Management** - Order tracking, returns, disputes, refunds
- ✅ **Customer Management** - Customer data and purchase history
- ✅ **Payments & Finance** - Transaction history, commission reports
- ✅ **Shipping & Logistics** - Provider management, zones, rates
- ✅ **Marketing & Promotions** - Coupons, flash sales, banners, campaigns
- ✅ **Reviews & Ratings** - Customer reviews, product ratings, moderation, analytics
- ✅ **Reports & Exports** - Sales, vendor, custom reports, data export
- ✅ **CMS & Content** - Pages, blogs, FAQs, media library
- ✅ **Notifications** - Email, SMS, push notifications
- ✅ **Support & Tickets** - Ticket management, live chat
- ✅ **System Settings** - General, email, SMS, API, security

### 🔶 Vendor Features (150+ capabilities)
- ✅ **Dashboard** - Sales overview, metrics, alerts
- ✅ **Products** - Add, edit, bulk upload, reviews
- ✅ **Inventory** - Stock management, warehouses, alerts
- ✅ **Orders** - Order processing, fulfillment, returns
- ✅ **Shipping** - Methods, tracking, zones
- ✅ **Financial** - Earnings, transactions, payouts, commissions
- ✅ **Analytics** - Traffic, conversion, performance
- ✅ **Marketing** - Coupons, promotions, featured products
- ✅ **Store Management** - Profile, policies, documents
- ✅ **Reviews & Ratings** - Manage and respond to reviews
- ✅ **Reports** - Sales, inventory, exports

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Running microservices (see below)
- MongoDB
- Redis

### Installation

1. **Clone and install:**
   ```bash
cd /Users/sagarsingh/Desktop/codes/prism/qliq/admin
   npm install
   ```

2. **Set up environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your API URLs
```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access admin panel:**
```
http://localhost:3001
```

### Login
- **SuperAdmin:** User with `role: 'superadmin'`
- **Vendor:** User with `role: 'vendor'`

---

## 🏗️ Architecture

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State:** React Context API
- **Auth:** Cookie-based JWT

### Backend Integration
- **Microservices:** 16 services
- **Database:** MongoDB
- **Cache:** Redis
- **Messaging:** Redis Pub/Sub
- **Real-time:** Server-Sent Events (SSE)

---

## 📁 Project Structure

```
admin/
├── app/                          # Next.js App Router
│   ├── admin/                    # SuperAdmin dashboard
│   ├── superadmin/              # SuperAdmin pages
│   │   ├── vendors/             # ✅ Vendor management
│   │   ├── products/            # ✅ Product management
│   │   ├── orders/              # Order management
│   │   ├── customers/           # Customer management
│   │   └── ...                  # 30+ more pages
│   ├── vendor/                  # Vendor pages
│   │   ├── products/            # ✅ Product management
│   │   ├── orders/              # ✅ Order management
│   │   ├── inventory/           # Inventory management
│   │   └── ...                  # 20+ more pages
│   └── login/                   # Login page
│
├── components/
│   ├── shared/                  # Reusable components
│   │   ├── DataTable.jsx        # ✅ Advanced data table
│   │   ├── StatsCard.jsx        # ✅ Stats display
│   │   ├── Modal.jsx            # ✅ Modal dialog
│   │   └── ...
│   ├── Sidebar.jsx              # ✅ Comprehensive navigation
│   ├── Header.jsx               # Header component
│   ├── SuperAdminDashboard.jsx  # Dashboard
│   └── VendorDashboard.jsx      # Vendor dashboard
│
├── lib/
│   ├── apiClient.js             # ✅ Centralized API client
│   ├── redisClient.js           # ✅ Redis Pub/Sub client
│   ├── services/                # API service layer
│   │   ├── vendorService.js     # ✅ Vendor APIs
│   │   ├── productService.js    # ✅ Product APIs
│   │   ├── orderService.js      # ✅ Order APIs
│   │   ├── customerService.js   # ✅ Customer APIs
│   │   ├── commissionService.js # ✅ Commission APIs
│   │   └── promotionService.js  # ✅ Promotion APIs
│   └── utils.js
│
├── contexts/
│   ├── AuthContext.jsx          # Authentication
│   └── MetricsContext.jsx       # Metrics
│
└── styles/
    └── globals.css              # Global styles
```

---

## 🔌 Microservices Integration

### ✅ Existing Services
1. **Auth Service** (port 8888) - User authentication
2. **Admin API** (port 8009) - Metrics, health monitoring
3. **Product Service** (port 3001) - Products, categories, brands
4. **Cart/Payment** (port 3003) - Cart, wishlist, orders, payments
5. **Review Service** (port 3004) - Product & store reviews
6. **Search Service** (port 3002) - Search & filtering

### 🆕 New Services (To Build)
7. **Vendor Service** (port 3005) - Vendor management
8. **Commission Service** (port 3006) - Commission & payouts
9. **Customer Service** (port 3007) - Customer management
10. **Promotion Service** (port 3008) - Coupons, flash sales
11. **Shipping Service** (port 3010) - Shipping & logistics
12. **CMS Service** (port 3011) - Content management
13. **Notification Service** (port 3012) - Notifications
14. **Report Service** (port 3013) - Reports & analytics
15. **Config Service** (port 3014) - System configuration
16. **Support Service** (port 3015) - Support tickets

See `/ADMIN_API_REQUIREMENTS.md` for complete API specifications.

---

## 🎨 UI Components

### DataTable
Advanced table with sorting, search, pagination, and actions.

```jsx
<DataTable
  data={items}
  columns={columns}
  searchable={true}
  pagination={true}
  actions={(row) => <Actions row={row} />}
/>
```

### StatsCard
Display metrics with icons and trends.

```jsx
<StatsCard
  title="Total Sales"
  value="$12,345"
  icon={DollarSign}
  trend="up"
  trendValue="+12%"
  color="green"
/>
```

### Modal
Flexible modal dialog.

```jsx
<Modal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Edit Item"
  size="lg"
>
  {/* Content */}
</Modal>
```

---

## 🔄 Real-time Updates

### Redis Pub/Sub Integration

Subscribe to events:
```jsx
import redisPubSub from '@/lib/redisClient';

useEffect(() => {
  const unsubscribe = redisPubSub.subscribe('order.created', (data) => {
    // Handle new order
    refreshOrders();
  });
  
  return () => unsubscribe();
}, []);
```

Publish events:
```jsx
await redisPubSub.publish('vendor.approved', {
  vendorId,
  status: 'active'
});
```

### Event Channels
- `vendor.approved` / `vendor.rejected` / `vendor.commission`
- `order.created` / `order.status` / `order.refund`
- `product.approved` / `product.rejected`
- `payout.request` / `payout.approved`
- `flash-sale.start` / `flash-sale.end`
- `notification.send`
- `config.updated`
- `customer.status`

---

## 🔐 Authentication

### Role-Based Access Control

**SuperAdmin Routes:**
```jsx
// Automatically redirect non-superadmin users
if (user.role !== 'superadmin') {
  router.push('/vendor');
}
```

**Vendor Routes:**
```jsx
// Automatically redirect non-vendor users
if (user.role !== 'vendor') {
  router.push('/admin');
}
```

### Protected API Calls
All API calls automatically include authentication token from cookies:
```jsx
const response = await vendorService.getAllVendors();
// Token automatically included
```

---

## 📊 Current Implementation Status

### ✅ Completed (Phase 1)
- [x] Comprehensive sidebar navigation (70+ menu items)
- [x] API client with 16 microservice integrations
- [x] Shared UI components (DataTable, StatsCard, Modal)
- [x] SuperAdmin pages (Vendors, Products)
- [x] Vendor pages (Products, Orders)
- [x] Redis Pub/Sub client for real-time updates
- [x] Authentication and routing
- [x] Responsive design

### 🔲 To Do (Phase 2-4)
- [ ] Build 10 new microservices (see API requirements)
- [ ] Create 50+ additional pages
- [ ] Implement SSE endpoint for real-time events
- [ ] Add charts and data visualization
- [ ] Create form components
- [ ] Add comprehensive testing
- [ ] Performance optimization
- [ ] Security audit

---

## 📚 Documentation

1. **[Feature List](/ADMIN_PANEL_FEATURES.md)** - Complete feature checklist
2. **[API Requirements](/ADMIN_API_REQUIREMENTS.md)** - API specifications
3. **[Implementation Summary](/ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md)** - What's built
4. **[Quick Start](/ADMIN_QUICK_START.md)** - Getting started guide

---

## 🛠️ Development Workflow

### Adding a New Page

1. Create page file:
```bash
touch app/superadmin/new-feature/page.jsx
```

2. Use template:
```jsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/shared/DataTable';

export default function NewFeaturePage() {
  const { user, logout } = useAuth();
  // Your logic
}
```

3. Add to sidebar:
```jsx
// In components/Sidebar.jsx
{ label: 'New Feature', href: '/superadmin/new-feature' }
```

### Adding a New API Service

1. Create service file:
```bash
touch lib/services/newService.js
```

2. Use apiClient:
```jsx
import { apiClient } from '../apiClient';

export const newService = {
  getAll: () => apiClient.get('/api/endpoint'),
  create: (data) => apiClient.post('/api/endpoint', data),
};
```

---

## 🐛 Troubleshooting

### Common Issues

**API Not Connecting:**
- Ensure microservices are running
- Check `.env.local` has correct URLs
- Verify CORS is enabled on backend

**Authentication Failed:**
- Ensure auth service (port 8888) is running
- Check cookies are enabled
- Verify JWT token is valid

**Real-time Not Working:**
- SSE endpoint `/api/events` needs to be implemented
- Check Redis is running
- Verify event channels are subscribed

**Styling Issues:**
- Ensure Tailwind CSS is configured
- Import `globals.css` in layout
- Check component class names

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_AUTH_API_URL=https://api.qliq.com/auth
NEXT_PUBLIC_ADMIN_API_URL=https://api.qliq.com/admin
# ... other API URLs
```

---

## 🤝 Contributing

1. Follow existing code patterns
2. Use provided components (DataTable, StatsCard, Modal)
3. Add proper error handling
4. Test with both SuperAdmin and Vendor roles
5. Update documentation

---

## 📝 License

Proprietary - QLIQ Platform

---

## 👥 Team

Built for QLIQ Multi-Vendor E-Commerce Platform

---

## 🎯 Roadmap

### Q4 2025
- ✅ Core admin panel foundation
- 🔲 Build vendor management service
- 🔲 Build commission & payout service
- 🔲 Complete order management

### Q1 2026
- 🔲 Customer management service
- 🔲 Marketing & promotion features
- 🔲 Shipping & logistics
- 🔲 Advanced analytics

### Q2 2026
- 🔲 CMS and content management
- 🔲 Notification system
- 🔲 Advanced reporting
- 🔲 Mobile app

---

**Need help? Check the documentation or review existing implementations!** 🚀
