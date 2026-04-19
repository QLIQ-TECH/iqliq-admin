/**
 * Server-only S3 env helpers (used by API routes).
 * Supports both AWS_BUCKET and AWS_S3_BUCKET naming.
 */
export function getS3BucketName(): string {
  const fromPrimary = (process.env.AWS_BUCKET || '').trim()
  if (fromPrimary) return fromPrimary
  return (process.env.AWS_S3_BUCKET || '').trim()
}

export function getS3BucketEnvLabel(): string {
  return 'AWS_BUCKET or AWS_S3_BUCKET'
}
