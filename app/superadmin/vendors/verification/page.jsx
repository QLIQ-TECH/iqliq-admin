'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  UserCheck, 
  UserX, 
  Eye, 
  FileText, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  Clock
} from 'lucide-react';
import vendorService from '../../../../lib/services/vendorService';

const DOC_SLOTS = [
  { key: 'businessLicense', label: 'Business License', aliases: ['businessLicense', 'business_license', 'tradeLicense', 'trade_license', 'license'] },
  { key: 'taxId', label: 'Tax ID', aliases: ['taxId', 'tax_id', 'vat', 'vat_certificate', 'taxCertificate', 'vatCertificate'] },
  { key: 'bankAccount', label: 'Bank Account', aliases: ['bankAccount', 'bank_account', 'bankStatement', 'bank_statement'] },
];

/** Pull a displayable URL/path/string from API values (string key, nested { url }, etc.). */
function coerceDocValue(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (typeof v === 'object') {
    return coerceDocValue(
      v.url ?? v.href ?? v.signedUrl ?? v.publicUrl ?? v.fileUrl ?? v.path ?? v.key ?? ''
    );
  }
  return '';
}

function pickFromObject(obj, aliases) {
  if (!obj || typeof obj !== 'object') return '';
  for (const a of aliases) {
    const val = coerceDocValue(obj[a]);
    if (val) return val;
  }
  return '';
}

/** Canonical { businessLicense, taxId, bankAccount } — merges nested `documents` + snake_case + top-level fallbacks */
function flattenVendorDocuments(vendor) {
  const docBag = vendor?.documents && typeof vendor.documents === 'object' ? { ...vendor.documents } : {};
  const merged = {};
  for (const { key, aliases } of DOC_SLOTS) {
    merged[key] = pickFromObject(docBag, aliases) || pickFromObject(vendor, aliases);
  }
  return merged;
}

/** Build an absolute browser URL so <a href> and window.open work (admin hostname is not vendor API origin). */
function resolveVendorDocumentHref(raw, vendorId) {
  const s = coerceDocValue(raw);
  if (!s) return '';

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;

  const publicBase = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VENDOR_DOCUMENT_PUBLIC_BASE_URL) || '';

  try {
    const apiUrl =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VENDOR_API_URL) || 'http://localhost:8009/api';
    const base = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;
    const u = new URL(base);
    const origin = u.origin;
    const pathPrefix = (u.pathname || '/api').replace(/\/$/, '');

    if (s.startsWith('/')) return `${origin}${s}`;

    const isLikelyBareKey =
      vendorId &&
      typeof s === 'string' &&
      s.length > 0 &&
      !/\s/.test(s) &&
      !/^https?:/i.test(s) &&
      !s.startsWith('/');

    if (isLikelyBareKey && origin && pathPrefix) {
      const qUrl = `${origin}${pathPrefix}/vendors/${encodeURIComponent(vendorId)}/documents/download?key=${encodeURIComponent(s)}`;
      return qUrl;
    }

    if (origin) {
      if (publicBase) {
        const b = String(publicBase).replace(/\/$/, '');
        return `${b}/${encodeURIComponent(s)}`;
      }
      return `${origin}${pathPrefix}/uploads/vendor-documents/${encodeURIComponent(s)}`;
    }
  } catch {
    /* fall through */
  }

  return s;
}

function unwrapVendorDocumentsPayload(body) {
  if (!body || typeof body !== 'object') return null;
  const inner =
    body.documents ??
    body.data?.documents ??
    body.data ??
    body.result ??
    body;
  if (!inner || typeof inner !== 'object') return null;
  if (Array.isArray(inner)) {
    const mapped = { businessLicense: '', taxId: '', bankAccount: '' };
    for (const row of inner) {
      const typeRaw = coerceDocValue(row.documentType ?? row.type ?? row.category ?? row.name ?? '');
      const type = String(typeRaw).toLowerCase();
      const url = coerceDocValue(row.url ?? row.fileUrl ?? row.signedUrl ?? row.path ?? row);
      if (!url) continue;
      if (/business|license|trade/i.test(type)) mapped.businessLicense = url;
      else if (/tax|vat|ein/i.test(type)) mapped.taxId = url;
      else if (/bank/i.test(type)) mapped.bankAccount = url;
    }
    return mapped;
  }
  return flattenVendorDocuments(inner);
}

function mergeCanonicalDocuments(prev, incoming) {
  const a = flattenVendorDocuments({ documents: prev });
  const b =
    incoming && typeof incoming === 'object'
      ? flattenVendorDocuments(incoming)
      : { businessLicense: '', taxId: '', bankAccount: '' };
  const out = { ...a };
  for (const k of ['businessLicense', 'taxId', 'bankAccount']) {
    const bv = coerceDocValue(b[k]);
    if (bv) out[k] = bv;
  }
  return out;
}

export default function VendorVerification() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && user.role !== 'superadmin') {
      router.push('/admin');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors();
      console.log('API Response:', response);
      
      // Use the data as-is from the API (no transformation needed)
      const vendorsData = response.data || [];
      
      // Normalize ID/business fields without injecting fake documents
      const transformedVendors = vendorsData.map((vendor) => ({
        ...vendor,
        id: vendor.id || vendor._id,
        businessName: vendor.businessName || 'N/A',
        verified: !!(vendor.verified ?? vendor.isVerified),
        documents: flattenVendorDocuments(vendor),
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to mock data - matching real API response structure
      setVendors([
        {
          id: '68e603782be27293e45b44bb',
          name: 'Rohit singh',
          email: 'vendor@qliq.ae',
          role: 'vendor',
          status: 'active',
          verified: true,
          phone: '8689912326',
          createdAt: '2025-10-08T06:23:52.557Z',
          cognitoUserId: '3296c0f4-d0e1-7045-3d3c-9e842c5e009c',
          businessName: 'QLIQ',
          documents: {
            businessLicense: 'business_license_123.pdf',
            taxId: 'tax_id_123.pdf',
            bankAccount: 'bank_account_123.pdf'
          }
        },
        {
          id: '68df6a76c3f7bbb457643776',
          name: 'Default Vendor',
          email: 'vendor@qliq.com',
          role: 'vendor',
          status: 'inactive',
          verified: false,
          phone: '971500000002',
          createdAt: '2025-10-03T06:17:26.096Z',
          cognitoUserId: 'vendor@qliq.com',
          businessName: 'Default Business',
          documents: {
            businessLicense: 'business_license_456.pdf',
            taxId: 'tax_id_456.pdf',
            bankAccount: 'bank_account_456.pdf'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (vendorId) => {
    try {
      console.log('Verifying vendor with ID:', vendorId);
      if (!vendorId) {
        alert('Error: Vendor ID is missing');
        return;
      }
      await vendorService.verifyVendor(vendorId, { verified: true });
      fetchVendors();
      alert('Vendor verified successfully! You can now set commission rates for this vendor on the Commission Settings page.');
    } catch (error) {
      console.error('Error verifying vendor:', error);
      alert('Error verifying vendor: ' + error.message);
    }
  };

  const handleReject = async (vendorId, reason) => {
    try {
      const rejectionReason = reason || prompt('Please provide a reason for rejection:');
      if (rejectionReason) {
        await vendorService.verifyVendor(vendorId, { 
          verified: false, 
          rejectionReason
        });
        fetchVendors();
        alert('Vendor verification rejected.');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert('Error rejecting vendor: ' + error.message);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const refreshVendorDocuments = async (vendor) => {
    const id = vendor?.id || vendor?._id;
    if (!id) return;
    setDocumentsLoading(true);
    try {
      const res = await vendorService.getVendorDocuments(id);
      const next = unwrapVendorDocumentsPayload(res);
      if (next) {
        setSelectedVendor((prev) => {
          if (!prev || (prev.id || prev._id) !== id) return prev;
          return {
            ...prev,
            documents: mergeCanonicalDocuments(prev.documents ?? {}, next),
          };
        });
      }
    } catch (err) {
      console.warn('[Vendor Verification] Could not refresh documents from API:', err?.message || err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const openVendorDetailsModal = async (vendor) => {
    const normalized = {
      ...vendor,
      id: vendor.id || vendor._id,
      verified: !!(vendor.verified ?? vendor.isVerified),
      documents: flattenVendorDocuments(vendor),
    };
    setSelectedVendor(normalized);
    setShowModal(true);
    await refreshVendorDocuments(normalized);
  };

  const openDocumentViewer = (label, rawUrl) => {
    const vid = selectedVendor?.id || selectedVendor?._id;
    const href = resolveVendorDocumentHref(rawUrl, vid);
    setSelectedDocument({ label, raw: rawUrl, href });
    setShowDocumentModal(true);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Use verified field from User model
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && !vendor.verified) ||
                         (filterStatus === 'verified' && vendor.verified) ||
                         (filterStatus === 'rejected' && !vendor.verified && vendor.rejectionReason);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter(v => !v.verified && v.status !== 'rejected').length,
    verified: vendors.filter(v => v.verified).length,
    rejected: vendors.filter(v => v.status === 'rejected').length
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

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                    Vendor Verification
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Verify vendor documents and approve vendor accounts. After verification, you can set commission rates on the 
                    <a 
                      href="/superadmin/vendors/commission" 
                      className="text-blue-600 hover:text-blue-800 ml-1 underline"
                    >
                      Commission Settings page
                    </a>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Vendors</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {vendor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                              <div className="text-sm text-gray-500">{vendor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.businessName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vendor.verified 
                                ? 'bg-green-100 text-green-800' 
                                : vendor.rejectionReason
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {vendor.verified ? 'Verified' : vendor.rejectionReason ? 'Rejected' : 'Pending'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vendor.status === 'active' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {vendor.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const rd = flattenVendorDocuments(vendor);
                              return (
                                <>
                                  {coerceDocValue(rd.businessLicense) && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      License
                                    </span>
                                  )}
                                  {coerceDocValue(rd.taxId) && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Tax ID
                                    </span>
                                  )}
                                  {coerceDocValue(rd.bankAccount) && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      Bank
                                    </span>
                                  )}
                                  {!coerceDocValue(rd.businessLicense) &&
                                    !coerceDocValue(rd.taxId) &&
                                    !coerceDocValue(rd.bankAccount) && (
                                      <span className="text-xs text-gray-400">None</span>
                                    )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                openVendorDetailsModal(vendor);
                              }}
                              className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                              title="View Details & Take Action"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Vendor Details</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedVendor.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <p className="text-sm text-gray-900">{selectedVendor.businessName}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                  {documentsLoading && (
                    <p className="text-sm text-gray-500 mb-2">Loading document links…</p>
                  )}
                  <div className="space-y-2">
                    {(() => {
                      const docsBag = flattenVendorDocuments(selectedVendor);
                      const hasAnyDoc = DOC_SLOTS.some(({ key }) => coerceDocValue(docsBag[key]));
                      if (!hasAnyDoc && !documentsLoading) {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                            No documents
                          </div>
                        );
                      }
                      return DOC_SLOTS.map(({ key, label }) => {
                        const raw = coerceDocValue(docsBag[key]);
                        if (!raw) return null;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-900 truncate">{label}</span>
                            </div>
                            <button
                              type="button"
                              disabled={documentsLoading}
                              onClick={() => openDocumentViewer(label, raw)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors shrink-0 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              View
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed footer — single approve/reject control (handles both verified and isVerified flags) */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-0">
              {selectedVendor.verified ? (
                <div className="flex items-center justify-center gap-2 text-green-800 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">This vendor has been verified (Commission Model)</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleVerify(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Verify Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleReject(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Reject Vendor
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDocumentModal(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-lg max-w-xl w-full p-6"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocument?.label || 'Document'}</h3>
              <button
                type="button"
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            {selectedDocument?.href ? (
              <div className="space-y-3">
                {(() => {
                  const h = selectedDocument.href || '';
                  const isImg = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(h.split('?')[0] || '');
                  const isPdf = /\.pdf$/i.test(h.split('?')[0] || '');
                  return (
                    <>
                      {(isImg || isPdf) && (
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                          {isImg ? (
                            <img src={h} alt={selectedDocument.label || 'Document'} className="max-h-64 mx-auto object-contain" />
                          ) : (
                            <iframe title="Document preview" src={h} className="w-full h-72 border-0" />
                          )}
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Resolved URL</p>
                        <p className="text-sm text-gray-700 break-all font-mono">{h}</p>
                        {selectedDocument.raw && coerceDocValue(selectedDocument.raw) !== h && (
                          <p className="text-xs text-gray-500 mt-2 break-all">Stored reference: {String(selectedDocument.raw)}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={h}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Open in new tab
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(h);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Copy URL
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No document URL could be resolved for this item.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
