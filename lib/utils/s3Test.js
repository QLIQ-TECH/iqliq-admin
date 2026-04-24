/**
 * S3 connection test: presign + direct PUT (same path as vendor product images).
 */

import s3Service from '../services/s3Service'

export class S3TestUtils {
  static createTestFile() {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#4F46E5'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('TEST', 50, 55)

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const file = new File([blob], 'test-upload.png', {
            type: 'image/png',
            lastModified: Date.now(),
          })
          resolve(file)
        },
        'image/png',
      )
    })
  }

  static async testEnvironmentConfig() {
    try {
      const res = await fetch('/api/upload/s3-config')
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        return {
          success: false,
          config: {},
          missing: ['Unable to read S3 configuration from server'],
          message: `HTTP ${res.status}`,
        }
      }

      const configured = data.configured === true
      return {
        success: configured,
        config: {
          ...(data.region && { AWS_REGION: data.region }),
          ...(data.bucket && { AWS_BUCKET: data.bucket }),
        },
        missing: configured
          ? []
          : ['AWS_REGION, (AWS_BUCKET or AWS_S3_BUCKET), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY on server'],
        message: configured
          ? 'S3 environment variables are set on the Next.js server'
          : 'S3 is not fully configured on the Next.js server (.env)',
      }
    } catch (error) {
      return {
        success: false,
        config: {},
        missing: ['/api/upload/s3-config unreachable'],
        message: error.message || 'Configuration check failed',
      }
    }
  }

  static async testS3Upload() {
    try {
      const testFile = await this.createTestFile()
      const result = await s3Service.uploadFile(testFile, 'test-uploads')

      if (result.success) {
        return {
          success: true,
          message: 'S3 upload test successful!',
          url: result.url,
          details: {
            key: result.key,
            size: result.size,
            type: result.type,
          },
        }
      }
      return {
        success: false,
        message: 'S3 upload test failed',
        error: result.error,
      }
    } catch (error) {
      return {
        success: false,
        message: 'S3 upload test error',
        error: error.message,
      }
    }
  }

  static async runDiagnostic() {
    const envTest = await this.testEnvironmentConfig()

    if (!envTest.success) {
      return {
        overall: 'failed',
        environment: envTest,
        upload: { success: false, message: 'Skipped due to missing server S3 configuration' },
      }
    }

    const uploadTest = await this.testS3Upload()

    return {
      overall: uploadTest.success ? 'passed' : 'failed',
      environment: envTest,
      upload: uploadTest,
    }
  }
}

export default S3TestUtils
