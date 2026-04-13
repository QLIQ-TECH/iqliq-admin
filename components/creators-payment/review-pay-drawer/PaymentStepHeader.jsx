'use client';

export default function PaymentStepHeader({ step, title }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-sm font-bold text-white shadow-sm"
        aria-hidden
      >
        {step}
      </span>
      <h3 className="text-base font-bold text-gray-900 sm:text-[17px]">{title}</h3>
    </div>
  );
}
