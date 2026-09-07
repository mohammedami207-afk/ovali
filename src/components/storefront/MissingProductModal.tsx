import React from 'react';
import { AlertTriangle, ArrowLeft, Sparkles, X } from 'lucide-react';

interface MissingProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseCatalog?: () => void;
}

export const MissingProductModal: React.FC<MissingProductModalProps> = ({
  isOpen,
  onClose,
  onBrowseCatalog
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 dir-rtl animate-in fade-in">
      <div className="bg-theme-card border border-amber-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-center text-theme-main">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-theme-inner hover:bg-theme-card text-theme-subtext hover:text-theme-main transition-colors border border-theme-card cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-3xl flex items-center justify-center shadow-lg animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-black text-theme-main">عذراً، هذا المنتج غير متوفر أو تم بيعه!</h3>
          <p className="text-xs text-theme-subtext leading-relaxed max-w-xs mx-auto">
            يبدو أن المنتج الذي نقرت عليه تم حذفه أو تم نفاذ كميته وبيعه مؤخراً. جرى توجيهك تلقائياً إلى الواجهة الرئيسية للمتجر لتصفح التشكيلات الجديدة والمماثلة.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              onClose();
              if (onBrowseCatalog) onBrowseCatalog();
            }}
            className="w-full py-3 bg-theme-gradient hover:opacity-90 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-theme-primary flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>تصفح أحدث الفساتين والمنتجات المتوفرة</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-theme-inner hover:bg-theme-card text-theme-main font-bold text-xs rounded-2xl transition-colors border border-theme-card cursor-pointer"
          >
            البقاء في الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
