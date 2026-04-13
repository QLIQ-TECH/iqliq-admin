'use client'

const Step5ConfirmAgreement = ({
  step4Form,
  selectedGigCategory,
  platformLabel,
  selectedAmount,
  selectedSuccessAmount,
  formatMMDDYYYY,
  selectedInfluencerIds,
  influencers,
  setBrandAgreementAccepted,
  brandAgreementAccepted,
  allAgreed,
  isCreatingGig,
  handleConfirmCreateGig,
  closeCreateGigDrawer,
  setCurrentStep,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4 h-full flex flex-col">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className="h-full w-[90%] bg-blue-500 rounded-full" />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-8">Confirm Details &amp; Agreement</h2>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="mb-6">
          <div className="text-[20px] font-semibold text-gray-900 mb-4">Gig Details</div>
          <div className="bg-white border border-gray-200 rounded-[14px] p-8 max-h-[420px] overflow-y-auto pr-3">
            <div className="grid grid-cols-3 gap-x-16 gap-y-8">
              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">Gig Title</div>
                <div className="text-[16px] font-semibold text-black">{step4Form.title}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">Category</div>
                <div className="text-[16px] font-semibold text-black whitespace-pre-line">{selectedGigCategory}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">Platform</div>
                <div className="text-[16px] font-semibold text-black">{platformLabel}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-">Gig Amount</div>
                <div className="text-[16px] font-semibold text-black">{selectedAmount}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">Success Fee</div>
                <div className="text-[16px] font-semibold text-black">{selectedSuccessAmount}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">Start Date</div>
                <div className="text-[16px] font-semibold text-black">{formatMMDDYYYY(step4Form.startDate)}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">End Date</div>
                <div className="text-[16px] font-semibold text-black">{formatMMDDYYYY(step4Form.endDate)}</div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">KPI&apos;s</div>
                <div className="text-[16px] font-semibold text-black">
                  {step4Form.kpi} {selectedGigCategory}
                </div>
              </div>

              <div>
                <div className="text-[16px] font-medium text-gray-500 mb-1">URL</div>
                <div className="text-[16px] font-semibold text-black break-words">{step4Form.url}</div>
              </div>

              <div className="col-span-3">
                <div className="text-[16px] font-medium text-gray-500 mb-1">Description</div>
                <div className="text-[16px] font-semibold text-black">{step4Form.description}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[14px] p-8">
          <div className="grid grid-cols-3 text-[16px] text-gray-600 font-medium mb-4">
            <div>Name</div>
            <div className="text-center">Gig Amount</div>
            <div className="text-right">Success Fee</div>
          </div>

          <div className="space-y-7">
            {selectedInfluencerIds.map((influencerId) => {
              const influencer = influencers.find((x) => x.id === influencerId)
              const name = influencer?.name || 'Unknown'

              return (
                <div key={influencerId}>
                  <div className="grid grid-cols-3 items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-[16px] font-semibold text-black">{name}</div>
                    </div>
                    <div className="text-center text-[16px] font-semibold text-black">{selectedAmount}</div>
                    <div className="text-right text-[16px] font-semibold text-black">{selectedSuccessAmount}</div>
                  </div>
                </div>
              )
            })}

            <div className="flex items-start gap-4 mt-1">
              <button
                type="button"
                onClick={() => setBrandAgreementAccepted((prev) => !prev)}
                className={`mt-1 h-5 w-5 rounded-full border-2 inline-flex items-center justify-center ${
                  brandAgreementAccepted ? 'border-[#0082FF]' : 'border-black'
                }`}
                aria-label="Accept brand agreement"
              >
                {brandAgreementAccepted && <span className="h-3 w-3 rounded-full bg-[#0082FF]" />}
              </button>
              <div className="text-[16px] text-[#0082FF]">
                , on behalf of the brand, have reviewed the details and agree to the terms and conditions outlined above.
              </div>
            </div>
          </div>
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
            onClick={() => setCurrentStep(4)}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!allAgreed || isCreatingGig}
            className={`px-8 h-[40px] rounded-full text-xl ${
              allAgreed ? 'bg-[#0082FF]/30 text-[#0082FF]' : 'bg-[#0082FF]/30 text-[#0082FF] cursor-not-allowed'
            }`}
            onClick={handleConfirmCreateGig}
          >
            {isCreatingGig ? 'Creating...' : 'Confirm and Create Gig'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step5ConfirmAgreement

