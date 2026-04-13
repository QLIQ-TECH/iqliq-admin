'use client'

const Step1Platform = ({
  platformOptions,
  selectedPlatform,
  setSelectedPlatform,
  handleContinueFromStep1,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className="h-full w-[14%] bg-blue-500 rounded-full" />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-3">Step 1 : Select the Platform</h2>
      <p className="text-16px text-gray-600 leading-relaxed mb-8 max-w-5xl">
        Choose a platform to proceed. You can create gigs on one platform at a time so you can set accurate,
        platform-specific goals and manage payments individually to keep things simple and organized for you.
      </p>

      <div className="rounded-2xl max-h-[460px] overflow-y-auto pr-1">
        <div className="p-4 space-y-3">
          {platformOptions.map((platform) => {
            const Icon = platform.icon
            const isSelected = selectedPlatform === platform.id

            return (
              <button
                key={platform.id}
                type="button"
                className={`w-full rounded-2xl border px-3 py-3 flex items-center justify-between transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <div className="flex items-center gap-4">
                  <Icon size={24} className={platform.iconClass} />
                  <span className="text-xl font-semibold text-black-600">{platform.label}</span>
                </div>
                <span
                  className={`h-5 w-5 rounded-full border-2 inline-flex items-center justify-center ${
                    isSelected ? 'border-blue-400' : 'border-gray-400'
                  }`}
                >
                  {isSelected && <span className="h-3 w-3 rounded-full bg-blue-400" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          disabled={!selectedPlatform}
          onClick={handleContinueFromStep1}
          className={`px-8 py-3 rounded-full text-lg font-semibold transition-colors ${
            selectedPlatform
              ? 'bg-[#0082FF]/30 text-[#0082FF]'
              : 'bg-[#0082FF]/30 text-[#0082FF] cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default Step1Platform

