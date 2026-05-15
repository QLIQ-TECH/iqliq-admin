'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Package, Image as ImageIcon } from 'lucide-react';
import s3Service from '../lib/services/s3Service';

export default function ImageUpload({
  onImagesChange,
  maxImages = 5,
  folder = 'products',
  existingImages = [],
  className = '',
  label = 'Upload Images',
  required = false
}) {
  const [uploadedImages, setUploadedImages] = useState(existingImages);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setUploadedImages(Array.isArray(existingImages) ? existingImages : []);
  }, [existingImages]);

  const resolveImageUrl = (image) => {
    if (typeof image === 'string') return image;
    if (!image || typeof image !== 'object') return '';
    return (
      image.url ||
      image.image ||
      image.src ||
      image.location ||
      ''
    );
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    const currentTotal = uploadedImages.length;
    const availableSlots = maxImages - currentTotal;
    
    if (availableSlots <= 0) {
      setErrors([`Maximum ${maxImages} images allowed. Please remove some images before adding new ones.`]);
      return;
    }
    
    setIsUploading(true);
    setErrors([]);
    
    try {
      // Limit files to available slots
      const filesToUpload = Array.from(files).slice(0, availableSlots);
      
      // Upload to S3
      const uploadResult = await s3Service.uploadProductImages(filesToUpload, { folder });
      
      if (uploadResult.success) {
        const newImages = uploadResult.data.map((result, index) => ({
          url: result.url,
          key: result.key,
          originalName: result.originalName,
          size: result.size,
          type: result.type,
          is_primary: uploadedImages.length === 0 && index === 0,
          alt_text: result.originalName || 'Product image'
        }));
        
        const updatedImages = [...uploadedImages, ...newImages];
        setUploadedImages(updatedImages);
        onImagesChange?.(updatedImages);
        
        setErrors([]);
      } else {
        setErrors([uploadResult.error || 'Upload failed']);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors([`Failed to upload images: ${error.message}`]);
    } finally {
      setIsUploading(false);
    }
  }, [uploadedImages, maxImages, onImagesChange]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Handle file input
  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
    // Reset input value to allow re-selecting same files
    e.target.value = '';
  }, [handleFileUpload]);

  // Remove image
  const removeImage = useCallback((index) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
      updatedImages[0].is_primary = true;
    }
    
    setUploadedImages(updatedImages);
    onImagesChange?.(updatedImages);
  }, [uploadedImages, onImagesChange]);

  // Set primary image
  const setPrimaryImage = useCallback((index) => {
    const updatedImages = uploadedImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    
    setUploadedImages(updatedImages);
    onImagesChange?.(updatedImages);
  }, [uploadedImages, onImagesChange]);

  const currentTotal = uploadedImages.length;
  const canUploadMore = currentTotal < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-sm text-gray-500">
          {currentTotal} / {maxImages} images
        </span>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading to S3...' : 'Drag & drop images here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse files
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports JPG, PNG, GIF, WebP up to 5MB each
              </p>
            </div>
            
            {isUploading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600">Uploading to AWS S3...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-red-700 text-sm">{error}</p>
          ))}
        </div>
      )}

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Images ({uploadedImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {uploadedImages.map((image, index) => {
              const imageUrl = resolveImageUrl(image);
              return (
              <div key={`${imageUrl || 'image'}-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.alt_text || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4QzEwLjg5NTQgOCAxMCA4Ljg5NTQzIDEwIDEwQzEwIDExLjEwNDYgMTAuODk1NCAxMiAxMiAxMkMxMy4xMDQ2IDEyIDE0IDExLjEwNDYgMTQgMTBDMTQgOC44OTU0MyAxMy4xMDQ2IDggMTIgOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwLjUgNkg5LjVDOC4xMTkyOSA2IDcgNy4xMTkyOSA3IDguNVYxNS41QzcgMTYuODgwNyA4LjExOTI5IDE4IDkuNSAxOEgyMC41QzIxLjg4MDcgMTggMjMgMTYuODgwNyAyMyAxNS41VjguNUMyMyA3LjExOTI5IDIxLjg4MDcgNiAyMC41IDZaTTIxIDguNVYxMS4yNUwyMC4yNSAxMC41TDE5IDEyLjI1TDE2LjUgOS43NUwxMyAxNC43NUwxMCAxMS43NUw5IDE0LjVWOC41QzkgNy42NzE1NyA5LjY3MTU3IDcgMTAuNSA3SDIwLjVDMjEuMzI4NCA3IDIyIDcuNjcxNTcgMjIgOC41SDIxWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
                
                {/* File Info */}
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate">{image.originalName || 'Unknown'}</div>
                  {image.size && (
                    <div>{Math.round(image.size / 1024)} KB</div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {!image.is_primary && uploadedImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                        title="Set as primary"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      {!canUploadMore && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Maximum {maxImages} images reached. Remove some images to add more.
          </p>
        </div>
      )}
    </div>
  );
}
