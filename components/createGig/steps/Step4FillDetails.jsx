'use client'

import { Check, ChevronDown, Info } from 'lucide-react'

const Step4FillDetails = ({
  step4Form,
  setStep4Form,
  gigTypeOptions,
  selectedGigType,
  todayInputValue,
  minEndDate,
  isStartDateValid,
  isEndDateValid,
  isDescriptionValid,
  step4CanProceed,
  step4UploadInputRef,
  step4ImageFile,
  setStep4ImageFile,
  closeCreateGigDrawer,
  setCurrentStep,
  backStep = 3,
  nextStep = 5,
  stepNumber = 4,
  progressBarClass = 'w-[72%]',
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4 h-full flex flex-col">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className={`h-full ${progressBarClass} bg-blue-500 rounded-full`} />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-8">
        Step {stepNumber} : Fill the Details
      </h2>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-[16px] font-semibold text-gray-800 block mb-1">
              Gig Title <span className="text-red-500">*</span>
            </label>
            <input
              value={step4Form.title}
              onChange={(e) => setStep4Form((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Gig title"
              className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
            />
            {!step4Form.title && <p className="text-red-500 text-[14px] mt-1">Gig title is required</p>}
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 block mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-4 w-4 rounded-full bg-[#6CB7F4] inline-flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" />
                </span>
                <span className="truncate">
                  {gigTypeOptions.find((item) => item.id === selectedGigType)?.title || ''}
                </span>
              </div>
              <ChevronDown size={18} className="text-gray-400 shrink-0" />
            </div>
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
              Gig Amount <span className="text-red-500">*</span>
              <Info size={14} className="text-[#2896DB]" />
            </label>
            <input
              type="number"
              value={step4Form.amount}
              onChange={(e) => setStep4Form((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="$ 0"
              className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
            />
            {!step4Form.amount && <p className="text-red-500 text-[14px] mt-1">Gig amount is required</p>}
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
              Success Amount <span className="text-red-500">*</span>
              <Info size={14} className="text-[#2896DB]" />
            </label>
            <input
              type="number"
              value={step4Form.successAmount}
              onChange={(e) => setStep4Form((prev) => ({ ...prev, successAmount: e.target.value }))}
              placeholder="$ 0"
              className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
            />
            {!step4Form.successAmount && (
              <p className="text-red-500 text-[14px] mt-1">Success amount is required</p>
            )}
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
              KPI&apos;s <span className="text-red-500">*</span>
              <Info size={14} className="text-[#2896DB]" />
            </label>
            <input
              value={step4Form.kpi}
              onChange={(e) => setStep4Form((prev) => ({ ...prev, kpi: e.target.value }))}
              placeholder={`Enter How much ${
                gigTypeOptions.find((item) => item.id === selectedGigType)?.title || ''
              }`}
              className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
            />
            {!step4Form.kpi && <p className="text-red-500 text-[14px] mt-1">Kpi&apos;s is required</p>}
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
              Url <span className="text-red-500">*</span>
              <Info size={14} className="text-[#2896DB]" />
            </label>
            <input
              value={step4Form.url}
              onChange={(e) => setStep4Form((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="website/producturl"
              className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
            />
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 block mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={step4Form.startDate}
                onChange={(e) => setStep4Form((prev) => ({ ...prev, startDate: e.target.value }))}
                min={todayInputValue}
                className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
              />
            </div>
            {!step4Form.startDate && <p className="text-red-500 text-[14px] mt-1">Start Date is required</p>}
            {step4Form.startDate && !isStartDateValid && (
              <p className="text-red-500 text-[14px] mt-1">Start Date must be today or later</p>
            )}
          </div>

          <div>
            <label className="text-[16px] font-semibold text-gray-800 block mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={step4Form.endDate}
                onChange={(e) => setStep4Form((prev) => ({ ...prev, endDate: e.target.value }))}
                min={minEndDate}
                className="w-full h-[48px] rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 text-[16px] outline-none"
              />
            </div>
            {!step4Form.endDate && <p className="text-red-500 text-[14px] mt-1">End Date is required</p>}
            {step4Form.endDate && !isEndDateValid && (
              <p className="text-red-500 text-[14px] mt-1">End Date must be today or later</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-[16px] font-semibold text-gray-800 block mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={step4Form.description}
            onChange={(e) => setStep4Form((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Description"
            className="w-full rounded-[10px] border border-[#0082FF] bg-[#f7f7f7] px-4 py-3 text-[16px] outline-none resize-none"
          />
          {!step4Form.description && <p className="text-red-500 text-[14px] mt-1">Description is required</p>}
          {!!step4Form.description && !isDescriptionValid && (
            <p className="text-red-500 text-[14px] mt-1">Description must be at least 20 characters</p>
          )}
        </div>

        <div className="mt-5 mb-3">
          <label className="text-[16px] font-semibold text-gray-800 block mb-1">File Upload</label>
          <input
            ref={step4UploadInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null
              setStep4ImageFile(file)
            }}
          />
          <button
            type="button"
            className="w-full h-[64px] rounded-[12px] border border-dashed border-gray-400 bg-[#f7f7f7] text-gray-600 text-[14px]"
            onClick={() => step4UploadInputRef.current?.click()}
          >
            Click to upload. Only 1 file allowed.
          </button>

          {step4ImageFile && (
            <div className="mt-3 border border-gray-200 rounded-[10px] bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-[16px] text-gray-900 font-medium truncate max-w-[70%]">
                  {step4ImageFile.name}
                </div>
                <button
                  type="button"
                  className="h-[40px] w-[40px] rounded-[10px] border border-gray-400 bg-white inline-flex items-center justify-center"
                  aria-label="Remove selected file"
                  onClick={() => {
                    setStep4ImageFile(null)
                    if (step4UploadInputRef.current) {
                      step4UploadInputRef.current.value = ''
                    }
                  }}
                >
                  {/* Simple trash icon using SVG to avoid extra lucide imports */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 3V4H4V6H5V21H19V6H20V4H15V3H9Z"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 10V17"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 10V17"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 10V17"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-gray-200 flex items-center justify-between">
        <button
          type="button"
          className="px-6 h-[40px] rounded-full border border-[#0082FF] text-xl text-black bg-white"
          onClick={closeCreateGigDrawer}
        >
          Cancel
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-8 h-[40px] rounded-full border border-[#0082FF] text-xl text-black bg-white"
            onClick={() => setCurrentStep(backStep)}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!step4CanProceed}
            className={`px-8 h-[40px] rounded-full text-xl ${
              step4CanProceed
                ? 'bg-[#0082FF]/30 text-[#0082FF]'
                : 'bg-[#0082FF]/30 text-[#0082FF] cursor-not-allowed'
            }`}
            onClick={() => setCurrentStep(nextStep)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step4FillDetails

