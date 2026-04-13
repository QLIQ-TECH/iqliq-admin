'use client'

import { Check } from 'lucide-react'

const Step3GigType = ({
  gigTypeOptions,
  selectedGigType,
  setSelectedGigType,
  closeCreateGigDrawer,
  setCurrentStep,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4 h-full flex flex-col">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className="h-full w-[42%] bg-blue-500 rounded-full" />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-2">Step 3 : Select Gig Type</h2>
      <p className="text-[16px] text-gray-600 leading-tight mb-8">Choose the type of engagement for your gig</p>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-5">
          {gigTypeOptions.map((gigType) => {
            const isSelected = selectedGigType === gigType.id
            const Icon = gigType.icon

            return (
              <button
                key={gigType.id}
                type="button"
                onClick={() => setSelectedGigType(gigType.id)}
                className={`border rounded-[16px] p-5 min-h-[102px] text-left relative transition-colors ${
                  isSelected ? 'border-[#0082FF] bg-[#F0F7FF]' : 'border-gray-300 bg-[#f7f7f7]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-[42px] w-[42px] rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#0082FF] text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <div
                      className={`text-[16px] font-semibold max-w-[220px] leading-[1.25] ${
                        isSelected ? 'text-[#0082FF]' : 'text-gray-800'
                      }`}
                    >
                      {gigType.title}
                    </div>
                    <div className="text-[14px] text-gray-600 mt-1">{gigType.subtitle}</div>
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute top-4 right-4 h-7 w-7 rounded-full bg-[#0082FF] text-white inline-flex items-center justify-center">
                    <Check size={16} />
                  </span>
                )}
              </button>
            )
          })}
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
            onClick={() => setCurrentStep(2)}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="px-8 h-[40px] rounded-full text-xl bg-[#0082FF]/30 text-[#0082FF]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step3GigType

