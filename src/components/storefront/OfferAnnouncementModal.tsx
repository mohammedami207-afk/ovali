import React, { useEffect } from 'react';
import { X, Gift, CheckCircle2 } from 'lucide-react';
import { Offer } from '../../types';

interface OfferAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: Offer[];
}

export const OfferAnnouncementModal: React.FC<OfferAnnouncementModalProps> = ({ isOpen, onClose, offers }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeOffers = offers.filter(o => o.status === 'active' && (!o.endDate || new Date(o.endDate) >= new Date()));

  if (activeOffers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div 
        className="bg-theme-card border border-theme-card text-theme-main rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-theme-inner hover:bg-theme-card text-theme-subtext hover:text-theme-main rounded-full transition-colors z-10 border border-theme-card cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center border-b border-theme-card">
          <div className="mx-auto mb-4 text-theme-primary flex justify-center">
            <Gift className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-theme-main font-cairo">عرض خاص لك</h2>
          <p className="text-theme-subtext mt-2 text-sm font-cairo">اغتنم الفرصة الآن وتسوق من أفضل تشكيلاتنا</p>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {activeOffers.map(offer => (
            <div key={offer.OfferID} className="bg-theme-inner border border-theme-card rounded-2xl p-4 flex gap-3 items-center shadow-sm">
              <div className="bg-theme-primary/10 p-2 rounded-full shrink-0">
                <CheckCircle2 className="w-5 h-5 text-theme-primary" />
              </div>
              <div>
                <h4 className="font-bold text-theme-main text-sm">{offer.title}</h4>
                {offer.discountPercentage > 0 && (
                  <p className="text-xs text-theme-subtext mt-1 font-cairo">
                    خصم إضافي بقيمة {offer.discountPercentage}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-theme-inner border-t border-theme-card">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-theme-gradient text-white font-bold rounded-xl transition-all font-cairo text-sm cursor-pointer shadow-theme-primary"
          >
            موافق، ابدأ التسوق
          </button>
        </div>
      </div>
    </div>
  );
};
