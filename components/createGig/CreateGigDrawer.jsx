'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { gigsApi, usersApi } from '../../lib/apiClient';
import {
  Facebook,
  Instagram,
  Music2,
  Play,
  Users,
  X,
  Heart,
  Eye,
  MessageCircle,
  DollarSign
} from 'lucide-react';
import Step1Platform from './steps/Step1Platform';
import Step2Influencers from './steps/Step2Influencers';
import Step3GigType from './steps/Step3GigType';
import Step4FillDetails from './steps/Step4FillDetails';
import Step5ConfirmAgreement from './steps/Step5ConfirmAgreement';
import Step5IqliqSalesSelectProduct from './steps/Step5IqliqSalesSelectProduct';
import Step6Success from './steps/Step6Success';

const EMPTY_STEP4_FORM = {
  title: '',
  amount: '',
  successAmount: '',
  kpi: '',
  url: '',
  startDate: '',
  endDate: '',
  description: ''
};

/**
 * Same slide-in create-gig flow as the vendor dashboard (+ Create Gigs).
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {() => void} [onGigCreated] — called after gig is successfully created (refresh lists)
 * @param {() => void} [onViewGigs] — Step 6 primary action (default: go to /vendor/gigs)
 * @param {string} [campaignId] — when set (e.g. from campaign detail), included in POST /gigs/create body
 */
export default function CreateGigDrawer({
  open,
  onClose,
  onGigCreated,
  onViewGigs,
  campaignId
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const currentStepRef = useRef(1);
  const [isLoadingInfluencers, setIsLoadingInfluencers] = useState(false);
  const [influencers, setInfluencers] = useState([]);
  const [allInfluencers, setAllInfluencers] = useState([]);
  const [selectedInfluencerIds, setSelectedInfluencerIds] = useState([]);
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState('');
  const [selectedGigType, setSelectedGigType] = useState('');
  const [step4Form, setStep4Form] = useState(() => ({ ...EMPTY_STEP4_FORM }));
  const [brandAgreementAccepted, setBrandAgreementAccepted] = useState(false);
  const [selectedSalesProductIds, setSelectedSalesProductIds] = useState([]);

  const step4UploadInputRef = useRef(null);
  const [step4ImageFile, setStep4ImageFile] = useState(null);
  const [isCreatingGig, setIsCreatingGig] = useState(false);
  const [createGigError, setCreateGigError] = useState('');
  const [createdGigId, setCreatedGigId] = useState(null);

  const platformOptions = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, iconClass: 'text-blue-600' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, iconClass: 'text-pink-500' },
    { id: 'tiktok', label: 'TikTok', icon: Music2, iconClass: 'text-black' },
    { id: 'youtube', label: 'Youtube', icon: Play, iconClass: 'text-red-600' },
    { id: 'iqliq', label: 'IQliq', icon: Users, iconClass: 'text-sky-600' }
  ];

  const baseGigTypeOptions = [
    {
      id: 'like_watch_comment_repost',
      title: 'Like & Watch & Comment & Repost',
      subtitle: 'Full engagement package',
      icon: Heart
    },
    {
      id: 'like_watch',
      title: 'Like & Watch',
      subtitle: 'Like and view content',
      icon: Heart
    },
    {
      id: 'like_comment',
      title: 'Like & Comment',
      subtitle: 'Like and leave a comment',
      icon: Heart
    },
    {
      id: 'like_repost',
      title: 'Like & Repost',
      subtitle: 'Like and share content',
      icon: Heart
    },
    {
      id: 'watch_comment',
      title: 'Watch & Comment',
      subtitle: 'View and comment on content',
      icon: Eye
    },
    {
      id: 'watch_repost',
      title: 'Watch & Repost',
      subtitle: 'View and share content',
      icon: Eye
    },
    {
      id: 'comment_repost',
      title: 'Comment & Repost',
      subtitle: 'Comment and share content',
      icon: MessageCircle
    }
  ];

  const salesGigTypeOption = {
    id: 'sales',
    title: 'Sales',
    subtitle: 'Sales gig',
    icon: DollarSign
  };

  const gigTypeOptions = selectedPlatform === 'iqliq' ? [...baseGigTypeOptions, salesGigTypeOption] : baseGigTypeOptions;

  const platformLabelMap = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    iqliq: 'IQliq'
  };

  const platformLabel = platformLabelMap[selectedPlatform] || selectedPlatform || '';
  const selectedGigTypeOption = gigTypeOptions.find((x) => x.id === selectedGigType) || null;
  const selectedGigCategory = selectedGigTypeOption?.title || '';
  const selectedAmount = step4Form.amount || '';
  const selectedSuccessAmount = step4Form.successAmount || '';
  const isIqliqSalesFlow = selectedPlatform === 'iqliq' && selectedGigType === 'sales';
  const iqliqSalesOfficialBrandId =
    process.env.NEXT_PUBLIC_IQLIQ_SALES_OFFICIAL_BRAND_ID || '69cf9bd0fb912b2c21f90676';
  const allAgreed =
    selectedInfluencerIds.length > 0 &&
    brandAgreementAccepted &&
    Boolean(selectedGigType) &&
    (!isIqliqSalesFlow || selectedSalesProductIds.length > 0);

  const resetForm = () => {
    currentStepRef.current = 1;
    setCurrentStep(1);
    setSelectedPlatform('');
    setInfluencers([]);
    setAllInfluencers([]);
    setSelectedInfluencerIds([]);
    setInfluencerSearch('');
    setSelectedListFilter('');
    setStep4Form({ ...EMPTY_STEP4_FORM });
    setStep4ImageFile(null);
    setSelectedGigType('');
    setBrandAgreementAccepted(false);
    setSelectedSalesProductIds([]);
    setCreatedGigId(null);
    setCreateGigError('');
    setIsCreatingGig(false);
  };

  // Reset wizard when opening (match dashboard “Create Gigs” behaviour)
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  /** Clears selections for steps after the target when the user goes Back. */
  const navigateToStep = useCallback(
    (targetStep) => {
      const from = currentStepRef.current;
      if (targetStep < from) {
        const iqliqSales = selectedPlatform === 'iqliq' && selectedGigType === 'sales';

        if (targetStep <= 1) {
          setSelectedPlatform('');
          setSelectedInfluencerIds([]);
          setInfluencerSearch('');
          setSelectedListFilter('');
        }
        if (targetStep <= 2) {
          setSelectedGigType('');
        }
        if (targetStep <= 3) {
          setSelectedSalesProductIds([]);
          setStep4Form({ ...EMPTY_STEP4_FORM });
          setStep4ImageFile(null);
          setBrandAgreementAccepted(false);
        } else if (targetStep === 4 && from === 5) {
          if (iqliqSales) {
            setStep4Form({ ...EMPTY_STEP4_FORM });
            setStep4ImageFile(null);
          }
          setBrandAgreementAccepted(false);
        } else if (targetStep === 5 && from === 6 && iqliqSales) {
          setBrandAgreementAccepted(false);
        }

        setCreateGigError('');
      }

      currentStepRef.current = targetStep;
      setCurrentStep(targetStep);
    },
    [selectedPlatform, selectedGigType]
  );

  const closeDrawer = () => {
    resetForm();
    onClose?.();
  };

  const mapInfluencer = (item) => ({
    id:
      item?.authUserId != null && item.authUserId !== ''
        ? String(item.authUserId)
        : String(item?._id ?? ''),
    name: item?.name || 'Unknown Influencer',
    profilePicture: item?.profilePicture || '',
    referralCode: item?.referralCode || '',
    activeSocialMedia: Array.isArray(item?.activeSocialMedia) ? item.activeSocialMedia : []
  });

  const fetchAllInfluencers = async () => {
    setIsLoadingInfluencers(true);
    try {
      // Fetch all influencers using the filter endpoint (token provided by ApiClient).
      // Requirement: do NOT pass `platform` so it returns all influencers.
      const limit = 10;
      let page = 1;
      let aggregated = [];

      // Page through until backend returns fewer than `limit`.
      // This keeps Step 2 "Select Influencers" fully populated.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const json = await usersApi.get('/influencers/filter', {
          search: '',
          // platform intentionally omitted to avoid platform-based division
          page,
          limit,
          myList: ''
        });

        const rows = json?.data?.data || [];
        aggregated = aggregated.concat(rows.map(mapInfluencer));

        if (!Array.isArray(rows) || rows.length < limit) break;
        page += 1;
      }

      setAllInfluencers(aggregated);
      setInfluencers(aggregated);
    } catch (error) {
      console.error('Error fetching all influencers:', error);
      setAllInfluencers([]);
      setInfluencers([]);
    } finally {
      setIsLoadingInfluencers(false);
    }
  };

  const fetchInfluencers = async () => {
    try {
      // If there's no search/list filter, just show the full list.
      if (!influencerSearch?.trim() && !selectedListFilter) {
        if (allInfluencers.length > 0) {
          setInfluencers(allInfluencers);
        } else {
          await fetchAllInfluencers();
        }
        return;
      }

      // Keep full list cached for referralCode/name lookup.
      if (allInfluencers.length === 0) {
        await fetchAllInfluencers();
      }

      setIsLoadingInfluencers(true);

      // Search across ALL platforms (no platform division).
      // Token is automatically sent by usersApi (ApiClient).
      const json = await usersApi.get('/influencers/filter', {
        search: influencerSearch || '',
        // platform intentionally omitted so search results are not divided by platform
        page: 1,
        limit: 10,
        myList: selectedListFilter || ''
      });

      const rows = json?.data?.data || json?.data || json?.data?.rows || [];
      setInfluencers(Array.isArray(rows) ? rows.map(mapInfluencer) : []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      setInfluencers([]);
    } finally {
      setIsLoadingInfluencers(false);
    }
  };

  const handleContinueFromStep1 = async () => {
    if (!selectedPlatform) return;
    navigateToStep(2);
    await fetchAllInfluencers();
  };

  const toggleInfluencerSelection = (influencerId) => {
    setSelectedInfluencerIds((prev) => {
      if (prev.includes(influencerId)) {
        return prev.filter((id) => id !== influencerId);
      }
      return [...prev, influencerId];
    });
  };

  const allSelected = useMemo(
    () => influencers.length > 0 && selectedInfluencerIds.length === influencers.length,
    [influencers.length, selectedInfluencerIds.length]
  );

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedInfluencerIds([]);
      return;
    }
    setSelectedInfluencerIds(influencers.map((influencer) => influencer.id));
  };

  const getInitial = (name) => (name || 'A').trim().charAt(0).toUpperCase();
  const socialIconFor = (platform) => {
    if (platform === 'Facebook') return <Facebook size={18} className="text-blue-600 fill-blue-600" />;
    if (platform === 'TikTok') return <Music2 size={18} className="text-black" />;
    if (platform === 'Instagram') return <Instagram size={18} className="text-pink-500" />;
    if (platform === 'YouTube') return <Play size={18} className="text-red-600 fill-red-600" />;
    return null;
  };

  const formatMMDDYYYY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const getAdminToken = () => {
    try {
      return localStorage.getItem('qliq-admin-access-token');
    } catch {
      return null;
    }
  };

  const uploadDescriptionDocIfPresent = async () => {
    if (!step4ImageFile) return null;

    const formData = new FormData();
    formData.append('file', step4ImageFile);
    formData.append('folder', 'gigs');
    formData.append('optimize', 'true');
    formData.append('maxWidth', '1200');
    formData.append('maxHeight', '1200');
    formData.append('quality', '85');

    const token = getAdminToken();
    const result = await fetch('/api/gigs/upload-doc', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    if (!result.ok) {
      const errData = await result.json().catch(() => null);
      throw new Error(errData?.message || 'Failed to upload image to S3');
    }

    const data = await result.json();
    return data?.url || null;
  };

  const handleConfirmCreateGig = async () => {
    if (!step4CanProceed) return;
    if (selectedInfluencerIds.length === 0) return;
    if (!allAgreed) return;

    setIsCreatingGig(true);
    setCreateGigError('');

    try {
      const gigcompletionAmount = Number(step4Form.amount);
      const gigSuccessAmount = Number(step4Form.successAmount);

      const platformFeePct = 0.15;
      const gigCompletionAmountPlatformFees = gigcompletionAmount * platformFeePct;
      const gigSuccessAmountPlatformFees = gigSuccessAmount * platformFeePct;
      const influencerCompletionAmount =
        gigcompletionAmount - gigCompletionAmountPlatformFees;
      const influencerSuccessAmount = gigSuccessAmount - gigSuccessAmountPlatformFees;

      const descriptionDocsUrl = await uploadDescriptionDocIfPresent();

      /** Matches backend shape (see campaign-scoped create with `campaignId`). */
      const payload = {
        title: step4Form.title.trim(),
        description: step4Form.description.trim(),
        platform: platformLabel,
        typeOfGig: selectedGigCategory,
        customerDiscountPercentage: 0,
        customerDiscountFixed: 0,
        influencerCommissionPercentage: 0,
        influencerCommissionFixed: 0,
        ...(campaignId ? { campaignId } : {}),
        purchaseAllProducts: false,
        startDate: step4Form.startDate
          ? new Date(`${step4Form.startDate}T18:30:00.000Z`).toISOString()
          : null,
        endDate: step4Form.endDate
          ? new Date(`${step4Form.endDate}T18:30:00.000Z`).toISOString()
          : null,
        target: gigSuccessAmount,
        gigcompletionAmount,
        gigSuccessAmount,
        gigCompletionAmountPlatformFees,
        gigSuccessAmountPlatformFees,
        influencerCompletionAmount,
        influencerSuccessAmount,
        assignedUsers: selectedInfluencerIds
          .filter(Boolean)
          .map((id) => ({
            id,
            referralCode: allInfluencers.find((x) => x.id === id)?.referralCode || ''
          })),
        purchaseProductId: isIqliqSalesFlow ? selectedSalesProductIds : [],
        productUrl: step4Form.url.trim()
      };

      if (descriptionDocsUrl) {
        payload.descriptionDocs = descriptionDocsUrl;
      }

      const result = await gigsApi.post('/gigs/create', payload);

      const gigId =
        result?.data?._id ||
        result?.data?.gig?._id ||
        result?.data?.id ||
        result?.data?.gigId ||
        null;

      setCreatedGigId(gigId);
      navigateToStep(isIqliqSalesFlow ? 7 : 6);
      onGigCreated?.();
    } catch (e) {
      console.error('Create gig failed:', e);
      setCreateGigError(e?.message || 'Failed to create gig');
    } finally {
      setIsCreatingGig(false);
    }
  };

  const getTodayInputValue = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayInputValue = getTodayInputValue();
  const minEndDate = step4Form.startDate || todayInputValue;

  const descriptionChars = (step4Form.description || '').trim().length;
  const isDescriptionValid = descriptionChars >= 20;
  const isStartDateValid = Boolean(step4Form.startDate) && step4Form.startDate >= todayInputValue;
  const isEndDateValid = Boolean(step4Form.endDate) && step4Form.endDate >= minEndDate;

  const step4CanProceed =
    step4Form.title.trim().length > 0 &&
    step4Form.amount !== '' &&
    step4Form.successAmount !== '' &&
    step4Form.kpi.trim().length > 0 &&
    step4Form.url.trim().length > 0 &&
    isStartDateValid &&
    isEndDateValid &&
    step4Form.description.trim().length > 0 &&
    isDescriptionValid;

  const defaultViewGigs = () => {
    window.location.href = '/vendor/gigs';
  };

  const handleViewGigsClick = () => {
    closeDrawer();
    if (onViewGigs) {
      onViewGigs();
    } else {
      defaultViewGigs();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px]"
      onClick={closeDrawer}
    >
      <div
        className="absolute left-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl rounded-r-2xl p-10 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-6 top-6 text-gray-600 hover:text-gray-600"
          onClick={closeDrawer}
          aria-label="Close create gig panel"
          type="button"
        >
          <X size={16} />
        </button>

        {createGigError ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{createGigError}</div>
        ) : null}

        {currentStep === 1 && (
          <Step1Platform
            platformOptions={platformOptions}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            handleContinueFromStep1={handleContinueFromStep1}
          />
        )}

        {currentStep === 2 && (
          <Step2Influencers
            influencerSearch={influencerSearch}
            setInfluencerSearch={setInfluencerSearch}
            fetchInfluencers={fetchInfluencers}
            handleSelectAll={handleSelectAll}
            allSelected={allSelected}
            selectedInfluencerIds={selectedInfluencerIds}
            influencers={influencers}
            isLoadingInfluencers={isLoadingInfluencers}
            toggleInfluencerSelection={toggleInfluencerSelection}
            getInitial={getInitial}
            socialIconFor={socialIconFor}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
          />
        )}

        {currentStep === 3 && (
          <Step3GigType
            gigTypeOptions={gigTypeOptions}
            selectedGigType={selectedGigType}
            setSelectedGigType={setSelectedGigType}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
          />
        )}

        {currentStep === 4 && isIqliqSalesFlow && (
          <Step5IqliqSalesSelectProduct
            officialBrandId={iqliqSalesOfficialBrandId}
            selectedProductIds={selectedSalesProductIds}
            setSelectedProductIds={setSelectedSalesProductIds}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
            progressBarClass="w-[58%]"
          />
        )}

        {currentStep === 4 && !isIqliqSalesFlow && (
          <Step4FillDetails
            step4Form={step4Form}
            setStep4Form={setStep4Form}
            gigTypeOptions={gigTypeOptions}
            selectedGigType={selectedGigType}
            todayInputValue={todayInputValue}
            minEndDate={minEndDate}
            isStartDateValid={isStartDateValid}
            isEndDateValid={isEndDateValid}
            isDescriptionValid={isDescriptionValid}
            step4CanProceed={step4CanProceed}
            step4UploadInputRef={step4UploadInputRef}
            step4ImageFile={step4ImageFile}
            setStep4ImageFile={setStep4ImageFile}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
          />
        )}

        {currentStep === 5 && isIqliqSalesFlow && (
          <Step4FillDetails
            step4Form={step4Form}
            setStep4Form={setStep4Form}
            gigTypeOptions={gigTypeOptions}
            selectedGigType={selectedGigType}
            todayInputValue={todayInputValue}
            minEndDate={minEndDate}
            isStartDateValid={isStartDateValid}
            isEndDateValid={isEndDateValid}
            isDescriptionValid={isDescriptionValid}
            step4CanProceed={step4CanProceed}
            step4UploadInputRef={step4UploadInputRef}
            step4ImageFile={step4ImageFile}
            setStep4ImageFile={setStep4ImageFile}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
            backStep={4}
            nextStep={6}
            stepNumber={5}
            progressBarClass="w-[72%]"
          />
        )}

        {currentStep === 5 && !isIqliqSalesFlow && (
          <Step5ConfirmAgreement
            step4Form={step4Form}
            selectedGigCategory={selectedGigCategory}
            platformLabel={platformLabel}
            selectedAmount={selectedAmount}
            selectedSuccessAmount={selectedSuccessAmount}
            formatMMDDYYYY={formatMMDDYYYY}
            selectedInfluencerIds={selectedInfluencerIds}
            influencers={allInfluencers}
            setBrandAgreementAccepted={setBrandAgreementAccepted}
            brandAgreementAccepted={brandAgreementAccepted}
            allAgreed={allAgreed}
            isCreatingGig={isCreatingGig}
            handleConfirmCreateGig={handleConfirmCreateGig}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
            backStep={4}
          />
        )}

        {currentStep === 6 && isIqliqSalesFlow && (
          <Step5ConfirmAgreement
            step4Form={step4Form}
            selectedGigCategory={selectedGigCategory}
            platformLabel={platformLabel}
            selectedAmount={selectedAmount}
            selectedSuccessAmount={selectedSuccessAmount}
            formatMMDDYYYY={formatMMDDYYYY}
            selectedInfluencerIds={selectedInfluencerIds}
            influencers={allInfluencers}
            setBrandAgreementAccepted={setBrandAgreementAccepted}
            brandAgreementAccepted={brandAgreementAccepted}
            allAgreed={allAgreed}
            isCreatingGig={isCreatingGig}
            handleConfirmCreateGig={handleConfirmCreateGig}
            closeCreateGigDrawer={closeDrawer}
            setCurrentStep={navigateToStep}
            backStep={5}
          />
        )}

        {currentStep === 6 && !isIqliqSalesFlow && (
          <Step6Success
            closeCreateGigDrawer={closeDrawer}
            onViewGigs={handleViewGigsClick}
          />
        )}

        {currentStep === 7 && (
          <Step6Success
            closeCreateGigDrawer={closeDrawer}
            onViewGigs={handleViewGigsClick}
          />
        )}
      </div>
    </div>
  );
}
