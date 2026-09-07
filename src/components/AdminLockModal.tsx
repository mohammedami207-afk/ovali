import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, ShieldCheck, UserCheck, Truck, ShoppingBag, Sparkles } from 'lucide-react';
import { Employee } from '../types';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'SuperAdmin' | 'Manager' | 'Supplier' | 'Customer', loggedInName?: string) => void;
  requiredPin?: string;
  employees?: Employee[];
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requiredPin = '2003',
  employees = []
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();

    if (!trimmed) {
      setError(true);
      setErrorMessage('يرجى إدخال كلمة السر أولاً.');
      return;
    }

    // 1. Check against Employees list first if available
    if (employees && employees.length > 0) {
      const foundEmp = employees.find(
        (emp) => emp.passwordHash === trimmed || emp.username.toLowerCase() === trimmed.toLowerCase() || emp.EmployeeID === trimmed
      );
      if (foundEmp) {
        setError(false);
        setPin('');
        let mappedRole: 'SuperAdmin' | 'Manager' | 'Supplier' | 'Customer' = 'Manager';
        if (foundEmp.role === 'SuperAdmin' || foundEmp.role === 'Admin') mappedRole = 'SuperAdmin';
        else if (foundEmp.role === 'Supplier' || foundEmp.role === 'StockKeeper') mappedRole = 'Supplier';
        else mappedRole = 'Manager';

        onSuccess(mappedRole, foundEmp.name);
        return;
      }
    }

    // 2. Check predefined role passwords
    if (trimmed === requiredPin || trimmed === '2003' || trimmed.toLowerCase() === 'admin') {
      setError(false);
      setPin('');
      onSuccess('SuperAdmin', 'المدير العام');
    } else if (trimmed === '1234' || trimmed.toLowerCase() === 'manager') {
      setError(false);
      setPin('');
      onSuccess('Manager', 'مدير المتجر');
    } else if (trimmed === '5555' || trimmed.toLowerCase() === 'supplier') {
      setError(false);
      setPin('');
      onSuccess('Supplier', 'مورد جديد');
    } else if (trimmed === '0000' || trimmed.toLowerCase() === 'customer') {
      setError(false);
      setPin('');
      onSuccess('Customer', 'عميل المتجر');
    } else {
      setError(true);
      setErrorMessage('كلمة السر غير صحيحة! يرجى التأكد وإعادة المحاولة.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-theme-card border border-theme-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right text-theme-main">
        
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-theme-subtext hover:text-theme-main p-2 rounded-xl bg-theme-inner hover:bg-theme-card transition-colors cursor-pointer border border-theme-card"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="p-4 bg-theme-primary/10 border border-theme-primary/20 text-theme-primary rounded-2xl shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-theme-main font-cairo">تسجيل الدخول للوحة التحكم</h2>
          <p className="text-xs text-theme-subtext leading-relaxed font-cairo">
            أدخل كلمة السر الخاصة بك وسيتم توجيهك وتحديد الصلاحيات تلقائياً (مدير / مورد / عميل)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-theme-subtext">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={pin || ""}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="أدخل كلمة المرور"
              className={`w-full pr-10 pl-4 py-3.5 bg-theme-inner border ${
                error ? 'border-pink-500 text-pink-500' : 'border-theme-card text-theme-main focus:border-theme-primary'
              } rounded-2xl text-center text-lg font-mono font-bold tracking-widest outline-none transition-all placeholder:text-theme-subtext placeholder:text-xs placeholder:font-sans placeholder:tracking-normal`}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-pink-500 text-xs justify-center bg-pink-500/10 p-2.5 rounded-xl border border-pink-500/20 font-cairo">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3.5 bg-theme-gradient hover:opacity-90 text-white font-bold text-sm rounded-2xl shadow-lg transition-all cursor-pointer font-cairo"
            >
              تحقق وتأكيد الدخول
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3.5 bg-theme-inner hover:bg-theme-card text-theme-main font-bold text-sm rounded-2xl border border-theme-card transition-all cursor-pointer font-cairo"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

