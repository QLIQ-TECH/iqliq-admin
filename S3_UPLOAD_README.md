# AWS S3 Direct Upload Implementation

This implementation enables direct image uploads from the frontend to AWS S3, eliminating backend dependency for image handling.

## Features

- ✅ Direct uploads to AWS S3 from frontend
- ✅ No backend dependency for image uploads  
- ✅ Image validation (file type, size)
- ✅ Drag & drop interface
- ✅ Multiple file support (up to 5 images)
- ✅ Progress indicators
- ✅ Primary image selection
- ✅ URL-based image addition (fallback)
- ✅ S3 configuration validation
- ✅ Upload testing utility
- ✅ Reusable components

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET=iqliq-mumbai
```

### AWS S3 Bucket Configuration

1. **Create S3 Bucket** (if not exists)
   ```bash
   aws s3 mb s3://iqliq-mumbai --region ap-south-1
   ```

2. **Set Bucket CORS Policy**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Set Bucket Public Read Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::iqliq-mumbai/*"
       }
     ]
   }
   ```

### IAM User Permissions

The AWS user should have these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::iqliq-mumbai/*"
    }
  ]
}
```

## Components

### 1. S3Service (`lib/services/s3Service.js`)
Core service for S3 operations:
- File upload with validation
- Bulk upload support  
- Error handling
- File naming with timestamps

### 2. ImageUpload Component (`components/ImageUpload.jsx`)
Reusable upload component:
- Drag & drop interface
- Preview with controls
- Primary image selection
- Progress indicators

### 3. S3Status Component (`components/S3Status.jsx`)
Configuration validator:
- Environment variable check
- Upload testing
- Visual status indicators

### 4. S3TestUtils (`lib/utils/s3Test.js`)
Testing utilities:
- Connection testing
- Upload verification
- Diagnostic reports

## Usage Examples

### Basic Image Upload
```jsx
import ImageUpload from '../components/ImageUpload';

function MyComponent() {
  const [images, setImages] = useState([]);

  return (
    <ImageUpload
      onImagesChange={setImages}
      maxImages={5}
      folder="products"
      required={true}
    />
  );
}
```

### Direct S3 Upload
```javascript
import s3Service from '../lib/services/s3Service';

// Upload single file
const result = await s3Service.uploadFile(file, 'products');

// Upload multiple files
const results = await s3Service.uploadProductImages(files);
```

### Configuration Check
```jsx
import S3Status from '../components/S3Status';

function SettingsPage() {
  return (
    <div>
      <S3Status />
    </div>
  );
}
```

## File Structure

```
admin-ecom/
├── lib/
│   ├── services/
│   │   ├── s3Service.js          # Core S3 upload service
│   │   └── productService.js     # Updated to use S3
│   └── utils/
│       └── s3Test.js            # S3 testing utilities
├── components/
│   ├── ImageUpload.jsx          # Reusable upload component
│   └── S3Status.jsx             # Configuration validator
└── app/
    └── vendor/
        └── products/
            ├── add/page.jsx     # Updated add product page
            └── edit/[id]/page.jsx # Updated edit product page
```

## Security Considerations

1. **Frontend Credentials**: AWS credentials are exposed in frontend code. For production:
   - Use temporary credentials (STS)
   - Implement pre-signed URLs
   - Use AWS Cognito for authentication

2. **CORS Configuration**: Current setup allows all origins. Restrict to your domain:
   ```json
   "AllowedOrigins": ["https://yourdomain.com"]
   ```

3. **File Validation**: 
   - Client-side validation only
   - Consider server-side validation for production
   - Implement virus scanning for uploads

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check S3 bucket CORS policy
   - Verify allowed origins and methods

2. **Access Denied**
   - Verify IAM user permissions
   - Check AWS credentials in `.env`

3. **Upload Fails**
   - Check file size limits
   - Verify file types are allowed
   - Test with S3Status component

### Testing

Use the S3Status component to test your setup:
1. Check environment variables
2. Run upload test
3. Verify uploaded file URL

## Migration Notes

### From Backend Upload to S3

1. **Backup existing images** before migration
2. **Update image URLs** in database to S3 URLs
3. **Test thoroughly** with different file types
4. **Monitor S3 costs** for high-volume usage

### Rollback Plan

Keep the legacy upload method (`uploadProductImagesLegacy`) for quick rollback if needed.

## Cost Optimization

1. **S3 Storage Classes**: Use IA for rarely accessed images
2. **CloudFront CDN**: Add CDN for better performance
3. **Image Optimization**: Implement WebP conversion
4. **Lifecycle Policies**: Auto-delete test uploads

## Production Recommendations

1. **Use CloudFormation/Terraform** for infrastructure
2. **Implement image resizing** (AWS Lambda + Sharp)
3. **Add monitoring** (CloudWatch metrics)
4. **Set up S3 event notifications** for processing
5. **Implement proper error tracking** (Sentry)

## Performance Notes

- Images are uploaded directly from browser to S3
- No server bandwidth usage for uploads
- Parallel upload support for multiple files
- Automatic retry logic for failed uploads

## Support

For issues or questions:
1. Check browser console for errors
2. Use S3Status component for diagnostics
3. Verify AWS credentials and permissions
4. Test with small files first