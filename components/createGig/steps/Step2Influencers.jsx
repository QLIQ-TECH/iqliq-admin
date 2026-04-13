'use client'

import { ChevronDown, Search } from 'lucide-react'

const Step2Influencers = ({
  influencerSearch,
  setInfluencerSearch,
  fetchInfluencers,
  handleSelectAll,
  allSelected,
  selectedInfluencerIds,
  influencers,
  isLoadingInfluencers,
  toggleInfluencerSelection,
  getInitial,
  socialIconFor,
  closeCreateGigDrawer,
  setCurrentStep,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4 h-full flex flex-col">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className="h-full w-[14%] bg-blue-500 rounded-full" />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-6">Step 2 : Select the Influencers</h2>
      <p className="text-[16px] text-gray-600 leading-tight mb-8">
        Pick influencers based on platforms. You can also create and use lists for quicker selection.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            value={influencerSearch}
            onChange={(e) => setInfluencerSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-[48px] rounded-2xl bg-gray-100 px-6 pr-16 text-xl text-gray-600 outline-none border border-transparent focus:border-gray-300"
          />
          <button
            type="button"
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-800"
            onClick={fetchInfluencers}
            aria-label="Search influencers"
          >
            <Search size={24} />
          </button>
        </div>

        <button
          type="button"
          className="h-[48px] min-w-[140px] rounded-2xl border border-gray-400 px-6 text-xl text-gray-500 flex items-center justify-between gap-3"
        >
          <span>Select Lists</span>
          <ChevronDown size={24} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="flex items-center gap-4 text-[16px] font-semibold text-black w-fit"
          onClick={handleSelectAll}
        >
          <span
            className={`h-5 w-5 rounded-full border-2 inline-flex items-center justify-center ${
              allSelected ? 'border-blue-500' : 'border-black'
            }`}
          >
            {allSelected && <span className="h-3 w-3 rounded-full bg-blue-500" />}
          </span>
          Select All
        </button>
        <span className="text-[14px] text-gray-500 font-medium">
          {selectedInfluencerIds.length} influencer selected out of {influencers.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoadingInfluencers ? (
          <div className="text-2xl text-gray-500 py-6">Loading influencers...</div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {influencers.map((influencer) => {
              const isSelected = selectedInfluencerIds.includes(influencer.id)

              return (
                <button
                  key={influencer.id}
                  type="button"
                  onClick={() => toggleInfluencerSelection(influencer.id)}
                  className="border border-gray-300 rounded-[22px] bg-[#f7f7f7] p-5 min-h-[80px] text-left relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-[24px] w-[24px] rounded-full bg-blue-600 text-white text-xl flex items-center justify-center overflow-hidden">
                      {influencer.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={influencer.profilePicture}
                          alt={influencer.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{getInitial(influencer.name)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {influencer.activeSocialMedia.map((platform) => (
                        <span key={`${influencer.id}-${platform}`} className="inline-flex">
                          {socialIconFor(platform)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[16px] font-600 text-black">{influencer.name}</div>
                    <span
                      className={`h-5 w-5 shrink-0 rounded-full border-2 inline-flex items-center justify-center ${
                        isSelected ? 'border-blue-500' : 'border-black'
                      }`}
                    >
                      {isSelected && <span className="h-3 w-3 rounded-full bg-blue-500" />}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
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
            onClick={() => setCurrentStep(1)}
          >
            Back
          </button>
          <button
            type="button"
            disabled={selectedInfluencerIds.length === 0}
            onClick={() => setCurrentStep(3)}
            className={`px-8 h-[40px] rounded-full text-xl ${
              selectedInfluencerIds.length > 0
                ? 'bg-[#0082FF]/30 text-[#0082FF]'
                : 'bg-[#0082FF]/30 text-[#0082FF] cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step2Influencers

