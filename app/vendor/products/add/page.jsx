'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  Package,
  X,
  Plus,
  ArrowLeft,
  FileText,
  Layers,
  CircleDollarSign,
  Boxes,
  Image as ImageIcon,
  ListChecks,
  LayoutGrid,
  Search,
  Settings2,
  Shield,
  Store,
} from 'lucide-react';

function ProductSection({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 sm:p-8">
      <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
          aria-hidden
        >
          {Icon ? <Icon className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
import ImageUpload from '../../../../components/ImageUpload';
import productService from '../../../../lib/services/productService';
import vendorService from '../../../../lib/services/vendorService';
import storeService from '../../../../lib/services/storeService';
import attributeService from '../../../../lib/services/attributeService';
import { getCustomerFacingPriceParts, formatMoney } from '../../../../lib/utils/customerFacingPrice';

export default function AddProductPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const storefrontPreview = useMemo(() => {
    const pp = Number.parseFloat(String(formData.price));
    const dp =
      formData.discount_price !== undefined &&
      formData.discount_price !== null &&
      String(formData.discount_price).trim() !== ''
        ? Number.parseFloat(String(formData.discount_price))
        : null;
    if (!Number.isFinite(pp) || pp <= 0) return null;
    return getCustomerFacingPriceParts({
      price: pp,
      discount_price:
        dp != null && Number.isFinite(dp) && dp > 0 ? dp : undefined,
      price_includes_vat: Boolean(formData.vat_enabled),
      vat_percentage:
        Number.parseFloat(String(formData.vat_percentage || '5')) || 5,
    });
  }, [
    formData.price,
    formData.discount_price,
    formData.vat_enabled,
    formData.vat_percentage,
  ]);
  
  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [level2Categories, setLevel2Categories] = useState([]);
  const [level3Categories, setLevel3Categories] = useState([]);
  const [level4Categories, setLevel4Categories] = useState([]);
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState([]);
  const [groupedAttributes, setGroupedAttributes] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    short_description: '',
    
    // Categorization
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    related_categories: [], // Amazon-style related categories
    brand_id: '',
    store_id: '',
    
    // Pricing
    price: '',
    discount_price: '',
    cost_price: '',
    vat_enabled: true,
    vat_percentage: '5',
    
    // Inventory
    stock_quantity: '',
    min_stock_level: '',
    sku: '',
    barcode: '',
    
    // Product Images (array of objects)
    images: [],
    
    // Specifications (key-value pairs)
    specifications: {},
    
    // Attributes (key-value pairs)
    attributes: {},
    
    // SEO & Marketing
    meta_title: '',
    meta_description: '',
    tags: [],
    
    // Product Status
    status: 'draft', // Will be changed to 'active' when approved
    approval_status: 'pending', // Needs SuperAdmin approval
    is_featured: false,
    is_digital: false,
    
    // Product Special Categories
    is_best_seller: false,
    is_new_seller: false,
    is_offer: false,
    special_deals_for_qliq_plus: false,
    
    // Physical Properties (handled as nested attributes)
    weight: '',
    
    // Warranty & Support
    warranty_period: '',
    warranty_type: ''
  });

  // Image upload state
  const [imageUrls, setImageUrls] = useState(['']);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [attrValueType, setAttrValueType] = useState('text');
  const [nestedAttrKey, setNestedAttrKey] = useState('');
  const [nestedAttrValue, setNestedAttrValue] = useState('');
  
  // Store requirement state
  const [showStoreRequired, setShowStoreRequired] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
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
  const [storePreviewState, setStorePreviewState] = useState({ logoValid: null, bannerValid: null });

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
      fetchDropdownData();
    }
  }, [user, isLoading, router]);

  const fetchDropdownData = async () => {
    try {
      // Fetch categories (level 1)
      try {
        const categoriesRes = await productService.getCategories({ level: 1 });
        console.log('Categories response:', categoriesRes);
        const categoryData = Array.isArray(categoriesRes) ? categoriesRes : 
                            (categoriesRes?.data && Array.isArray(categoriesRes.data)) ? categoriesRes.data :
                            (categoriesRes?.categories && Array.isArray(categoriesRes.categories)) ? categoriesRes.categories : [];
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
      
      // Fetch brands
      try {
        const brandsRes = await productService.getBrands();
        console.log('Brands response:', brandsRes);
        const brandData = Array.isArray(brandsRes) ? brandsRes : 
                         (brandsRes?.data?.data?.brands && Array.isArray(brandsRes.data.data.brands)) ? brandsRes.data.data.brands :
                         (brandsRes?.data && brandsRes.data.brands && Array.isArray(brandsRes.data.brands)) ? brandsRes.data.brands :
                         (brandsRes?.data && Array.isArray(brandsRes.data)) ? brandsRes.data :
                         (brandsRes?.brands && Array.isArray(brandsRes.brands)) ? brandsRes.brands : [];
        
        console.log('Parsed brand data:', brandData);
        console.log('Number of brands found:', brandData.length);
        setBrands(brandData);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      }
      
      // Fetch vendor's stores
      try {
        // Validate user ID before making API call
        const ownerId = user.vendorId || user.id;
        if (!ownerId) {
          console.error('❌ No user ID available for store fetch');
          setStores([]);
          setShowStoreRequired(true);
          return;
        }
        
        // Force cache bypass to get fresh data
        const shouldClearCache = true;
        const storesRes = await storeService.getStoresByVendor(ownerId, shouldClearCache);
        console.log('=== STORE FETCH DEBUG ===');
        console.log('User ID for store fetch:', ownerId);
        console.log('User ID type:', typeof user.id);
        console.log('User ID length:', user.id?.length);
        console.log('Full user object:', user);
        console.log('Stores response:', storesRes);
        
        // Extract store data from various possible response structures
        let storeData = [];
        if (Array.isArray(storesRes)) {
          storeData = storesRes;
        } else if (storesRes?.data?.data?.stores && Array.isArray(storesRes.data.data.stores)) {
          // Handle nested data structure from backend
          storeData = storesRes.data.data.stores;
        } else if (storesRes?.data?.stores && Array.isArray(storesRes.data.stores)) {
          storeData = storesRes.data.stores;
        } else if (storesRes?.data && Array.isArray(storesRes.data)) {
          storeData = storesRes.data;
        } else if (storesRes?.stores && Array.isArray(storesRes.stores)) {
          storeData = storesRes.stores;
        }
        
        console.log('Extracted store data:', storeData);
        console.log('Number of stores found:', storeData.length);
        
        setStores(storeData);
        
        // Check if vendor has stores
        if (storeData.length === 0) {
          console.log('No stores found for vendor, showing store creation form');
          setShowStoreRequired(true);
        } else {
          console.log('Stores found:', storeData.length, 'hiding store creation form');
          setShowStoreRequired(false);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStores([]);
        setShowStoreRequired(true);
      }
      
      // Fetch attribute definitions
      try {
        const attributesRes = await attributeService.getAllAttributes({ status: 'active' });
        console.log('Attributes response:', attributesRes);
        const attributeData = Array.isArray(attributesRes) ? attributesRes : 
                            (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                            (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(attributeData);
      } catch (error) {
        console.error('Error fetching attributes:', error);
        setAttributeDefinitions([]);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // Store creation handler
  const handleCreateStore = async () => {
    setIsCreatingStore(true);
    try {
      const storeData = {
        ...storeFormData,
        ownerId: user.vendorId || user.id,
        isActive: true
      };
      
      console.log('Creating store with data:', storeData);
      console.log('User ID being used:', user.vendorId || user.id);
      
      const response = await storeService.createStore(storeData);
      console.log('Store created response:', response);
      console.log('Created store ownerId:', response.ownerId || response.data?.ownerId);
      
      // Refresh stores list
      await fetchDropdownData();
      setShowStoreRequired(false);
      setStoreFormData({
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
      
      alert('Store created successfully! You can now add products.');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Error creating store: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleStoreInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setStoreFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setStoreFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const parseAttributeResponse = (response) => {
    const rawAttributes = Array.isArray(response)
      ? response
      : (response?.data && Array.isArray(response.data))
        ? response.data
        : (response?.attributes && Array.isArray(response.attributes))
          ? response.attributes
          : [];

    return rawAttributes.filter((attr) => attr?.status !== 'inactive');
  };

  const loadAttributesForCategory = async (categoryId, groupName) => {
    if (!categoryId) {
      setAttributeDefinitions([]);
      setGroupedAttributes({});
      return [];
    }

    const attributesRes = await attributeService.getAttributesByCategory(categoryId);
    const categoryAttributes = parseAttributeResponse(attributesRes);
    setAttributeDefinitions(categoryAttributes);
    setGroupedAttributes({ [groupName]: categoryAttributes });
    return categoryAttributes;
  };

  const handleLevel1Change = async (e) => {
    const level1Id = e.target.value;
    setFormData(prev => ({ ...prev, level1: level1Id, level2: '', level3: '', level4: '', related_categories: [] }));
    
    if (level1Id) {
      try {
        const res = await productService.getCategories({ level: 2, parentId: level1Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel2Categories(categoryData);
        
        // Fetch related categories (Amazon-style)
        try {
          const relatedRes = await productService.getRelatedCategories(level1Id);
          const relatedData = relatedRes?.data?.related || [];
          setRelatedCategories(relatedData);
        } catch (error) {
          console.error('Error fetching related categories:', error);
          setRelatedCategories([]);
        }
        
        // Fetch only category-mapped attributes
        try {
          await loadAttributesForCategory(level1Id, 'Primary Category');
        } catch (error) {
          console.error('Error fetching category attributes:', error);
          setAttributeDefinitions([]);
          setGroupedAttributes({});
        }
      } catch (error) {
        console.error('Error fetching level 2 categories:', error);
        setLevel2Categories([]);
      }
    } else {
      setLevel2Categories([]);
      setLevel3Categories([]);
      setLevel4Categories([]);
      setRelatedCategories([]);
      setAttributeDefinitions([]);
      setGroupedAttributes({});
    }
  };

  const handleLevel2Change = async (e) => {
    const level2Id = e.target.value;
    setFormData(prev => ({ ...prev, level2: level2Id, level3: '', level4: '' }));
    
    if (level2Id) {
      try {
        const res = await productService.getCategories({ level: 3, parentId: level2Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel3Categories(categoryData);
        
        // Fetch attributes for Level 2 category
        try {
          await loadAttributesForCategory(level2Id, 'Level 2 Category');
        } catch (error) {
          console.error('Error fetching level 2 category attributes:', error);
        }
      } catch (error) {
        console.error('Error fetching level 3 categories:', error);
        setLevel3Categories([]);
      }
    } else {
      setLevel3Categories([]);
      setLevel4Categories([]);
      // Reset to Level 1 attributes
      try {
        await loadAttributesForCategory(formData.level1, 'Primary Category');
      } catch (error) {
        console.error('Error fetching level 1 attributes:', error);
      }
    }
  };

  const handleLevel3Change = async (e) => {
    const level3Id = e.target.value;
    setFormData(prev => ({ ...prev, level3: level3Id, level4: '' }));
    
    if (level3Id) {
      try {
        const res = await productService.getCategories({ level: 4, parentId: level3Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel4Categories(categoryData);
        
        // Fetch attributes for Level 3 category
        try {
          await loadAttributesForCategory(level3Id, 'Level 3 Category');
        } catch (error) {
          console.error('Error fetching level 3 category attributes:', error);
        }
      } catch (error) {
        console.error('Error fetching level 4 categories:', error);
        setLevel4Categories([]);
      }
    } else {
      setLevel4Categories([]);
      // Reset to Level 2 attributes
      try {
        await loadAttributesForCategory(formData.level2, 'Level 2 Category');
      } catch (error) {
        console.error('Error fetching level 2 attributes:', error);
      }
    }
  };

  const handleLevel4Change = async (e) => {
    const level4Id = e.target.value;
    setFormData(prev => ({ ...prev, level4: level4Id }));
    
    if (level4Id) {
      // Fetch attributes for Level 4 category
      try {
        await loadAttributesForCategory(level4Id, 'Level 4 Category');
      } catch (error) {
        console.error('Error fetching level 4 category attributes:', error);
      }
    } else {
      // Reset to Level 3 attributes
      try {
        await loadAttributesForCategory(formData.level3, 'Level 3 Category');
      } catch (error) {
        console.error('Error fetching level 3 attributes:', error);
      }
    }
  };

  // Handle related category selection (Amazon-style)
  const handleRelatedCategoryChange = async (selectedCategoryIds) => {
    setFormData(prev => ({ ...prev, related_categories: selectedCategoryIds }));
    
    if (selectedCategoryIds.length > 0 && formData.level1) {
      try {
        // Get attributes from primary category + related categories
        const allCategoryIds = [formData.level1, ...selectedCategoryIds];
        const attributesRes = await attributeService.getAttributesByMultipleCategories(allCategoryIds);
        
        const attributes = parseAttributeResponse(attributesRes);
        const grouped = attributesRes?.grouped || {};
        
        setAttributeDefinitions(attributes);
        setGroupedAttributes(grouped);
      } catch (error) {
        console.error('Error fetching multi-category attributes:', error);
      }
    } else {
      const fallbackCategoryId = formData.level4 || formData.level3 || formData.level2 || formData.level1;
      const fallbackGroupName = formData.level4
        ? 'Level 4 Category'
        : formData.level3
          ? 'Level 3 Category'
          : formData.level2
            ? 'Level 2 Category'
            : 'Primary Category';
      try {
        await loadAttributesForCategory(fallbackCategoryId, fallbackGroupName);
      } catch (error) {
        console.error('Error restoring category attributes:', error);
      }
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    
    // Update form data
    const images = newUrls
      .filter(url => url.trim() !== '')
      .map((url, idx) => ({
        url: url,
        is_primary: idx === 0,
        alt_text: formData.title || 'Product image'
      }));
    setFormData(prev => ({ ...prev, images }));
  };

  const addImageUrl = () => {
    const currentTotal = uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length;
    if (currentTotal >= 5) {
      alert('Maximum 5 images allowed. Please remove some images before adding new ones.');
      return;
    }
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    
    const images = newUrls
      .filter(url => url.trim() !== '')
      .map((url, idx) => ({
        url: url,
        is_primary: idx === 0,
        alt_text: formData.title || 'Product image'
      }));
    setFormData(prev => ({ ...prev, images }));
  };


  // Helper functions for attribute handling
  const handleAttributeChange = (attributeName, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeName]: value
      }
    }));
  };

  const handleSpecificationChange = (attributeName, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [attributeName]: value
      }
    }));
  };

  const renderAttributeInput = (attribute) => {
    const currentValue = formData.attributes[attribute.name] || '';
    
    switch (attribute.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            maxLength={attribute.maxLength}
            minLength={attribute.minLength}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            min={attribute.minValue}
            max={attribute.maxValue}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.displayName}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    const newArray = e.target.checked
                      ? [...currentArray, option.value]
                      : currentArray.filter(v => v !== option.value);
                    handleAttributeChange(attribute.name, newArray);
                  }}
                  className="mr-2"
                />
                <span>{option.displayName}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
          />
        );
    }
  };

  const renderSpecificationInput = (attribute) => {
    const currentValue = formData.specifications[attribute.name] || '';
    
    switch (attribute.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            maxLength={attribute.maxLength}
            minLength={attribute.minLength}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            min={attribute.minValue}
            max={attribute.maxValue}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.displayName}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    const newArray = e.target.checked
                      ? [...currentArray, option.value]
                      : currentArray.filter(v => v !== option.value);
                    handleSpecificationChange(attribute.name, newArray);
                  }}
                  className="mr-2"
                />
                <span>{option.displayName}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
          />
        );
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const addAttribute = () => {
    if (attrKey.trim()) {
      const key = attrKey.trim();
      
      if (attrValueType === 'text') {
        if (attrValue.trim()) {
          setFormData(prev => ({
            ...prev,
            attributes: {
              ...prev.attributes,
              [key]: attrValue.trim()
            }
          }));
          setAttrKey('');
          setAttrValue('');
        }
      } else {
        // For nested objects, create empty object
        setFormData(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [key]: {}
          }
        }));
        setAttrKey('');
        setAttrValue('');
      }
    }
  };

  const addNestedAttribute = (parentKey) => {
    if (nestedAttrKey.trim() && nestedAttrValue.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [parentKey]: {
            ...prev.attributes[parentKey],
            [nestedAttrKey.trim()]: nestedAttrValue.trim()
          }
        }
      }));
      setNestedAttrKey('');
      setNestedAttrValue('');
    }
  };

  const removeNestedAttribute = (parentKey, subKey) => {
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      if (newAttrs[parentKey] && typeof newAttrs[parentKey] === 'object') {
        const newNestedObj = { ...newAttrs[parentKey] };
        delete newNestedObj[subKey];
        newAttrs[parentKey] = newNestedObj;
      }
      return { ...prev, attributes: newAttrs };
    });
  };

  const removeAttribute = (key) => {
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return { ...prev, attributes: newAttrs };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (!formData.description.trim()) newErrors.description = 'Product description is required';
    if (!formData.level1) newErrors.level1 = 'Category Level 1 is required';
    if (!formData.brand_id) newErrors.brand_id = 'Brand is required';
    if (!formData.store_id) newErrors.store_id = 'Store is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || formData.stock_quantity < 0) newErrors.stock_quantity = 'Valid stock quantity is required';

    const requiredAttributes = attributeDefinitions.filter((attr) => attr.required);
    const missingRequiredAttributes = requiredAttributes
      .filter((attr) => {
        const attributeValue = formData.attributes[attr.name];
        const specificationValue = formData.specifications[attr.name];
        const value = attributeValue ?? specificationValue;

        if (Array.isArray(value)) return value.length === 0;
        return value === undefined || value === null || value === '';
      })
      .map((attr) => attr.displayName);

    if (missingRequiredAttributes.length > 0) {
      newErrors.attributes = `Required attributes missing: ${missingRequiredAttributes.join(', ')}`;
    }

    const totalImages = uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length;
    if (totalImages === 0) newErrors.images = 'At least one product image is required';
    else if (totalImages > 5) newErrors.images = 'Maximum 5 images allowed';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if vendor has stores first
    if (stores.length === 0) {
      alert('You must create a store before adding products. Please create a store first.');
      return;
    }
    
    // Check if store is selected
    if (!formData.store_id) {
      alert('Please select a store for this product');
      return;
    }
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for submission
      const allImages = [
        ...uploadedImages,
        ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
          url: url,
          is_primary: uploadedImages.length === 0 && idx === 0,
          alt_text: formData.title || 'Product image',
          uploaded: false
        }))
      ];
      
      const submitData = {
        ...formData,
        images: allImages,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        vat_percentage: 5,
        price_includes_vat: Boolean(formData.vat_enabled),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : undefined,
        warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : undefined
      };
      if (!String(formData.barcode ?? '').trim()) {
        delete submitData.barcode;
      }
      
      await productService.createProduct(submitData);
      alert('Product created successfully!');
      router.push('/vendor/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

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
        user={user}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-indigo-50/40">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {/* Header */}
            <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md sm:p-8">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/vendor/products')}
                    className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    aria-label="Back to products"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Add product</h1>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-200/80">
                        Draft until approved
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                      Walk through each section—required fields are marked. Images upload to your catalog storage; you
                      can also paste image URLs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Requirement Section */}
            {showStoreRequired && (
              <div className="mb-8 rounded-2xl border border-red-200/90 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-red-900">Create a store first</h3>
                    <p className="mt-2 text-sm leading-relaxed text-red-800/90">
                      Products are attached to a store. Add your store details below, then you can continue with this
                      product.
                    </p>

                    {/* Store Creation Form */}
                    <div className="mt-5 rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 text-base font-semibold text-slate-900">Store details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={storeFormData.name}
                            onChange={handleStoreInputChange}
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
                            value={storeFormData.description}
                            onChange={handleStoreInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe your store"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Logo (Icon)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="url"
                              name="logo"
                              value={storeFormData.logo}
                              onChange={handleStoreInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com/logo.png"
                            />
                            {storeFormData.logo && (
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={storeFormData.logo} 
                                  alt="Store Logo Preview" 
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                  onLoad={() => setStorePreviewState(prev => ({ ...prev, logoValid: true }))}
                                  onError={() => setStorePreviewState(prev => ({ ...prev, logoValid: false }))}
                                />
                                {storePreviewState.logoValid === true && <span className="text-xs text-green-600">Preview loaded</span>}
                                {storePreviewState.logoValid === false && <span className="text-xs text-red-600">Invalid image URL</span>}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Enter image URL for your store logo</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Banner (Cover)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="url"
                              name="banner"
                              value={storeFormData.banner}
                              onChange={handleStoreInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com/banner.png"
                            />
                            {storeFormData.banner && (
                              <div className="space-y-1">
                                <img 
                                  src={storeFormData.banner} 
                                  alt="Store Banner Preview" 
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                  onLoad={() => setStorePreviewState(prev => ({ ...prev, bannerValid: true }))}
                                  onError={() => setStorePreviewState(prev => ({ ...prev, bannerValid: false }))}
                                />
                                {storePreviewState.bannerValid === true && <span className="text-xs text-green-600">Preview loaded</span>}
                                {storePreviewState.bannerValid === false && <span className="text-xs text-red-600">Invalid image URL</span>}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Enter image URL for your store banner</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={storeFormData.email}
                            onChange={handleStoreInputChange}
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
                            value={storeFormData.phone}
                            onChange={handleStoreInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1234567890"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Store Address</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <input
                                type="text"
                                name="address.street"
                                value={storeFormData.address.street}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Street Address"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.city"
                                value={storeFormData.address.city}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.state"
                                value={storeFormData.address.state}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="State/Province"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.country"
                                value={storeFormData.address.country}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleCreateStore}
                          disabled={isCreatingStore || !storeFormData.name}
                          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCreatingStore ? 'Creating store…' : 'Create store'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" style={{ display: showStoreRequired ? 'none' : 'block' }}>
              <ProductSection
                icon={FileText}
                title="Basic information"
                description="Clear titles and descriptions help customers find your product and reduce support questions."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Product title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.title ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="e.g. Wireless earbuds — black"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.description ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="Materials, sizing, what’s included, care instructions…"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Short description <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="One or two lines for listings and cards"
                    />
                  </div>
                </div>
              </ProductSection>

              <ProductSection
                icon={Layers}
                title="Category & brand"
                description="Pick where the product lives in the catalog, then choose brand and which store sells it."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category level 1 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="level1"
                      value={formData.level1}
                      onChange={handleLevel1Change}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.level1 ? 'border-red-400' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.level1 && <p className="mt-1 text-sm text-red-600">{errors.level1}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Category level 2</label>
                    <select
                      name="level2"
                      value={formData.level2}
                      onChange={handleLevel2Change}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={!formData.level1}
                    >
                      <option value="">Select Sub-Category</option>
                      {level2Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Category level 3</label>
                    <select
                      name="level3"
                      value={formData.level3}
                      onChange={handleLevel3Change}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={!formData.level2}
                    >
                      <option value="">Select Sub-Category</option>
                      {level3Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Category level 4</label>
                    <select
                      name="level4"
                      value={formData.level4}
                      onChange={handleLevel4Change}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={!formData.level3}
                    >
                      <option value="">Select Sub-Category</option>
                      {level4Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.brand_id ? 'border-red-400' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                      ))}
                    </select>
                    {errors.brand_id && <p className="mt-1 text-sm text-red-600">{errors.brand_id}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Store <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="store_id"
                      value={formData.store_id}
                      onChange={handleInputChange}
                      disabled={stores.length === 0}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.store_id ? 'border-red-400' : 'border-slate-200'
                      } ${stores.length === 0 ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                    >
                      <option value="">{stores.length === 0 ? 'No stores available - Please create a store first' : 'Select Store'}</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                    {errors.store_id && <p className="mt-1 text-sm text-red-600">{errors.store_id}</p>}
                    {stores.length === 0 && (
                      <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
                        <span aria-hidden>⚠️</span>
                        <span>Create a store first (see banner above) so you can attach this product to a storefront.</span>
                      </p>
                    )}
                  </div>

                  {/* Related Categories (Amazon-style) */}
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Related categories <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <p className="mb-2 text-xs text-slate-500">
                      Extra categories unlock cross-category attributes when your catalog is configured for them.
                    </p>
                    <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-3">
                      {relatedCategories.map(category => (
                        <label key={category._id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={formData.related_categories.includes(category._id)}
                            onChange={(e) => {
                              const newRelatedCategories = e.target.checked
                                ? [...formData.related_categories, category._id]
                                : formData.related_categories.filter(id => id !== category._id);
                              handleRelatedCategoryChange(newRelatedCategories);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{category.name}</span>
                        </label>
                      ))}
                    </div>
                    {relatedCategories.length === 0 && formData.level1 && (
                      <p className="mt-1 text-sm text-slate-500">No related categories found for this primary category.</p>
                    )}
                  </div>
                </div>
              </ProductSection>

              <ProductSection
                icon={CircleDollarSign}
                title="Pricing"
                description="The ecommerce app shows VAT-inclusive totals. VAT mode decides whether your number is Before VAT or Already includes VAT—see preview below."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {formData.vat_enabled
                        ? <>Price incl. VAT (AED){' '}<span className="text-red-500">*</span></>
                        : <>Price before VAT (AED){' '}<span className="text-red-500">*</span></>}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.price ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Discount price <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      name="discount_price"
                      value={formData.discount_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Leave empty if none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Sale pricing can also be set in Sales Gigs and Ecom promotions.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Cost price <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Your cost (internal)"
                    />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">VAT mode</label>
                    <select
                      name="vat_enabled"
                      value={String(formData.vat_enabled)}
                      onChange={(e) => setFormData(prev => ({ ...prev, vat_enabled: e.target.value === 'true' }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="true">Entered price includes 5% VAT (what shoppers pay)</option>
                      <option value="false">Entered price excludes VAT (we add 5% for storefront)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">VAT percentage</label>
                    <input
                      type="number"
                      name="vat_percentage"
                      value={formData.vat_percentage}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      disabled={!formData.vat_enabled}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100"
                    />
                  </div>
                </div>
                {storefrontPreview ? (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm">
                    <p className="font-medium text-slate-800">
                      Shoppers pay{' '}
                      <span className="text-emerald-800">{formatMoney(storefrontPreview.display, 'AED ')}</span>
                      <span className="font-normal text-slate-600"> including VAT</span>
                    </p>
                    {storefrontPreview.compareAt != null ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Listed compare-at{' '}
                        <span className="line-through">{formatMoney(storefrontPreview.compareAt, 'AED ')}</span>
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {formData.vat_enabled
                        ? `Your input is VAT-inclusive (${storefrontPreview.vatPct}% already in the figure). The main price in the ecommerce app matches this inclusive total when no discount applies.`
                        : `Your input excludes VAT · the storefront adds ${storefrontPreview.vatPct}% VAT (same rounding rules as catalog). Eg. ${formatMoney(Number(formData.price) || 0, 'AED ')} entered here shows as ${formatMoney(storefrontPreview.display, 'AED ')} to shoppers.`}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">
                    Enter a valid price to preview the VAT-inclusive total customers see online.
                  </p>
                )}
              </ProductSection>

              <ProductSection
                icon={Boxes}
                title="Inventory & identifiers"
                description="Stock and SKU help you and the platform track fulfillment. Leave SKU blank to auto-generate on save if your catalog supports it."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Stock quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        errors.stock_quantity ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="0"
                    />
                    {errors.stock_quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Minimum stock level <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      name="min_stock_level"
                      value={formData.min_stock_level}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Reorder alert threshold"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      SKU <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="SKU-123"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Barcode <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="GTIN / EAN"
                    />
                  </div>
                </div>
              </ProductSection>

              <ProductSection
                icon={ImageIcon}
                title="Photos"
                description="Upload up to five images. The first image (or the one you mark primary) is used in listings. You can mix uploads and image URLs."
              >
                <ImageUpload
                  onImagesChange={(images) => {
                    setUploadedImages(images);
                    setFormData(prev => ({
                      ...prev,
                      images: [
                        ...images,
                        ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
                          url: url,
                          is_primary: images.length === 0 && idx === 0,
                          alt_text: formData.title || 'Product image',
                          uploaded: false
                        }))
                      ]
                    }));
                  }}
                  maxImages={5}
                  folder="products"
                  existingImages={uploadedImages}
                  label="Product Images"
                  required={true}
                />

                <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Or paste image URLs</h3>
                  <div className="space-y-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="https://example.com/image.jpg"
                        />
                        {index === 0 && uploadedImages.length === 0 && (
                          <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            Primary
                          </span>
                        )}
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            aria-label="Remove URL"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add another URL
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                  <span>
                    Total images:{' '}
                    <strong className="text-slate-900">
                      {uploadedImages.length + imageUrls.filter((u) => u.trim() !== '').length}
                    </strong>{' '}
                    / 5
                  </span>
                </div>

                {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
              </ProductSection>

              <ProductSection
                icon={ListChecks}
                title="Specifications"
                description="Fields configured for this category. Required items must be completed before you can publish."
              >
                {attributeDefinitions.length > 0 ? (
                  <div className="space-y-4">
                    {attributeDefinitions
                      .filter(attr => attr.showInDetail)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((attribute) => (
                        <div key={attribute._id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {attribute.displayName}
                            {attribute.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {attribute.description && (
                            <p className="text-xs text-gray-500">{attribute.description}</p>
                          )}
                          {renderSpecificationInput(attribute)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                    No category specifications are configured yet. Ask a super admin to map attributes for this
                    category.
                  </div>
                )}
              </ProductSection>

              <ProductSection
                icon={LayoutGrid}
                title="Attributes"
                description="Cross-category attributes appear when your category has them. They power filters and search on the storefront."
              >
                {Object.keys(groupedAttributes).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedAttributes).map(([groupName, attributes]) => (
                      <div
                        key={groupName}
                        className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 sm:p-5"
                      >
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                          <Package className="h-4 w-4 shrink-0" />
                          {groupName}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                          {attributes
                            .filter(attr => attr.filterable || attr.searchable || attr.showInDetail || attr.required)
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((attribute) => (
                              <div key={attribute._id} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {attribute.displayName}
                                  {attribute.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {attribute.description && (
                                  <p className="text-xs text-gray-500">{attribute.description}</p>
                                )}
                                {renderAttributeInput(attribute)}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : attributeDefinitions.length > 0 ? (
                  <div className="space-y-4">
                    {attributeDefinitions
                      .filter(attr => attr.filterable || attr.searchable || attr.showInDetail || attr.required)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((attribute) => (
                        <div key={attribute._id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {attribute.displayName}
                            {attribute.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {attribute.description && (
                            <p className="text-xs text-gray-500">{attribute.description}</p>
                          )}
                          {renderAttributeInput(attribute)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p className="mb-2">No mapped attributes for this category.</p>
                    <p>
                      A super admin can create and assign attributes so you can fill structured fields here.
                    </p>
                  </div>
                )}
                {errors.attributes && <p className="mt-4 text-sm text-red-600">{errors.attributes}</p>}
              </ProductSection>

              <ProductSection
                icon={Search}
                title="SEO & discovery"
                description="Optional fields help search engines and internal search. Tags make your product easier to browse."
              >
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Meta title</label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Shown in browser tab & search snippets"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Meta description</label>
                    <textarea
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Short summary for search results"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Tags</label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 ring-1 ring-inset ring-indigo-100"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 rounded p-0.5 hover:bg-indigo-100"
                            aria-label={`Remove ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Type a tag and press Enter or Add"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        Add tag
                      </button>
                    </div>
                  </div>
                </div>
              </ProductSection>

              <ProductSection
                icon={Settings2}
                title="Visibility & badges"
                description="Control catalog status and optional merchandising flags. Most new products stay in draft until approved."
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Featured product</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="is_best_seller"
                        checked={formData.is_best_seller}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Best seller</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="is_new_seller"
                        checked={formData.is_new_seller}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">New arrival</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="is_offer"
                        checked={formData.is_offer}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">On offer</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="special_deals_for_qliq_plus"
                        checked={formData.special_deals_for_qliq_plus}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Qliq Plus deal</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="is_digital"
                        checked={formData.is_digital}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Digital product</span>
                    </label>
                  </div>
                </div>
              </ProductSection>

              <ProductSection
                icon={Shield}
                title="Warranty & support"
                description="Optional warranty fields show on the product page where your storefront supports them."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Warranty period (months)
                    </label>
                    <input
                      type="number"
                      name="warranty_period"
                      value={formData.warranty_period}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 12"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Warranty type</label>
                    <input
                      type="text"
                      name="warranty_type"
                      value={formData.warranty_type}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. Manufacturer warranty"
                    />
                  </div>
                </div>
              </ProductSection>

              <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg shadow-slate-300/30 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:p-5">
                <p className="mr-auto hidden text-xs text-slate-500 sm:block">
                  You can keep working; scroll up to edit any section before submitting.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/vendor/products')}
                  className="order-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || stores.length === 0 || !formData.store_id}
                  className="order-1 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
                  title={
                    stores.length === 0
                      ? 'You must create a store before adding products'
                      : !formData.store_id
                        ? 'Please select a store'
                        : ''
                  }
                >
                  {loading ? 'Creating…' : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

