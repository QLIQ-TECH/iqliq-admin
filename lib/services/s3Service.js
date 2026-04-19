/**
 * Product image uploads: browser PUTs directly to S3 using a presigned URL from
 * `/api/upload/s3-presign` (AWS credentials stay on the Next.js server only).
 */

const guessContentType = (file) => {
  if (file.type && file.type.startsWith('image/')) {
    const t = file.type.split(';')[0].trim().toLowerCase()
    if (t === 'image/jpg') return 'image/jpeg'
    return t
  }
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.gif')) return 'image/gif'
  if (name.endsWith('.webp')) return 'image/webp'
  return ''
}

class S3Service {
  validateFile(
    file,
    maxSizeBytes = 5 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ) {
    const errors = []

    if (file.size > maxSizeBytes) {
      errors.push(
        `File ${file.name} is too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
      )
    }

    const raw = guessContentType(file) || file.type || ''
    const normalized = raw === 'image/jpg' ? 'image/jpeg' : raw.split(';')[0].trim().toLowerCase()

    if (!allowedTypes.includes(normalized)) {
      errors.push(`File ${file.name} has invalid type. Allowed types: ${allowedTypes.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  async presignedPut(file, folder = 'products') {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'S3 upload is only available in the browser',
        originalName: file.name,
      }
    }

    const token = localStorage.getItem('qliq-admin-access-token')
    if (!token) {
      return {
        success: false,
        error: 'You must be signed in to upload images.',
        originalName: file.name,
      }
    }

    const contentTypeRaw = guessContentType(file)
    const normalizedType =
      contentTypeRaw === 'image/jpg' ? 'image/jpeg' : contentTypeRaw

    if (!normalizedType || !normalizedType.startsWith('image/')) {
      return {
        success: false,
        error: `Could not determine a supported image type for ${file.name}`,
        originalName: file.name,
      }
    }

    const res = await fetch('/api/upload/s3-presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: normalizedType,
        folder,
      }),
    })

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        success: false,
        error: payload.message || `Presign failed (${res.status})`,
        originalName: file.name,
      }
    }

    const { uploadUrl, publicUrl, key } = payload

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': normalizedType,
      },
    })

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '')
      return {
        success: false,
        error: `S3 upload failed (${putRes.status}). ${text.slice(0, 200)}`,
        originalName: file.name,
      }
    }

    return {
      success: true,
      url: publicUrl,
      key,
      originalName: file.name,
      size: file.size,
      type: normalizedType,
    }
  }

  async uploadFile(file, folder = 'products') {
    const validation = this.validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        originalName: file.name,
      }
    }
    return this.presignedPut(file, folder)
  }

  async uploadFiles(files, folder = 'products') {
    try {
      const results = await Promise.all(files.map((file) => this.uploadFile(file, folder)))

      const successful = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      return {
        success: failed.length === 0,
        data: successful,
        errors: failed,
        uploaded: successful.length,
        total: files.length,
      }
    } catch (error) {
      console.error('Bulk S3 Upload Error:', error)
      return {
        success: false,
        error: 'Failed to upload files to S3',
        data: [],
        errors: [error.message],
        uploaded: 0,
        total: files.length,
      }
    }
  }

  async uploadProductImages(files, options = {}) {
    const folder = typeof options.folder === 'string' && options.folder ? options.folder : 'products'
    const fileArray = Array.isArray(files) ? files : [files]
    const validatedFiles = []
    const validationErrors = []

    for (const file of fileArray) {
      const validation = this.validateFile(file)
      if (validation.valid) {
        validatedFiles.push(file)
      } else {
        validationErrors.push(...validation.errors)
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
        data: [],
      }
    }

    if (validatedFiles.length === 0) {
      return {
        success: false,
        error: 'No valid files to upload',
        data: [],
      }
    }

    const result = await this.uploadFiles(validatedFiles, folder)

    return {
      success: result.success,
      message: result.success
        ? `Successfully uploaded ${result.uploaded} of ${result.total} files`
        : `Failed to upload files: ${result.errors.map((e) => e.error || e).join(', ')}`,
      data: result.data,
    }
  }

  async resizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          },
          file.type,
          quality,
        )
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }
}

const s3Service = new S3Service()
export default s3Service
