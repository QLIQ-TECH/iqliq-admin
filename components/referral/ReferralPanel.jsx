'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Link2, QrCode } from 'lucide-react';

function safeCopy(text) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Copied'))
    .catch(() => toast.error('Copy failed'));
}

async function shareLink(url) {
  const shareData = {
    title: 'Join me on IQliqlive',
    text: 'Join me on IQliqlive',
    url,
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function shareQr(qrDataUrl, url) {
  if (!qrDataUrl) return false;
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;

  try {
    const blob = await fetch(qrDataUrl).then((r) => r.blob());
    const file = new File([blob], 'iqliq-referral-qr.png', { type: blob.type || 'image/png' });

    if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
      return false;
    }

    await navigator.share({
      title: 'Join me on IQliqlive',
      text: 'Join me on IQliqlive',
      url,
      files: [file],
    });
    return true;
  } catch {
    return false;
  }
}

export default function ReferralPanel({
  referralCode,
  referralUrl,
  loading = false,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  const qrText = useMemo(() => referralUrl || referralCode || '', [referralUrl, referralCode]);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        if (!qrText) {
          if (!cancelled) setQrDataUrl('');
          return;
        }
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(qrText, {
          margin: 1,
          scale: 8,
          errorCorrectionLevel: 'M',
          color: { dark: '#0b2a62', light: '#ffffff' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl('');
      }
    }
    generate();
    return () => {
      cancelled = true;
    };
  }, [qrText]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qliq-referral-qr.png';
    a.click();
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl bg-[#167BFF] p-6 sm:p-8 text-white shadow-[0_18px_45px_rgba(22,123,255,0.22)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="w-full sm:w-[170px]">
            <div className="rounded-2xl bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.14)] w-fit">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Referral QR"
                  className="h-[122px] w-[122px] rounded-lg"
                />
              ) : (
                <div className="h-[122px] w-[122px] rounded-lg bg-gray-100 flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.01em]">
                Instant access
              </h2>
            </div>
            <p className="mt-2 text-white/80 text-sm sm:text-[15px] leading-relaxed max-w-[520px]">
              Let your friends scan this QR to land directly on your referral link.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-sm text-white/75 font-semibold">Your referral code</div>
          <div className="mt-3 rounded-2xl bg-white/14 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 min-w-0">
              <div className="text-2xl font-semibold tracking-[0.02em]">
                {loading ? (
                  <span className="inline-block h-8 w-[140px] rounded-lg bg-white/20 animate-pulse" />
                ) : (
                  referralCode || '-'
                )}
              </div>
              <div className="text-sm text-white/75 hidden sm:block">
                Tap to copy &amp; paste anywhere
              </div>
            </div>
            <button
              type="button"
              onClick={() => safeCopy(referralCode)}
              disabled={!referralCode || loading}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 hover:bg-white/18 active:bg-white/22 transition"
              aria-label="Copy referral code"
            >
              <Copy className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="text-lg font-semibold text-gray-900">Share with your friends</div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={async () => {
              if (!referralUrl) return;
              const ok = await shareLink(referralUrl);
              if (!ok) safeCopy(referralUrl);
            }}
            disabled={!referralUrl || loading}
            className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Link2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Share link</div>
                <div className="text-sm text-gray-500 mt-0.5">Send referral URL</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!qrDataUrl) return;
              const ok = await shareQr(qrDataUrl, referralUrl);
              if (ok) return;
              downloadQr();
              if (referralUrl) safeCopy(referralUrl);
            }}
            disabled={!qrDataUrl || loading}
            className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Share QR</div>
                <div className="text-sm text-gray-500 mt-0.5">Send QR image</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Pro tip: Add your QR to stories, reels or posters so people can join with one scan.
        </div>
      </div>
    </div>
  );
}

