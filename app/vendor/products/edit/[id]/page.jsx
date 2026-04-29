'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import productService from '../../../../../lib/services/productService';
import ImageUpload from '../../../../../components/ImageUpload';

function normalizeProductImagesJson(images) {
  if (!Array.isArray(images)) return '[]';
  const out = [];
  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    if (typeof img === 'string' && img.trim()) {
      out.push({ url: img.trim(), is_primary: out.length === 0, alt_text: 'Product image' });
    } else if (img && typeof img === 'object' && img.url) {
      out.push({
        url: img.url,
        is_primary: Boolean(img.is_primary),
        alt_text: img.alt_text || 'Product image',
      });
    }
  }
  if (out.length && !out.some((x) => x.is_primary)) {
    out[0].is_primary = true;
  }
  return JSON.stringify(out, null, 2);
}

export default function EditProductPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [rawProduct, setRawProduct] = useState(null);
  const [errors, setErrors] = useState({});
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
    vat_enabled: true,
    vat_percentage: '5',
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
      console.log('Fetching product with ID:', id);
      
      const response = await productService.getProductById(id);
      console.log('Product fetch response:', response);
      
      const product = response?.data || response?.product || response;
      if (!product || !product._id) {
        console.error('Product not found or invalid response:', response);
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
        vat_enabled: Boolean(product.price_includes_vat),
        vat_percentage: String(product.vat_percentage ?? 5),
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
        imagesJson: normalizeProductImagesJson(product.images || []),
        specificationsJson: JSON.stringify(product.specifications || {}, null, 2),
        attributesJson: JSON.stringify(product.attributes || {}, null, 2),
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      const msg = error?.message || String(error);
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        alert('Product not found. It may have been deleted.');
      } else if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')) {
        alert('You are not authorized to edit this product.');
      } else {
        alert(`Failed to load product: ${msg}`);
      }

      router.push('/vendor/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const parseImagesJson = () => {
    try {
      const parsed = JSON.parse(formData.imagesJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const updateImagesJson = (images) => {
    setFormData((prev) => ({
      ...prev,
      imagesJson: JSON.stringify(images, null, 2),
    }));
  };

  const handleEditImageUpload = async (fileList) => {
    if (!fileList?.length) return;

    const existingImages = parseImagesJson();
    const availableSlots = Math.max(0, 5 - existingImages.length);
    if (availableSlots === 0) {
      alert('Maximum 5 images allowed.');
      return;
    }

    const candidateFiles = Array.from(fileList).slice(0, availableSlots);
    const validFiles = candidateFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB.`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    try {
      setIsUploadingImages(true);
      const uploadResult = await productService.uploadProductImages(validFiles);
      if (!uploadResult?.success || !uploadResult?.data?.length) {
        throw new Error(uploadResult?.message || 'Image upload failed');
      }

      const hasPrimary = existingImages.some((img) => img?.is_primary);
      const appended = uploadResult.data.map((item, index) => ({
        url: item.url,
        is_primary: !hasPrimary && index === 0,
        alt_text: formData.title || 'Product image',
      }));

      updateImagesJson([...existingImages, ...appended]);
    } catch (error) {
      alert(error?.message || 'Failed to upload images');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImageAt = (index) => {
    const current = parseImagesJson();
    const next = current.filter((_, i) => i !== index);
    const hadPrimary = current[index]?.is_primary;
    if (hadPrimary && next.length > 0 && !next.some((img) => img?.is_primary)) {
      next[0] = { ...next[0], is_primary: true };
    }
    updateImagesJson(next);
  };

  const setPrimaryImageAt = (index) => {
    const current = parseImagesJson();
    const next = current.map((img, i) => ({ ...img, is_primary: i === index }));
    updateImagesJson(next);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (!formData.description.trim()) newErrors.description = 'Product description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || formData.stock_quantity < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
    
    // Validate JSON fields
    try {
      JSON.parse(formData.imagesJson || '[]');
    } catch {
      newErrors.imagesJson = 'Invalid JSON format for images';
    }
    
    try {
      JSON.parse(formData.specificationsJson || '{}');
    } catch {
      newErrors.specificationsJson = 'Invalid JSON format for specifications';
    }
    
    try {
      JSON.parse(formData.attributesJson || '{}');
    } catch {
      newErrors.attributesJson = 'Invalid JSON format for attributes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting');
      return;
    }
    
    try {
      setSaving(true);
      let images = [];
      let specifications = {};
      let attributes = {};
      
      try {
        const rawImages = JSON.parse(formData.imagesJson || '[]');
        images = JSON.parse(normalizeProductImagesJson(rawImages));
        specifications = JSON.parse(formData.specificationsJson || '{}');
        attributes = JSON.parse(formData.attributesJson || '{}');
      } catch (error) {
        console.error('JSON parsing error:', error);
        alert('Invalid JSON format. Please check your data.');
        setSaving(false);
        return;
      }

      const updateData = {
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description,
        short_description: formData.short_description,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
        vat_percentage: 5,
        price_includes_vat: Boolean(formData.vat_enabled),
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
      };
      
      console.log('Updating product with data:', updateData);
      
      const response = await productService.updateProduct(id, updateData);
      console.log('Product update response:', response);
      
      alert('Product updated successfully');
      router.push('/vendor/products');
    } catch (error) {
      console.error('Edit product error:', error);
      const msg = error?.message || String(error);
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        alert('Product not found. It may have been deleted.');
      } else if (msg.includes('403') || msg.toLowerCase().includes('permission')) {
        alert('You are not allowed to update this product.');
      } else if (msg.includes('400') || msg.toLowerCase().includes('invalid')) {
        alert(`Invalid data: ${msg}`);
      } else {
        alert(`Failed to update product: ${msg}`);
      }
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
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} userType="vendor" onLogout={logout} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} userType="vendor" user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`} 
                    placeholder="Product title" 
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input name="slug" value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="product-slug" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4} 
                  required 
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`} 
                  placeholder="Product description" 
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea name="short_description" value={formData.short_description} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Brief product description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="price" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={formData.price} 
                    onChange={handleChange} 
                    required 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`} 
                    placeholder="0.00" 
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    name="discount_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty if none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sale pricing can also be managed via Sales Gigs / Ecom promos.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <input name="cost_price" type="number" min="0" step="0.01" value={formData.cost_price} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="stock_quantity" 
                    type="number" 
                    min="0" 
                    value={formData.stock_quantity} 
                    onChange={handleChange} 
                    required 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                    }`} 
                    placeholder="0" 
                  />
                  {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Mode</label>
                  <select
                    name="vat_enabled"
                    value={String(formData.vat_enabled)}
                    onChange={(e) => setFormData(prev => ({ ...prev, vat_enabled: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">With VAT (price already includes 5%)</option>
                    <option value="false">Without VAT (add 5% on display)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Percentage</label>
                  <input
                    name="vat_percentage"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.vat_percentage}
                    onChange={handleChange}
                    disabled={!formData.vat_enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
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

              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleEditImageUpload(e.target.files)}
                  disabled={isUploadingImages}
                  className="block w-full text-sm text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Direct frontend upload. URLs are saved in product `images` in DB.</p>
                {isUploadingImages && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}

                {parseImagesJson().length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                    {parseImagesJson().map((image, index) => (
                      <div key={`${image?.url}-${index}`} className="border rounded p-2 bg-white">
                        <div className="aspect-square overflow-hidden rounded bg-gray-100">
                          <img src={image?.url} alt={image?.alt_text || 'Product image'} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 flex gap-2">
                          {!image?.is_primary && (
                            <button type="button" onClick={() => setPrimaryImageAt(index)} className="text-xs px-2 py-1 border rounded">
                              Set Primary
                            </button>
                          )}
                          <button type="button" onClick={() => removeImageAt(index)} className="text-xs px-2 py-1 border rounded text-red-600">
                            Remove
                          </button>
                        </div>
                        {image?.is_primary && <p className="text-xs text-blue-600 mt-1">Primary</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (JSON)</label>
                <textarea 
                  name="imagesJson" 
                  value={formData.imagesJson} 
                  onChange={handleChange} 
                  rows={5} 
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.imagesJson ? 'border-red-500' : 'border-gray-300'
                  }`} 
                  placeholder='[{"url": "https://...", "is_primary": true, "alt_text": "..."}]' 
                />
                {errors.imagesJson && <p className="text-red-500 text-sm mt-1">{errors.imagesJson}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications (JSON)</label>
                <textarea 
                  name="specificationsJson" 
                  value={formData.specificationsJson} 
                  onChange={handleChange} 
                  rows={6} 
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.specificationsJson ? 'border-red-500' : 'border-gray-300'
                  }`} 
                  placeholder='{"color": "red", "size": "large"}' 
                />
                {errors.specificationsJson && <p className="text-red-500 text-sm mt-1">{errors.specificationsJson}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attributes (JSON)</label>
                <textarea 
                  name="attributesJson" 
                  value={formData.attributesJson} 
                  onChange={handleChange} 
                  rows={6} 
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.attributesJson ? 'border-red-500' : 'border-gray-300'
                  }`} 
                  placeholder='{"weight": "1kg", "material": "cotton"}' 
                />
                {errors.attributesJson && <p className="text-red-500 text-sm mt-1">{errors.attributesJson}</p>}
              </div>

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

