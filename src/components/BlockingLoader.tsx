import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface BlockingLoaderProps {
  message?: string;
}

export const BlockingLoader: React.FC<BlockingLoaderProps> = ({ message = 'جاري فتح المتجر السريع...' }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white overflow-hidden" dir="rtl">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 rounded-full border-t-2 border-theme-primary w-24 h-24 animate-spin opacity-60" style={{ margin: 'auto', left: 0, right: 0, top: '-40px' }} />
        <div className="absolute inset-0 rounded-full border-r-2 border-theme-secondary w-16 h-16 animate-[spin_1.5s_reverse_infinite] opacity-80" style={{ margin: 'auto', left: 0, right: 0, top: '-24px' }} />
        
        {/* Center Spinner & Countdown */}
        <div className="relative mb-8 z-10 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-theme-primary" />
          <span className="absolute text-lg font-bold text-white">{countdown}</span>
        </div>
        
        <p className="text-slate-200 mt-4 text-sm font-cairo font-bold animate-pulse">
          {message}
        </p>
        <span className="text-[11px] text-slate-300/80 mt-2 font-mono">فتح فائق السرعة (مزامنة فورية بالخلفية)</span>
      </div>
    </div>
  );
};

