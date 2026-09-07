import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../../lib/imageUtils';

interface ImageLightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  images = [],
  initialIndex = 0,
  title = 'عرض الصورة الكاملة',
  onClose
}) => {
  const validImages = images.length > 0 
    ? images.map(img => img ? img.trim() : '').filter(Boolean)
    : [DEFAULT_PRODUCT_IMAGE];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Keyboard navigation & ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validImages.length, onClose, isOpen]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
    resetTransform();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    resetTransform();
  };

  const resetTransform = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Mouse Drag / Pan when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const currentImage = validImages[currentIndex] || DEFAULT_PRODUCT_IMAGE;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Controls Header Bar */}
      <div 
        className="flex items-center justify-between text-white z-20 bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{title}</span>
          {validImages.length > 1 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono text-amber-300">
              {currentIndex + 1} / {validImages.length}
            </span>
          )}
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleRotate}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="تدوير"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={resetTransform}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="إعادة ضبط الأحجام"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 transition-colors text-white cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden my-2 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Previous Image Arrow */}
        {validImages.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-theme-primary text-white border border-white/20 backdrop-blur-md transition-all z-20 cursor-pointer shadow-2xl"
            title="الصورة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Scalable & Zoomable Image */}
        <div 
          className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-[82vh]"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={currentImage}
            alt={title}
            onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
          />
        </div>

        {/* Next Image Arrow */}
        {validImages.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-theme-primary text-white border border-white/20 backdrop-blur-md transition-all z-20 cursor-pointer shadow-2xl"
            title="الصورة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {validImages.length > 1 && (
        <div 
          className="flex items-center justify-center gap-2 pt-2 bg-black/50 backdrop-blur-md p-2 rounded-2xl border border-white/10 z-20 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {validImages.map((img, idx) => {
            const isSelected = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  resetTransform();
                }}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'border-theme-primary scale-105 shadow-lg shadow-theme-primary/50' 
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`مصغرة ${idx + 1}`}
                  onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
