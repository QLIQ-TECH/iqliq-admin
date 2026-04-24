'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Cloud, TestTube, Upload } from 'lucide-react';
import S3TestUtils from '../lib/utils/s3Test';

export default function S3Status() {
  const [status, setStatus] = useState('checking');
  const [config, setConfig] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    checkS3Configuration();
  }, []);

  const checkS3Configuration = async () => {
    try {
      const res = await fetch('/api/upload/s3-config');
      const data = await res.json().catch(() => ({}));

      setConfig({
        region: data.region || null,
        bucket: data.bucket || null,
      });

      if (data.configured) {
        setStatus('configured');
      } else {
        setStatus('missing');
      }
    } catch (error) {
      console.error('S3 configuration check failed:', error);
      setStatus('error');
    }
  };

  const runS3Test = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const diagnostic = await S3TestUtils.runDiagnostic();
      setTestResult(diagnostic);
    } catch (error) {
      setTestResult({
        overall: 'failed',
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'missing':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Cloud className="w-5 h-5 text-blue-600 animate-pulse" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'configured':
        return 'S3 configuration is complete. Image uploads will be stored directly to AWS S3.';
      case 'missing':
        return 'S3 configuration is incomplete. Please check your environment variables.';
      case 'error':
        return 'Error checking S3 configuration.';
      default:
        return 'Checking S3 configuration...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'configured':
        return 'border-green-200 bg-green-50';
      case 'missing':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">
              AWS S3 Direct Upload
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusMessage()}
          </p>
          
          {status === 'configured' && (
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <div>Region: <span className="font-mono">{config.region}</span></div>
              <div>Bucket: <span className="font-mono">{config.bucket}</span></div>
              <div>Credentials: <span className="font-mono">configured on server</span></div>
            </div>
          )}
          
          {status === 'missing' && (
            <div className="mt-3 text-xs text-gray-600">
              <p>Set on the admin Next.js server (<code className="text-xs bg-gray-100 px-1 rounded">admin-ecom/.env</code>):</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>AWS_REGION</li>
                <li>AWS_BUCKET or AWS_S3_BUCKET</li>
                <li>AWS_ACCESS_KEY_ID</li>
                <li>AWS_SECRET_ACCESS_KEY</li>
              </ul>
            </div>
          )}

          {status === 'configured' && (
            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={runS3Test}
                disabled={testing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? (
                  <>
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-3 h-3 mr-1.5" />
                    Test Upload
                  </>
                )}
              </button>
            </div>
          )}

          {testResult && (
            <div className={`mt-3 p-3 rounded-md text-xs ${
              testResult.overall === 'passed' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {testResult.overall === 'passed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-medium ${
                  testResult.overall === 'passed' ? 'text-green-800' : 'text-red-800'
                }`}>
                  S3 Upload Test {testResult.overall === 'passed' ? 'Passed' : 'Failed'}
                </span>
              </div>
              
              {testResult.upload?.success && testResult.upload.url && (
                <div className="space-y-1 text-gray-600">
                  <p>✓ Successfully uploaded test image</p>
                  <p className="font-mono text-xs break-all">
                    URL: {testResult.upload.url}
                  </p>
                </div>
              )}
              
              {testResult.upload?.error && (
                <div className="space-y-1 text-red-700">
                  <p>✗ Upload failed: {testResult.upload.error}</p>
                </div>
              )}
              
              {testResult.error && (
                <div className="text-red-700">
                  <p>✗ Test error: {testResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}