'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '../../components/ImageUpload';
import S3Status from '../../components/S3Status';

export default function TestS3Page() {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [serverS3, setServerS3] = useState({ loading: true, configured: false, region: '', bucket: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/upload/s3-config');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setServerS3({
            loading: false,
            configured: Boolean(data.configured),
            region: data.region || '',
            bucket: data.bucket || '',
          });
        }
      } catch {
        if (!cancelled) {
          setServerS3((s) => ({ ...s, loading: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            S3 Upload Test Page
          </h1>
          <p className="text-gray-600">
            Test the AWS S3 direct upload functionality without backend dependency.
          </p>
        </div>

        {/* S3 Configuration Status */}
        <S3Status />

        {/* Image Upload Test */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Test Image Upload
          </h2>
          
          <ImageUpload
            onImagesChange={(images) => {
              console.log('Images changed:', images);
              setUploadedImages(images);
            }}
            maxImages={5}
            folder="test-uploads"
            label="Test Upload to S3"
            required={false}
          />
        </div>

        {/* Upload Results */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Results ({uploadedImages.length})
            </h2>
            
            <div className="space-y-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Image Preview */}
                    <div className="flex items-center space-x-3">
                      <img 
                        src={image.url} 
                        alt={image.originalName}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {image.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {image.size ? Math.round(image.size / 1024) + ' KB' : 'Unknown size'}
                        </p>
                        {image.is_primary && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* S3 Details */}
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Key:</span>
                        <span className="ml-2 font-mono text-gray-600 break-all">
                          {image.key}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-600">{image.type}</span>
                      </div>
                    </div>
                    
                    {/* S3 URL */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">S3 URL:</p>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={image.url}
                          readOnly
                          className="flex-1 text-xs font-mono p-2 border border-gray-300 rounded bg-gray-50"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(image.url);
                            alert('URL copied to clipboard!');
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Testing Instructions
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. <strong>Check Configuration:</strong> Ensure the S3 Status shows "configured" above.</p>
            <p>2. <strong>Test Upload:</strong> Click "Test Upload" button in the S3 Status component.</p>
            <p>3. <strong>Upload Images:</strong> Drag & drop images or click to browse files.</p>
            <p>4. <strong>Verify URLs:</strong> Check that uploaded images are accessible via the S3 URLs.</p>
            <p>5. <strong>Check Console:</strong> Open browser developer tools to see upload logs.</p>
          </div>
        </div>

        {/* Server S3 config (no secrets — from /api/upload/s3-config) */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Server S3 configuration
          </h3>
          {serverS3.loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">{serverS3.configured ? 'Configured' : 'Not configured'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Region:</span>
                <span className="ml-2 font-mono">{serverS3.region || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Bucket:</span>
                <span className="ml-2 font-mono break-all">{serverS3.bucket || '—'}</span>
              </div>
              <p className="sm:col-span-2 text-xs text-gray-500">
                Credentials are only read on the Next.js server. Use <code className="bg-gray-200 px-1 rounded">AWS_BUCKET</code> or{' '}
                <code className="bg-gray-200 px-1 rounded">AWS_S3_BUCKET</code> in <code className="bg-gray-200 px-1 rounded">admin-ecom/.env</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}