'use client'

const Step6Success = ({ closeCreateGigDrawer, onViewGigs }) => {
  return (
    <div className="w-full max-w-3xl mx-auto pt-8 h-full flex flex-col items-center">
      <div className="mt-2 mb-10 relative">
        <div className="h-[90px] w-[90px] rounded-full bg-[#0B82FF]/10 flex items-center justify-center">
          {/* Gear + check approximation */}
          <div className="relative flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M28.5 4.5H35.5L37.2 12.2C39.2 12.7 41.1 13.6 42.8 14.8L50.1 11.2L54.9 16L51.2 23.3C52.4 25 53.3 26.9 53.8 28.9L61.5 30.5V37.5L53.8 39.1C53.3 41.1 52.4 43 51.2 44.7L54.9 52L50.1 56.8L42.8 53.2C41.1 54.4 39.2 55.3 37.2 55.8L35.5 63.5H28.5L26.8 55.8C24.8 55.3 22.9 54.4 21.2 53.2L13.9 56.8L9.1 52L12.8 44.7C11.6 43 10.7 41.1 10.2 39.1L2.5 37.5V30.5L10.2 28.9C10.7 26.9 11.6 25 12.8 23.3L9.1 16L13.9 11.2L21.2 14.8C22.9 13.6 24.8 12.7 26.8 12.2L28.5 4.5Z"
                fill="#0B82FF"
                opacity="0.95"
              />
              <path
                d="M24 34.5L29 39.5L41 27"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-[44px] font-bold text-black leading-tight mb-6">Your gig is Created!</h2>
        <p className="text-[18px] text-black font-semibold leading-relaxed max-w-[720px] mx-auto">
          Gig Successfully Created! Congratulations! The new gig you create is now visible to potential clients.
        </p>
      </div>

      <div className="w-full flex items-center justify-between mt-auto mb-8 px-6">
        <button
          type="button"
          onClick={closeCreateGigDrawer}
          className="w-[320px] h-[52px] rounded-full border border-[#0B82FF] text-black text-[18px] font-semibold bg-white"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onViewGigs}
          className="w-[320px] h-[52px] rounded-full bg-[#A8CCF7] text-[#0B63CE] text-[18px] font-semibold"
        >
          View Gigs
        </button>
      </div>
    </div>
  )
}

export default Step6Success

