import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Clock, Sparkles } from 'lucide-react';
import { formatDateToISO, addDaysToDate } from '../../lib/dateUtils';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  title?: string;
  minDate?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'اختر التاريخ من التقويم',
  minDate
}) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const validInitialDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [currentYear, setCurrentYear] = useState<number>(validInitialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(validInitialDate.getMonth()); // 0-11
  const [tempSelected, setTempSelected] = useState<string>(selectedDate || formatDateToISO(new Date()));

  if (!isOpen) return null;

  const monthNames = [
    'يناير (1)', 'فبراير (2)', 'مارس (3)', 'أبريل (4)', 'مايو (5)', 'يونيو (6)',
    'يوليو (7)', 'أغسطس (8)', 'سبتمبر (9)', 'أكتوبر (10)', 'نوفمبر (11)', 'ديسمبر (12)'
  ];

  const daysOfWeek = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTempSelected(formatted);
  };

  const handleConfirm = () => {
    onSelectDate(tempSelected);
    onClose();
  };

  const quickPresets = [
    { label: 'اليوم', days: 0 },
    { label: '+ أسبوع', days: 7 },
    { label: '+ أسبوعين', days: 14 },
    { label: '+ شهر (30 يوم)', days: 30 },
    { label: '+ 3 أشهر', days: 90 },
    { label: 'نهاية العام', custom: `${currentYear}-12-31` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl relative text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{tempSelected || 'لم يتم الاختيار'}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const target = preset.custom || addDaysToDate(preset.days);
                setTempSelected(target);
                const d = new Date(target);
                if (!isNaN(d.getTime())) {
                  setCurrentYear(d.getFullYear());
                  setCurrentMonth(d.getMonth());
                }
              }}
              className="px-2.5 py-1 bg-slate-800/90 hover:bg-pink-600/30 hover:border-pink-500/50 text-[11px] text-slate-300 hover:text-white border border-slate-700/50 rounded-xl transition-all font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="الشهر القادم"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="font-bold text-xs text-white">{monthNames[currentMonth]} {currentYear}</span>
          </div>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="الشهر السابق"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
          {daysOfWeek.map((day, i) => (
            <div key={i} className="py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = tempSelected === dateStr;
            const isToday = formatDateToISO(new Date()) === dateStr;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={`py-2 rounded-xl font-mono text-xs transition-all flex items-center justify-center font-bold ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30 scale-105'
                    : isToday
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد التاريخ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
