'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  X,
  ArrowLeft,
  Package,
  Eye,
  RefreshCw
} from 'lucide-react';
import productService from '../../../../lib/services/productService';

export default function BulkUploadPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Validate, 3: Results

  // Sample CSV structure for download
  const sampleCsvData = [
    ['title', 'description', 'price', 'category', 'stock_quantity', 'sku', 'brand', 'tags', 'images'],
    ['Sample Product 1', 'This is a sample product description', '99.99', 'Electronics', '50', 'SKU001', 'SampleBrand', 'tag1,tag2,tag3', 'https://example.com/image1.jpg,https://example.com/image2.jpg'],
    ['Sample Product 2', 'Another sample product', '149.99', 'Clothing', '25', 'SKU002', 'AnotherBrand', 'fashion,style', 'https://example.com/image3.jpg']
  ];

  const downloadSampleCsv = () => {
    const csvContent = sampleCsvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
    } else {
      alert('Please upload a CSV file only.');
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    } else {
      alert('Please upload a CSV file only.');
    }
  };

  const validateCsvData = async (csvData) => {
    const errors = [];
    const warnings = [];
    const validRows = [];
    
    // Required fields
    const requiredFields = ['title', 'price', 'category', 'stock_quantity'];
    
    csvData.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      
      const rowErrors = [];
      const product = {};
      
      // Map CSV columns to product fields
      csvData[0].forEach((header, colIndex) => {
        product[header.toLowerCase().trim()] = row[colIndex] ? row[colIndex].trim() : '';
      });
      
      // Validate required fields
      requiredFields.forEach(field => {
        if (!product[field]) {
          rowErrors.push(`Missing ${field}`);
        }
      });
      
      // Validate price
      if (product.price && (isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0)) {
        rowErrors.push('Invalid price format');
      }
      
      // Validate stock quantity
      if (product.stock_quantity && (isNaN(parseInt(product.stock_quantity)) || parseInt(product.stock_quantity) < 0)) {
        rowErrors.push('Invalid stock quantity');
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
      } else {
        validRows.push({ ...product, rowNumber: index + 1 });
      }
    });
    
    return {
      totalRows: csvData.length - 1, // Excluding header
      validRows: validRows.length,
      errors,
      warnings,
      data: validRows
    };
  };

  const processCsvFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = text.split('\n').map(row => 
            row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
          ).filter(row => row.some(cell => cell.length > 0));
          
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleValidateFile = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const csvData = await processCsvFile(file);
      const validation = await validateCsvData(csvData);
      
      setValidationResults(validation);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error validating file:', error);
      alert('Error reading CSV file. Please check the file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!validationResults || validationResults.validRows === 0) return;
    
    setUploading(true);
    try {
      // Add vendor ID to each product
      const productsToUpload = validationResults.data.map(product => ({
        ...product,
        vendor_id: user.vendorId || user.id,
        approval_status: 'pending',
        status: 'active'
      }));

      console.log('Uploading products:', productsToUpload);
      
      // Call bulk upload API
      const response = await productService.bulkUploadProducts(productsToUpload);
      
      setUploadResults(response);
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Error uploading products:', error);
      alert('Error uploading products: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setValidationResults(null);
    setUploadResults(null);
    setCurrentStep(1);
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
        user={user}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.push('/vendor/products')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Products</span>
              </button>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
            <p className="text-gray-600 mt-1">Upload multiple products at once using CSV files</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Upload File</span>
              </div>
              
              <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
                <div className={`h-1 bg-blue-600 rounded transition-all duration-300 ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Validate</span>
              </div>
              
              <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
                <div className={`h-1 bg-blue-600 rounded transition-all duration-300 ${currentStep >= 3 ? 'w-full' : 'w-0'}`}></div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
                <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Results</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Step 1: Upload File */}
            {currentStep === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Upload Your CSV File</h2>
                  <p className="text-gray-600">Upload a CSV file containing your product data. Make sure to follow the required format.</p>
                </div>

                {/* Download Template */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Need a template?</h3>
                      <p className="text-sm text-blue-700">Download our sample CSV file to get started</p>
                    </div>
                    <button
                      onClick={downloadSampleCsv}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>

                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : file 
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-green-900">{file.name}</p>
                        <p className="text-xs text-green-700">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your CSV file here</h3>
                      <p className="text-gray-500 mb-4">or click to browse</p>
                      <p className="text-xs text-gray-400">Supports: CSV files up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* Required Format Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Required CSV Format:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Required columns:</strong> title, price, category, stock_quantity</p>
                    <p><strong>Optional columns:</strong> description, sku, brand, tags, images</p>
                    <p><strong>Note:</strong> First row should contain column headers</p>
                  </div>
                </div>

                {/* Next Button */}
                {file && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleValidateFile}
                      disabled={uploading}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Validate File</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Validation Results */}
            {currentStep === 2 && validationResults && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Validation Results</h2>
                  <p className="text-gray-600">Review the validation results before proceeding with the upload.</p>
                </div>

                {/* Validation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Total Rows</p>
                        <p className="text-2xl font-bold text-blue-700">{validationResults.totalRows}</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Valid Products</p>
                        <p className="text-2xl font-bold text-green-700">{validationResults.validRows}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-900">Errors</p>
                        <p className="text-2xl font-bold text-red-700">{validationResults.errors.length}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {validationResults.errors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="text-sm font-medium text-red-900 mb-3">Validation Errors:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {validationResults.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-800">
                          <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={resetUpload}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Start Over</span>
                  </button>
                  
                  {validationResults.validRows > 0 && (
                    <button
                      onClick={handleBulkUpload}
                      disabled={uploading}
                      className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload {validationResults.validRows} Products</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Upload Results */}
            {currentStep === 3 && uploadResults && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Upload Complete</h2>
                  <p className="text-gray-600">Your products have been uploaded successfully!</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-medium text-green-900">Upload Successful!</h3>
                      <p className="text-sm text-green-700">
                        {uploadResults.success ? 
                          `${uploadResults.created || uploadResults.count || validationResults?.validRows || 0} products have been uploaded and are now pending approval.` :
                          'Upload completed with some issues.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={resetUpload}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload More Products</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/vendor/products')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <Package className="w-4 h-4" />
                    <span>View My Products</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}