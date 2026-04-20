import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getS3BucketName, getS3BucketEnvLabel } from '../../../../lib/server/s3Env'

const getS3PublicUrl = (bucket: string, region: string, key: string) => {
  const cdnUrl = process.env.CDN_URL
  // If you have a CloudFront/CDN in front of S3, this should point to it.
  return cdnUrl ? `${cdnUrl}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const sanitizeKeyPart = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '-')

export async function POST(req: Request) {
  // Basic guard: admin UI should always send an auth header.
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  if (!authHeader) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  const folderRaw = formData.get('folder')
  const folder = typeof folderRaw === 'string' && folderRaw.trim() ? folderRaw.trim() : 'gigs'

  const maybeFile = file as any
  if (!maybeFile || typeof maybeFile.arrayBuffer !== 'function') {
    return NextResponse.json({ message: 'file is required' }, { status: 400 })
  }

  // Only images allowed.
  const fileType = typeof maybeFile.type === 'string' ? maybeFile.type : ''
  const isImage = fileType.startsWith('image/')
  if (!isImage) {
    return NextResponse.json({ message: 'Only image uploads are allowed' }, { status: 400 })
  }

  // Guardrail: 5MB max (adjust if needed).
  const maxBytes = 5 * 1024 * 1024
  const fileSize = typeof maybeFile.size === 'number' ? maybeFile.size : 0
  if (fileSize > maxBytes) {
    return NextResponse.json({ message: 'Image too large (max 5MB)' }, { status: 413 })
  }

  // Use the AWS credentials from this admin-ecom process .env (gig image uploads only).
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

  const ext = (() => {
    const name = typeof maybeFile.name === 'string' ? maybeFile.name : ''
    const idx = name.lastIndexOf('.')
    return idx >= 0 ? name.slice(idx) : ''
  })()

  const safeFileName = sanitizeKeyPart(
    (typeof maybeFile.name === 'string' ? maybeFile.name : '') || `upload${ext || ''}`,
  )
  const key = `${sanitizeKeyPart(folder)}/${Date.now()}-${safeFileName}`

  const buffer = Buffer.from(await maybeFile.arrayBuffer())

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: fileType || 'application/octet-stream',
      CacheControl: 'max-age=31536000', // 1 year
    }),
  )

  const url = getS3PublicUrl(bucket, region, key)
  return NextResponse.json({ url })
}

