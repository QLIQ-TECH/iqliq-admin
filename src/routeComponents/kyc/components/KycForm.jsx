'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { kycSchema } from '@/validation/validation.schema';
import { getPresignedUrl } from '@/api/services/post.api';
import { useOnboarding } from '@/hooks/useOnboarding';
const KycForm = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [filePreviews, setFilePreviews] = useState({
        passportImage: null,
        emirateImage: null,
        tradeImage: null,
        vatImage: null,
    });
    const { data: onboardingData, updateData } = useOnboarding();
    const form = useForm({
        resolver: zodResolver(kycSchema),
        defaultValues: {
            passportImage: onboardingData.passportDocs
                ? Array.isArray(onboardingData.passportDocs)
                    ? onboardingData.passportDocs[0]
                    : onboardingData.passportDocs
                : undefined,
            passportNumber: onboardingData.passportNumber || '',
            emiratesId: onboardingData.emiratesId || '',
            emirateImage: onboardingData.emiratesIdDocs
                ? Array.isArray(onboardingData.emiratesIdDocs)
                    ? onboardingData.emiratesIdDocs[0]
                    : onboardingData.emiratesIdDocs
                : undefined,
            companyName: onboardingData.companyName || '',
            companyWebsite: onboardingData.companyWebsite || '',
            tradeLicense: onboardingData.tradeLicense || '',
            tradeImage: onboardingData.tradeLicenseDocs
                ? Array.isArray(onboardingData.tradeLicenseDocs)
                    ? onboardingData.tradeLicenseDocs[0]
                    : onboardingData.tradeLicenseDocs
                : undefined,
            vatCertificate: onboardingData.vatCertificate || '',
            vatImage: onboardingData.vatCertificateDocs
                ? Array.isArray(onboardingData.vatCertificateDocs)
                    ? onboardingData.vatCertificateDocs[0]
                    : onboardingData.vatCertificateDocs
                : undefined,
        },
    });
    const router = useRouter();
    useEffect(() => {
        const loadExistingFiles = () => {
            const previews = {
                passportImage: null,
                emirateImage: null,
                tradeImage: null,
                vatImage: null,
            };
            if (onboardingData.passportDocs) {
                const url = Array.isArray(onboardingData.passportDocs)
                    ? onboardingData.passportDocs[0]
                    : onboardingData.passportDocs;
                previews.passportImage = url;
            }
            if (onboardingData.emiratesIdDocs) {
                const url = Array.isArray(onboardingData.emiratesIdDocs)
                    ? onboardingData.emiratesIdDocs[0]
                    : onboardingData.emiratesIdDocs;
                previews.emirateImage = url;
            }
            if (onboardingData.tradeLicenseDocs) {
                const url = Array.isArray(onboardingData.tradeLicenseDocs)
                    ? onboardingData.tradeLicenseDocs[0]
                    : onboardingData.tradeLicenseDocs;
                previews.tradeImage = url;
            }
            if (onboardingData.vatCertificateDocs) {
                const url = Array.isArray(onboardingData.vatCertificateDocs)
                    ? onboardingData.vatCertificateDocs[0]
                    : onboardingData.vatCertificateDocs;
                previews.vatImage = url;
            }
            setFilePreviews((prev) => ({ ...prev, ...previews }));
        };
        loadExistingFiles();
    }, [onboardingData]);
    const uploadFileToS3 = async (file) => {
        try {
            const res = await getPresignedUrl(file.name, file.type);
            const { uploadUrl, fileUrl } = res.data;
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });
            return fileUrl;
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        }
    };
    const handleFileChange = (file, fieldName, onChange) => {
        onChange(file);
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFilePreviews((prev) => ({ ...prev, [fieldName]: previewUrl }));
        }
        else {
            setFilePreviews((prev) => ({ ...prev, [fieldName]: null }));
        }
    };
    const handleRemoveFile = (fieldName, onChange) => {
        onChange(null);
        setFilePreviews((prev) => ({ ...prev, [fieldName]: null }));
    };
    const onSubmit = async (values) => {
        setIsUploading(true);
        try {
            const uploadedData = {
                companyName: values.companyName,
                companyWebsite: values.companyWebsite,
                passportNumber: values.passportNumber,
                emiratesId: values.emiratesId,
                tradeLicense: values.tradeLicense,
                vatCertificate: values.vatCertificate,
            };
            if (values.passportImage instanceof File) {
                uploadedData.passportDocs = await uploadFileToS3(values.passportImage);
            }
            else if (typeof values.passportImage === 'string') {
                uploadedData.passportDocs = values.passportImage;
            }
            if (values.emirateImage instanceof File) {
                uploadedData.emiratesIdDocs = await uploadFileToS3(values.emirateImage);
            }
            else if (typeof values.emirateImage === 'string') {
                uploadedData.emiratesIdDocs = values.emirateImage;
            }
            if (values.tradeImage instanceof File) {
                uploadedData.tradeLicenseDocs = await uploadFileToS3(values.tradeImage);
            }
            else if (typeof values.tradeImage === 'string') {
                uploadedData.tradeLicenseDocs = values.tradeImage;
            }
            if (values.vatImage instanceof File) {
                uploadedData.vatCertificateDocs = await uploadFileToS3(values.vatImage);
            }
            else if (typeof values.vatImage === 'string') {
                uploadedData.vatCertificateDocs = values.vatImage;
            }
            updateData({
                ...uploadedData,
                passportDocs: uploadedData.passportDocs
                    ? [uploadedData.passportDocs]
                    : undefined,
                emiratesIdDocs: uploadedData.emiratesIdDocs
                    ? [uploadedData.emiratesIdDocs]
                    : undefined,
                tradeLicenseDocs: uploadedData.tradeLicenseDocs
                    ? [uploadedData.tradeLicenseDocs]
                    : undefined,
                vatCertificateDocs: uploadedData.vatCertificateDocs
                    ? [uploadedData.vatCertificateDocs]
                    : undefined,
            });
            router.push('/onboarding/choose-category');
        }
        catch (error) {
            console.error('Error submitting form:', error);
        }
        finally {
            setIsUploading(false);
        }
    };
    const FileUploadField = ({ field, fieldName, label, id, }) => {
        const preview = filePreviews[fieldName];
        const isPdf = (field.value instanceof File && field.value.type === 'application/pdf') ||
            (typeof preview === 'string' && preview.toLowerCase().includes('.pdf'));
        const isImage = preview && !isPdf;
        const getFileName = () => {
            if (field.value instanceof File)
                return field.value.name;
            if (typeof field.value === 'string') {
                // Try to get filename from URL or just show "Uploaded Document"
                try {
                    const url = new URL(field.value);
                    const pathname = url.pathname;
                    const name = pathname.split('/').pop();
                    return name ? decodeURIComponent(name) : 'Uploaded Document';
                }
                catch {
                    return 'Uploaded Document';
                }
            }
            return 'Uploaded file';
        };
        const getFileSize = () => {
            if (field.value instanceof File) {
                return `${(field.value.size / 1024).toFixed(1)} KB`;
            }
            return 'File ready';
        };
        return (<FormItem>
        <FormLabel className="font-semibold">
          {label} <span className="text-red-500">*</span>
        </FormLabel>
        <FormControl>
          <div>
            {preview ? (<div className="relative border-2 border-gray-300 rounded-xl p-3 bg-gray-50">
                <button type="button" onClick={() => handleRemoveFile(fieldName, field.onChange)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition shadow-md z-10">
                  <X className="w-3.5 h-3.5"/>
                </button>

                <div className="flex items-center gap-3">
                  {isImage ? (<div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-200">
                      <img src={preview} alt={label} className="w-full h-full object-contain"/>
                    </div>) : (<div className="flex-shrink-0 w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400"/>
                    </div>)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getFileName()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getFileSize()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1 flex-1 bg-green-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full"></div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">
                        ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>) : (<label htmlFor={id} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer p-6 hover:border-blue-500 hover:bg-blue-50/50 transition">
                <Upload className="w-8 h-8 text-gray-400 mb-2"/>
                <span className="text-sm font-medium text-gray-700">
                  Click to upload
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  JPG, PNG, PDF (Max. 3MB)
                </span>
              </label>)}

            <input id={id} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null, fieldName, field.onChange)}/>
          </div>
        </FormControl>
        <FormMessage className="text-red-500"/>
      </FormItem>);
    };
    return (<div className="text-black w-full space-y-5 sm:space-y-7 pr-7 max-h-[500px]">
      <div className="space-y-3 sm:space-y-5 text-center sm:text-left">
        <h1 className="font-semibold text-3xl sm:text-4xl">
          Let's Complete Your KYC
        </h1>
        <p className="font-semibold text-sm sm:text-base ml-1">
          Please upload the required documents below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-7">
          <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  Company Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="companyWebsite" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  Company Website <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="url" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="passportNumber" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  Passport Number <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="passportImage" render={({ field }) => (<FileUploadField field={field} fieldName="passportImage" label="Passport" id="passport-upload"/>)}/>

          <FormField control={form.control} name="emiratesId" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  Emirates ID <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="emirateImage" render={({ field }) => (<FileUploadField field={field} fieldName="emirateImage" label="Emirates ID Image" id="emirates-upload"/>)}/>

          <FormField control={form.control} name="tradeLicense" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  Trade License <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="tradeImage" render={({ field }) => (<FileUploadField field={field} fieldName="tradeImage" label="Trade License Image" id="trade-upload"/>)}/>

          <FormField control={form.control} name="vatCertificate" render={({ field }) => (<FormItem>
                <FormLabel className="font-semibold">
                  VAT Certificate <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" className="rounded-xl border-gray-300 py-5 px-3" {...field}/>
                </FormControl>
                <FormMessage className="text-red-500"/>
              </FormItem>)}/>

          <FormField control={form.control} name="vatImage" render={({ field }) => (<FileUploadField field={field} fieldName="vatImage" label="VAT Certificate Image" id="vat-upload"/>)}/>

          <div className="flex flex-row gap-4 mt-7">
            <Button type="button" disabled={isUploading} className="w-full bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition disabled:opacity-50" onClick={() => router.push('/onboarding/connect-store')}>
              Back
            </Button>
            <Button type="submit" disabled={isUploading} className="w-full rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition disabled:opacity-50">
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default KycForm;
