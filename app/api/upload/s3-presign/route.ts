import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3BucketName, getS3BucketEnvLabel } from '../../../../lib/server/s3Env'

const getS3PublicUrl = (bucket: string, region: string, key: string) => {
  const cdnUrl = process.env.CDN_URL?.replace(/\/+$/, '')
  return cdnUrl ? `${cdnUrl}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const sanitizeFolder = (value: string) => {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, '')
  return cleaned || 'products'
}

const buildObjectKey = (folder: string, originalName: string) => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const base =
    originalName.includes('.') && originalName.length > 1
      ? originalName.slice(0, originalName.lastIndexOf('.'))
      : originalName || 'image'
  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : ''
  const cleanBase = base.replace(/[^a-zA-Z0-9]/g, '_') || 'image'
  return `${folder}/${cleanBase}_${timestamp}_${randomStr}${ext}`
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
])

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: { fileName?: string; contentType?: string; folder?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const fileName = typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : 'upload.bin'
  const rawType = typeof body.contentType === 'string' ? body.contentType.trim().toLowerCase() : ''
  const contentType = ALLOWED_IMAGE_TYPES.has(rawType) ? rawType : ''

  if (!contentType) {
    return NextResponse.json(
      { message: 'Invalid or missing image content type. Allowed: JPEG, PNG, GIF, WebP.' },
      { status: 400 },
    )
  }

  const folder = sanitizeFolder(typeof body.folder === 'string' ? body.folder : 'products')
  const key = buildObjectKey(folder, fileName)

  const region = process.env.AWS_REGION
  const bucket = getS3BucketName()
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  const missing: string[] = []
  if (!region) missing.push('AWS_REGION')
  if (!bucket) missing.push(getS3BucketEnvLabel())
  if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID')
  if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY')

  if (missing.length > 0) {
    return NextResponse.json(
      { message: `S3 is not configured on the server. Missing: ${missing.join(', ')}` },
      { status: 500 },
    )
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })
  const publicUrl = getS3PublicUrl(bucket, region, key)

  return NextResponse.json({
    uploadUrl,
    publicUrl,
    key,
    contentType,
  })
}
