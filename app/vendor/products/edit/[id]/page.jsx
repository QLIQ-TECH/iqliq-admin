'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import productService from '../../../../../lib/services/productService';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawProduct, setRawProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    sku: '',
    barcode: '',
    price: '',
    discount_price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_level: '',
    status: 'draft',
    approval_status: 'pending',
    is_featured: false,
    is_digital: false,
    warranty_period: '',
    warranty_type: '',
    meta_title: '',
    meta_description: '',
    tagsText: '',
    imagesJson: '[]',
    specificationsJson: '{}',
    attributesJson: '{}',
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
    if (user && id) {
      fetchProduct();
    }
  }, [user, isLoading, id, router]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id);
      const product = response?.data || response?.product;
      if (!product) {
        alert('Product not found');
        router.push('/vendor/products');
        return;
      }

      setRawProduct(product);
      setFormData({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        price: String(product.price ?? ''),
        discount_price: String(product.discount_price ?? ''),
        cost_price: String(product.cost_price ?? ''),
        stock_quantity: String(product.stock_quantity ?? 0),
        min_stock_level: String(product.min_stock_level ?? ''),
        status: product.status || 'draft',
        approval_status: product.approval_status || 'pending',
        is_featured: Boolean(product.is_featured),
        is_digital: Boolean(product.is_digital),
        warranty_period: String(product.warranty_period ?? ''),
        warranty_type: product.warranty_type || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        tagsText: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        imagesJson: JSON.stringify(product.images || [], null, 2),
        specificationsJson: JSON.stringify(product.specifications || {}, null, 2),
        attributesJson: JSON.stringify(product.attributes || {}, null, 2),
      });
    } catch (error) {
      alert(error?.message || 'Failed to load product');
      router.push('/vendor/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let images = [];
      let specifications = {};
      let attributes = {};
      try {
        images = JSON.parse(formData.imagesJson || '[]');
        specifications = JSON.parse(formData.specificationsJson || '{}');
        attributes = JSON.parse(formData.attributesJson || '{}');
      } catch {
        alert('Please enter valid JSON for Images / Specifications / Attributes');
        setSaving(false);
        return;
      }

      await productService.updateProduct(id, {
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description,
        short_description: formData.short_description,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
        stock_quantity: Number(formData.stock_quantity),
        min_stock_level: formData.min_stock_level ? Number(formData.min_stock_level) : undefined,
        status: formData.status,
        approval_status: formData.approval_status,
        is_featured: formData.is_featured,
        is_digital: formData.is_digital,
        warranty_period: formData.warranty_period ? Number(formData.warranty_period) : undefined,
        warranty_type: formData.warranty_type || undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        tags: formData.tagsText ? formData.tagsText.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        specifications,
        attributes,
      });
      alert('Product updated successfully');
      router.push('/vendor/products');
    } catch (error) {
      alert(error?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const flattenJson = (value, parentKey = '') => {
    if (value === null || value === undefined) {
      return [{ key: parentKey || '-', value: String(value) }];
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return [{ key: parentKey || '-', value: '[]' }];
      }
      return value.flatMap((item, index) => flattenJson(item, `${parentKey}[${index}]`));
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return [{ key: parentKey || '-', value: '{}' }];
      }
      return keys.flatMap((k) => flattenJson(value[k], parentKey ? `${parentKey}.${k}` : k));
    }

    return [{ key: parentKey || '-', value: String(value) }];
  };

  const flattenedProductRows = rawProduct ? flattenJson(rawProduct) : [];

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} userType="vendor" onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} userType="vendor" user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" placeholder="Title" />
                <input name="slug" value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Slug" />
              </div>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="w-full px-3 py-2 border rounded-lg" placeholder="Description" />
              <textarea name="short_description" value={formData.short_description} onChange={handleChange} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Short Description" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input name="price" type="number" min="0" value={formData.price} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" placeholder="Price" />
                <input name="discount_price" type="number" min="0" value={formData.discount_price} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Discount Price" />
                <input name="cost_price" type="number" min="0" value={formData.cost_price} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Cost Price" />
                <input name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" placeholder="Stock" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input name="min_stock_level" type="number" min="0" value={formData.min_stock_level} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Min Stock" />
                <input name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="SKU" />
                <input name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Barcode" />
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="out_of_stock">out_of_stock</option>
                  <option value="discontinued">discontinued</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="approval_status" value={formData.approval_status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                <input name="warranty_type" value={formData.warranty_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Warranty Type" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="warranty_period" type="number" min="0" value={formData.warranty_period} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Warranty Period" />
                <input name="tagsText" value={formData.tagsText} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Tags (comma separated)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="meta_title" value={formData.meta_title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Meta Title" />
                <input name="meta_description" value={formData.meta_description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Meta Description" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_digital" checked={formData.is_digital} onChange={handleChange} /> Digital</label>
              </div>

              <textarea name="imagesJson" value={formData.imagesJson} onChange={handleChange} rows={5} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" placeholder="Images JSON" />
              <textarea name="specificationsJson" value={formData.specificationsJson} onChange={handleChange} rows={6} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" placeholder="Specifications JSON" />
              <textarea name="attributesJson" value={formData.attributesJson} onChange={handleChange} rows={6} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" placeholder="Attributes JSON" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => router.push('/vendor/products')} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {rawProduct && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Full Product JSON (Tabular)</h2>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-[28rem]">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Field</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flattenedProductRows.map((row) => (
                          <tr key={`${row.key}-${row.value}`} className="border-b align-top">
                            <td className="px-3 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{row.key}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 break-all">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

