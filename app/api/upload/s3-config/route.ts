import { NextResponse } from 'next/server'
import { getS3BucketName } from '../../../../lib/server/s3Env'

/**
 * Returns whether server-side S3 env is present (for admin UI status).
 * Does not expose credentials.
 */
export async function GET() {
  const region = process.env.AWS_REGION
  const bucket = getS3BucketName()
  const hasCredentials = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  )
  const configured = Boolean(region && bucket && hasCredentials)

  return NextResponse.json({
    configured,
    region: configured ? region : null,
    bucket: configured ? bucket : null,
  })
}
