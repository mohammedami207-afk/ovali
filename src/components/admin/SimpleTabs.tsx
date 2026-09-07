import React, { useState, useRef, useMemo } from 'react';
import { Customer, Supplier, Employee, Offer, Coupon, AuditLog, AppSettings, Order } from '../../types';
import { 
  Plus, Tag, Trash2, Edit, Search, UserCheck, Truck, Flame, ShieldAlert, 
  Check, X, Calendar, Filter, RotateCcw, AlertTriangle, Sparkles, CheckCircle2,
  Users, Receipt, History, Copy, Eye, Clock, RefreshCw, Download, Upload, FileSpreadsheet,
  BarChart2, TrendingUp, Award, Zap, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { formatCleanDate, formatRelativeTime } from '../../lib/dateUtils';
import { DatePickerModal } from '../ui/DatePickerModal';
import { exportSuppliersToExcel, parseSuppliersExcel } from '../../lib/excelHelper';

/**
 * 🏷️ Reusable Reliable ID Badge with 1-Click Copy Functionality
 */
export const IdBadge: React.FC<{
  id: string;
  label?: string;
  color?: 'indigo' | 'pink' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  tooltip?: string;
}> = ({
  id,
  label,
  color = 'indigo',
  tooltip = 'انقر لنسخ المعرف والبحث عنه في الإكسل'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const colorStyles: Record<string, string> = {
    indigo: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300 hover:border-indigo-400 hover:text-white',
    pink: 'bg-pink-950/80 border-pink-700/60 text-pink-300 hover:border-pink-400 hover:text-white',
    emerald: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 hover:border-emerald-400 hover:text-white',
    amber: 'bg-amber-950/80 border-amber-700/60 text-amber-300 hover:border-amber-400 hover:text-white',
    blue: 'bg-blue-950/80 border-blue-700/60 text-blue-300 hover:border-blue-400 hover:text-white',
    purple: 'bg-purple-950/80 border-purple-700/60 text-purple-300 hover:border-purple-400 hover:text-white',
    slate: 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={tooltip}
      className={`group/id inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer shadow-xs ${colorStyles[color] || colorStyles.indigo}`}
    >
      {label && <span className="text-[10px] text-slate-400 font-sans font-normal">{label}:</span>}
      <span className="tracking-wider">{id}</span>
      {copied ? (
        <span className="text-[9px] text-emerald-400 font-sans font-bold flex items-center gap-0.5">
          <Check className="w-2.5 h-2.5" /> تم النسخ
        </span>
      ) : (
        <Copy className="w-3 h-3 opacity-60 group-hover/id:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
};

// =========================================================================
// 1. Customers List Tab (إدارة العملاء ونقاط الولاء)
// =========================================================================
export const CustomersTab: React.FC<{ 
  customers: Customer[];
  onAddCustomer?: (c: Customer) => void;
  onUpdateCustomer?: (c: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
}> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [customId, setCustomId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | string>(0);
  const [balance, setBalance] = useState<number | string>(0);

  const uniqueCities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));

  const openAddModal = () => {
    setEditingCustomer(null);
    const nextNum = (customers.length + 101).toString();
    setCustomId(`CST-${nextNum}`);
    setName('');
    setPhone('');
    setEmail('');
    setCity('الرياض');
    setAddress('');
    setTaxNumber('');
    setLoyaltyPoints(0);
    setBalance(0);
    setShowFormModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCustomId(c.CustomerID);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setCity(c.city || '');
    setAddress(c.address || '');
    setTaxNumber(c.taxNumber || '');
    setLoyaltyPoints(c.loyaltyPoints || 0);
    setBalance(c.balance || 0);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalId = (customId.trim() || `CST-${Date.now().toString().slice(-4)}`).toUpperCase();

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        CustomerID: finalId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        address: address.trim(),
        taxNumber: taxNumber.trim(),
        loyaltyPoints: Number(loyaltyPoints) || 0,
        balance: Number(balance) || 0
      };
      if (onUpdateCustomer) onUpdateCustomer(updated);
    } else {
      const newCust: Customer = {
        CustomerID: finalId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        address: address.trim(),
        taxNumber: taxNumber.trim(),
        loyaltyPoints: Number(loyaltyPoints) || 0,
        balance: Number(balance) || 0
      };
      if (onAddCustomer) onAddCustomer(newCust);
    }

    setShowFormModal(false);
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      (c.CustomerID && c.CustomerID.toLowerCase().includes(q)) ||
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) || 
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.taxNumber && c.taxNumber.includes(q));
    const matchesCity = cityFilter === 'all' || c.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const totalPoints = customers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header with Title & Summary Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">إدارة العملاء ونقاط الولاء</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">تصفح وإضافة وتعديل بيانات العملاء مع معرفات (ID) موثوقة للبحث في الإكسل</p>
        </div>

        {/* Counter Badges & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي العملاء:</span>
            <span className="font-extrabold text-indigo-300 font-mono">{customers.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-pink-500/15 border border-pink-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">نقاط الولاء:</span>
            <span className="font-extrabold text-pink-300 font-mono">{totalPoints} نقطة</span>
          </div>
          {onAddCustomer && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 shrink-0 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بمعرف العميل (ID)، الاسم، رقم الهاتف، أو الرقم الضريبي..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        {uniqueCities.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={cityFilter || ""}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كل المدن ({uniqueCities.length})</option>
              {uniqueCities.map(cityItem => (
                <option key={cityItem} value={cityItem}>{cityItem}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Form Modal for Add / Edit Customer */}
      {showFormModal && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد للنظام'}</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowFormModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">
                معرف العميل في الإكسل (CustomerID):
              </label>
              <input
                type="text"
                required
                value={customId || ""}
                onChange={(e) => setCustomId(e.target.value.toUpperCase())}
                placeholder="مثال: CST-101"
                className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-400 uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم العميل:</label>
              <input
                type="text"
                required
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سارة أحمد المنصور"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">رقم الهاتف/الجوال:</label>
              <input
                type="text"
                required
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0501234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">البريد الإلكتروني:</label>
              <input
                type="email"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">المدينة:</label>
              <input
                type="text"
                value={city || ""}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: الرياض"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">العنوان والتوصيل:</label>
              <input
                type="text"
                value={address || ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: حي العليا - شارع الملك فهد"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">الرقم الضريبي (اختياري):</label>
              <input
                type="text"
                value={taxNumber || ""}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="300000000000003"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">نقاط الولاء:</label>
              <input
                type="number"
                min="0"
                value={loyaltyPoints ?? ""}
                onChange={(e) => setLoyaltyPoints(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-pink-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingCustomer ? 'تحديث وحفظ العميل' : 'حفظ العميل وإضافته'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Table with Explicit ID column as Column 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[700px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">معرف العميل (ID)</th>
              <th className="p-3.5">اسم العميل</th>
              <th className="p-3.5">رقم الهاتف</th>
              <th className="p-3.5">المدينة والبريد</th>
              <th className="p-3.5">الرقم الضريبي</th>
              <th className="p-3.5">نقاط الولاء</th>
              <th className="p-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                  لا يوجد عملاء يطابقون معايير البحث
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.CustomerID} className="hover:bg-slate-800/40 transition-colors">
                  {/* Column 1: Reliable Customer ID with 1-Click Copy */}
                  <td className="p-3.5">
                    <IdBadge id={c.CustomerID} color="indigo" tooltip="انقر لنسخ كود العميل والبحث عنه في شيت العملاء" />
                  </td>
                  <td className="p-3.5 font-bold text-white">{c.name}</td>
                  <td className="p-3.5 font-mono text-slate-300">{c.phone}</td>
                  <td className="p-3.5 text-slate-400">{c.city ? `${c.city} - ` : ''}{c.email || '-'}</td>
                  <td className="p-3.5 font-mono text-slate-400">{c.taxNumber || '-'}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                      {c.loyaltyPoints || 0} نقطة
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl transition-colors cursor-pointer"
                        title="تعديل بيانات العميل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onDeleteCustomer && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف العميل "${c.name}" برمز (${c.CustomerID})؟`)) {
                              onDeleteCustomer(c.CustomerID);
                            }
                          }}
                          className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 2. Suppliers Tab (الموردون والحسابات)
// =========================================================================
export const SuppliersTab: React.FC<{ 
  suppliers: Supplier[];
  onAddSupplier?: (s: Supplier) => void;
  onUpdateSupplier?: (s: Supplier) => void;
  onDeleteSupplier?: (id: string) => void;
  onBulkAddSuppliers?: (suppliers: Supplier[]) => void;
}> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onBulkAddSuppliers }) => {
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_balance' | 'zero_balance'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState<number | string>(0);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await parseSuppliersExcel(file);
      if (imported.length > 0) {
        if (onBulkAddSuppliers) {
          onBulkAddSuppliers(imported);
        } else if (onAddSupplier) {
          imported.forEach(s => onAddSupplier(s));
        }
      }
    } catch (err: any) {
      console.error('Error importing suppliers from excel:', err);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    const nextNum = (suppliers.length + 101).toString();
    setSupplierId(`SUP-${nextNum}`);
    setName('');
    setPhone('');
    setEmail('');
    setBalance(0);
    setShowFormModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierId(sup.SupplierID);
    setName(sup.name);
    setPhone(sup.phone);
    setEmail(sup.email);
    setBalance(sup.balance);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalId = (supplierId.trim() || `SUP-${Date.now().toString().slice(-4)}`).toUpperCase();

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        SupplierID: finalId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        balance: Number(balance) || 0
      };
      if (onUpdateSupplier) onUpdateSupplier(updated);
    } else {
      const newSup: Supplier = {
        SupplierID: finalId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        balance: Number(balance) || 0
      };
      if (onAddSupplier) onAddSupplier(newSup);
    }

    setShowFormModal(false);
  };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      (s.SupplierID && s.SupplierID.toLowerCase().includes(q)) ||
      s.name.toLowerCase().includes(q) || 
      s.phone.includes(q) || 
      s.email.toLowerCase().includes(q);
    
    const matchesBalance = 
      balanceFilter === 'all' ||
      (balanceFilter === 'has_balance' && s.balance > 0) ||
      (balanceFilter === 'zero_balance' && s.balance <= 0);

    return matchesSearch && matchesBalance;
  });

  const totalBalance = suppliers.reduce((acc, s) => acc + (Number(s.balance) || 0), 0);

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header with Title & Summary Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">إدارة الموردين والحسابات</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">إضافة وتعديل الموردين مع معرفات (ID) موثوقة للبحث والحذف والتعديل المباشر في الإكسل</p>
        </div>

        {/* Counter Badges & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي الموردين:</span>
            <span className="font-extrabold text-indigo-300 font-mono">{suppliers.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي المستحقات:</span>
            <span className="font-extrabold text-emerald-300 font-mono">{(Number(totalBalance) || 0).toFixed(2)} ر.س</span>
          </div>
          
          {/* Excel Export / Import Controls */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="استيراد قائمة الموردين من ملف إكسل"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد إكسل'}</span>
          </button>
          <button
            onClick={() => exportSuppliersToExcel(suppliers)}
            className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            title="تصدير بيانات الموردين إلى ملف إكسل"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إكسل</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بمعرف المورد (ID)، الاسم، الهاتف، أو البريد الإلكتروني..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={balanceFilter || ""}
            onChange={(e) => setBalanceFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كل الموردين ({suppliers.length})</option>
            <option value="has_balance">عليهم مستحقات (&gt; 0)</option>
            <option value="zero_balance">رصيد مسدد (0)</option>
          </select>
        </div>
      </div>

      {/* Modal / Form for Add & Edit Supplier */}
      {showFormModal && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>{editingSupplier ? 'تعديل بيانات المورد ومستحقاته' : 'إضافة مورد جديد للنظام'}</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowFormModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">كود / معرف المورد في الإكسل (ID):</label>
              <input
                type="text"
                required
                value={supplierId || ""}
                onChange={(e) => setSupplierId(e.target.value.toUpperCase())}
                placeholder="مثال: SUP-101"
                className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-indigo-300 font-mono font-bold uppercase focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم الشركة أو المورد:</label>
              <input
                type="text"
                required
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شركة الأزياء العالمية"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">رقم الهاتف/الجوال:</label>
              <input
                type="text"
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0501234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">البريد الإلكتروني:</label>
              <input
                type="email"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@supplier.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">رصيد المستحقات (ر.س):</label>
              <input
                type="number"
                step="0.01"
                value={balance ?? ""}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingSupplier ? 'تحديث وحفظ المورد' : 'حفظ المورد وإضافته'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Suppliers Table with Explicit ID column as Column 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[700px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">معرف المورد (ID)</th>
              <th className="p-3.5">اسم المورد</th>
              <th className="p-3.5">الهاتف</th>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">رصيد الحساب</th>
              <th className="p-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">لا يوجد موردون يطابقون البحث</td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.SupplierID} className="hover:bg-slate-800/40 transition-colors">
                  {/* Column 1: Reliable Supplier ID with 1-Click Copy */}
                  <td className="p-3.5">
                    <IdBadge id={s.SupplierID} color="indigo" tooltip="انقر لنسخ كود المورد والبحث عنه في شيت الموردين" />
                  </td>
                  <td className="p-3.5 font-bold text-white">{s.name}</td>
                  <td className="p-3.5 font-mono text-slate-300">{s.phone || '-'}</td>
                  <td className="p-3.5 text-slate-400">{s.email || '-'}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-400">{Number(s.balance || 0).toFixed(2)} ر.س</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl transition-colors cursor-pointer"
                        title="تعديل بيانات المورد"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onDeleteSupplier && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف المورد "${s.name}" برمز (${s.SupplierID})؟`)) {
                              onDeleteSupplier(s.SupplierID);
                            }
                          }}
                          className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                          title="حذف المورد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 3. Employees Tab (الموظفون والصلاحيات)
// =========================================================================
export const EmployeesTab: React.FC<{ 
  employees: Employee[];
  orders?: Order[];
  settings?: AppSettings;
  onAddEmployee?: (e: Employee) => void;
  onUpdateEmployee?: (e: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
}> = ({ employees, orders = [], settings, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'SuperAdmin' | 'Admin' | 'Manager' | 'Supplier' | 'Cashier' | 'StockKeeper'>('Manager');

  // Plan capacity limits check
  const planMaxEmployees = settings?.planMaxEmployees || 0;
  const isNearLimit = planMaxEmployees > 0 && employees.length >= planMaxEmployees * 0.75;
  const isAtLimit = planMaxEmployees > 0 && employees.length >= planMaxEmployees;
  const usagePercentage = planMaxEmployees > 0 ? Math.min(100, Math.round((employees.length / planMaxEmployees) * 100)) : 0;

  // Chart statistics for completed orders per employee
  const employeeChartData = useMemo(() => {
    const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6'];
    return employees.map((emp, index) => {
      const empOrdersCount = (orders || []).filter(o => 
        (o.employeeName && (o.employeeName.toLowerCase() === emp.name.toLowerCase() || o.employeeName.toLowerCase() === emp.username.toLowerCase())) ||
        (o.referralCode && (o.referralCode === emp.EmployeeID || o.referralCode === emp.username))
      ).length;
      return {
        name: emp.name.length > 12 ? emp.name.slice(0, 10) + '..' : emp.name,
        fullName: emp.name,
        id: emp.EmployeeID,
        role: emp.role,
        completedOrders: empOrdersCount,
        color: palette[index % palette.length]
      };
    });
  }, [employees, orders]);

  const openAddModal = () => {
    if (settings?.planMaxEmployees && settings.planMaxEmployees > 0 && employees.length >= settings.planMaxEmployees) {
      alert(`ممنوع الإضافة! لقد وصلت للحد الأقصى المسموح به للموظفين (${settings.planMaxEmployees} موظف). يرجى التواصل مع إدارة المتجر للتخزين والترقية.`);
      return;
    }
    setEditingEmployee(null);
    const nextNum = (employees.length + 1).toString().padStart(2, '0');
    setEmployeeId(`EMP_${nextNum}`);
    setName('');
    setUsername('');
    setPassword('123456');
    setRole('Manager');
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeId(emp.EmployeeID);
    setName(emp.name);
    setUsername(emp.username);
    setPassword(emp.passwordHash || '123456');
    setRole(emp.role);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!editingEmployee && settings?.planMaxEmployees && settings.planMaxEmployees > 0 && employees.length >= settings.planMaxEmployees) {
      alert(`ممنوع الإضافة! لقد وصلت للحد الأقصى المسموح به للموظفين (${settings.planMaxEmployees} موظف). يرجى التواصل مع إدارة المتجر للتخزين والترقية.`);
      return;
    }

    const computedUsername = username.trim() ? username.trim().toLowerCase() : `emp_${Date.now().toString().slice(-4)}`;
    const finalId = (employeeId.trim() || `EMP_${Date.now().toString().slice(-4)}`).toUpperCase();

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        EmployeeID: finalId,
        name: name.trim(),
        username: computedUsername,
        passwordHash: password,
        role
      };
      if (onUpdateEmployee) onUpdateEmployee(updated);
    } else {
      const newEmp: Employee = {
        EmployeeID: finalId,
        name: name.trim(),
        username: computedUsername,
        passwordHash: password,
        role,
        permissions: ['all'],
        lastLogin: new Date().toLocaleDateString('ar-SA')
      };
      if (onAddEmployee) onAddEmployee(newEmp);
    }

    setShowFormModal(false);
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      (e.EmployeeID && e.EmployeeID.toLowerCase().includes(q)) ||
      e.name.toLowerCase().includes(q) || 
      e.username.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (r: string) => {
    if (r === 'SuperAdmin' || r === 'Admin') return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">👑 سوبر أدمن</span>;
    if (r === 'Supplier') return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">📦 مورد</span>;
    if (r === 'Cashier') return <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">💳 كاشير</span>;
    if (r === 'StockKeeper') return <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">🏭 أمين مستودع</span>;
    return <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">💼 مدير</span>;
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Plan Capacity Warning Alert Banner */}
      {planMaxEmployees > 0 && isNearLimit && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg ${
            isAtLimit 
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-start md:items-center gap-3">
            <div className={`p-2.5 rounded-2xl shrink-0 ${isAtLimit ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">
                  {isAtLimit ? '⚠️ وصل المتجر للحد الأقصى للموظفين!' : '⚡ تنبيه: اقتربت من الحد الأقصى للموظفين للباقة'}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isAtLimit ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'}`}>
                  {usagePercentage}% مستخدم
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                لديك حالياً <span className="font-bold text-white font-mono">{employees.length}</span> موظف من أصل <span className="font-bold text-white font-mono">{planMaxEmployees}</span> موظف متاح بالباقة الحالية.
              </p>
            </div>
          </div>

          <div className="w-full md:w-48 shrink-0">
            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-300">
              <span>نسبة الاستهلاك</span>
              <span>{employees.length}/{planMaxEmployees}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${isAtLimit ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with Title & Summary Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">إدارة الموظفين والصلاحيات</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">إضافة وتعديل حسابات الموظفين مع معرفات (ID) موثوقة وسهلة البحث والتصفية</p>
        </div>

        {/* Counters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي الموظفين:</span>
            <span className="font-extrabold text-indigo-300 font-mono">{employees.length}</span>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Employee Completed Orders Chart Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white">مخطط أداء الموظفين (عدد الطلبات المنجزة لكل موظف)</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            إجمالي الطلبات في النظام: <span className="text-indigo-300 font-bold">{orders.length}</span>
          </span>
        </div>

        {employeeChartData.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-bold">لا يوجد بيانات موظفين لعرض المخطط</div>
        ) : (
          <div className="w-full h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-indigo-500/40 p-2.5 rounded-xl text-xs text-white shadow-xl">
                          <p className="font-bold text-indigo-300 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{data.fullName}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {data.id}</p>
                          <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between gap-3 text-emerald-400 font-bold">
                            <span>الطلبات المنجزة:</span>
                            <span className="font-mono text-sm">{data.completedOrders} طلب</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completedOrders" radius={[8, 8, 0, 0]}>
                  {employeeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بمعرف الموظف (ID)، الاسم، أو اسم المستخدم..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={roleFilter || ""}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
          >
            <option value="all">كل الأدوار الوظيفية ({employees.length})</option>
            <option value="SuperAdmin">👑 SuperAdmin (سوبر أدمن)</option>
            <option value="Manager">💼 Manager (مدير)</option>
            <option value="Supplier">📦 Supplier (مورد)</option>
            <option value="Cashier">💳 Cashier (كاشير)</option>
            <option value="StockKeeper">🏭 StockKeeper (أمين مستودع)</option>
          </select>
        </div>
      </div>

      {/* Form Modal for Add & Edit Employee */}
      {showFormModal && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>{editingEmployee ? 'تعديل بيانات الموظف والصلاحيات' : 'إضافة حساب موظف جديد'}</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowFormModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">معرف الموظف (ID):</label>
              <input
                type="text"
                required
                value={employeeId || ""}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="EMP_01"
                className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-indigo-300 font-mono font-bold uppercase focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم الموظف الثلاثي:</label>
              <input
                type="text"
                required
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد المدير"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم المستخدم (Username):</label>
              <input
                type="text"
                required
                value={username || ""}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ahmed_admin"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">كلمة المرور:</label>
              <input
                type="text"
                required
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">الدور الوظيفي والصلاحية:</label>
              <select
                value={role || ""}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none"
              >
                <option value="SuperAdmin">👑 SuperAdmin - سوبر أدمن</option>
                <option value="Manager">💼 Manager - مدير</option>
                <option value="Supplier">📦 Supplier - مورد</option>
                <option value="Cashier">💳 Cashier - كاشير</option>
                <option value="StockKeeper">🏭 StockKeeper - أمين مستودع</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingEmployee ? 'تحديث الموظف' : 'إنشاء الحساب'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Employees Table with Animated Loading Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[700px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">معرف الموظف (ID)</th>
              <th className="p-3.5">اسم الموظف</th>
              <th className="p-3.5">اسم المستخدم</th>
              <th className="p-3.5">الدور الوظيفي</th>
              <th className="p-3.5">الطلبات المنجزة</th>
              <th className="p-3.5">آخر تسجيل دخول</th>
              <th className="p-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">لا يوجد موظفون مطابقون للبحث</td>
              </tr>
            ) : (
              filtered.map((e, idx) => {
                const empCompletedOrders = (orders || []).filter(o => 
                  (o.employeeName && (o.employeeName.toLowerCase() === e.name.toLowerCase() || o.employeeName.toLowerCase() === e.username.toLowerCase())) ||
                  (o.referralCode && (o.referralCode === e.EmployeeID || o.referralCode === e.username))
                ).length;

                return (
                  <motion.tr 
                    key={e.EmployeeID} 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Column 1: Reliable Employee ID with 1-Click Copy */}
                    <td className="p-3.5">
                      <IdBadge id={e.EmployeeID} color="purple" tooltip="انقر لنسخ كود الموظف والبحث عنه في شيت الموظفين" />
                    </td>
                    <td className="p-3.5 font-bold text-white">{e.name}</td>
                    <td className="p-3.5 font-mono text-indigo-400">{e.username}</td>
                    <td className="p-3.5">
                      {getRoleBadge(e.role)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-400 font-mono font-bold border border-slate-700/60">
                        {empCompletedOrders} طلب
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">{e.lastLogin || '2026-08-14'}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl transition-colors cursor-pointer"
                          title="تعديل الموظف"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onDeleteEmployee && (
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف حساب الموظف "${e.name}" برمز (${e.EmployeeID})؟`)) {
                                onDeleteEmployee(e.EmployeeID);
                              }
                            }}
                            className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// =========================================================================
// 4. Offers Tab (العروض والتخفيضات)
// =========================================================================
export const OffersTab: React.FC<{ 
  offers: Offer[];
  onAddOffer?: (off: Offer) => void;
  onUpdateOffer?: (off: Offer) => void;
  onDeleteOffer?: (id: string) => void;
}> = ({ offers, onAddOffer, onUpdateOffer, onDeleteOffer }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [offerId, setOfferId] = useState('');
  const [title, setTitle] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number | string>(20);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [status, setStatus] = useState<'active' | 'expired'>('active');

  // Interactive Date Picker state
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEditingOffer(null);
    const nextNum = (offers.length + 1).toString().padStart(2, '0');
    setOfferId(`OFF_${nextNum}`);
    setTitle('');
    setDiscountPercentage(20);
    setStartDate(today);
    setEndDate(nextMonth);
    setStatus('active');
    setShowFormModal(true);
  };

  const openEditModal = (off: Offer) => {
    setEditingOffer(off);
    setOfferId(off.OfferID);
    setTitle(off.title);
    setDiscountPercentage(off.discountPercentage);
    setStartDate(formatCleanDate(off.startDate) || '2026-08-01');
    setEndDate(formatCleanDate(off.endDate) || '2026-08-31');
    setStatus(off.status);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanStart = formatCleanDate(startDate) || startDate;
    const cleanEnd = formatCleanDate(endDate) || endDate;
    const finalId = (offerId.trim() || `OFF_${Date.now().toString().slice(-4)}`).toUpperCase();

    if (editingOffer) {
      const updated: Offer = {
        ...editingOffer,
        OfferID: finalId,
        title: title.trim(),
        discountPercentage: Number(discountPercentage) || 0,
        startDate: cleanStart,
        endDate: cleanEnd,
        status
      };
      if (onUpdateOffer) onUpdateOffer(updated);
    } else {
      const newOff: Offer = {
        OfferID: finalId,
        title: title.trim(),
        discountPercentage: Number(discountPercentage) || 0,
        startDate: cleanStart,
        endDate: cleanEnd,
        status
      };
      if (onAddOffer) onAddOffer(newOff);
    }

    setShowFormModal(false);
  };

  const filtered = offers.filter(off => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      (off.OfferID && off.OfferID.toLowerCase().includes(q)) ||
      off.title.toLowerCase().includes(q) ||
      (off.startDate && off.startDate.includes(q)) ||
      (off.endDate && off.endDate.includes(q));
    const matchesStatus = statusFilter === 'all' || off.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header with Title & Summary Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-white">العروض والتخفيضات (Flash Sales)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">إدارة الحملات الترويجية مع منتقي تواريخ تقويمي متطور وتنسيق موثوق لـ Google Sheets</p>
        </div>

        {/* Counters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-pink-500/15 border border-pink-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي العروض:</span>
            <span className="font-extrabold text-pink-300 font-mono">{offers.length}</span>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عرض جديد</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بالمعرف (ID)، اسم العرض، أو تاريخ البداية/النهاية..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-pink-500 font-sans"
          >
            <option value="all">كل العروض ({offers.length})</option>
            <option value="active">🟢 العروض النشطة</option>
            <option value="expired">⚪ العروض المنتهية</option>
          </select>
        </div>
      </div>

      {/* Add / Edit Offer Form Modal */}
      {showFormModal && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-pink-500/40 rounded-3xl space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>{editingOffer ? 'تعديل بيانات العرض الترويجي' : 'إنشاء عرض تخفيض جديد'}</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowFormModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">معرف العرض في الإكسل (ID):</label>
              <input
                type="text"
                required
                value={offerId || ""}
                onChange={(e) => setOfferId(e.target.value.toUpperCase())}
                placeholder="OFF_01"
                className="w-full bg-slate-950 border border-pink-500/40 rounded-xl p-2.5 text-pink-300 font-mono font-bold uppercase focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم أو عنوان العرض:</label>
              <input
                type="text"
                required
                value={title || ""}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تخفيضات الصيف الكبرى"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">نسبة الخصم (%):</label>
              <input
                type="number"
                min="1"
                max="99"
                required
                value={discountPercentage ?? ""}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Interactive Calendar Date Pickers */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>تاريخ البداية (تقويم):</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveDatePicker('start')}
                className="w-full bg-slate-950 border border-pink-500/40 hover:border-pink-400 rounded-xl p-2.5 text-white font-mono text-xs flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="font-bold text-pink-200">{startDate || 'اختر التاريخ'}</span>
                <Calendar className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>تاريخ النهاية (تقويم):</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveDatePicker('end')}
                className="w-full bg-slate-950 border border-pink-500/40 hover:border-pink-400 rounded-xl p-2.5 text-white font-mono text-xs flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="font-bold text-pink-200">{endDate || 'اختر التاريخ'}</span>
                <Calendar className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingOffer ? 'تحديث العرض' : 'تفعيل العرض جديد'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Date Picker Modal for Start / End dates */}
      <DatePickerModal
        isOpen={activeDatePicker !== null}
        onClose={() => setActiveDatePicker(null)}
        selectedDate={activeDatePicker === 'start' ? startDate : endDate}
        onSelectDate={(newDate) => {
          if (activeDatePicker === 'start') {
            setStartDate(newDate);
          } else if (activeDatePicker === 'end') {
            setEndDate(newDate);
          }
        }}
        title={activeDatePicker === 'start' ? 'اختر تاريخ بداية العرض الترويجي' : 'اختر تاريخ نهاية العرض الترويجي'}
      />

      {/* Offers List Cards Grid with prominent ID Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-500 font-bold">
            لا توجد عروض ترويجية تطابق البحث
          </div>
        ) : (
          filtered.map(off => (
            <div key={off.OfferID} className="bg-slate-900 border border-slate-800 hover:border-pink-500/40 p-5 rounded-3xl space-y-3 relative group shadow-xl transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <IdBadge id={off.OfferID} color="pink" tooltip="معرف العرض في شيت العروض - انقر للنسخ" />
                  <span className="px-2.5 py-1 bg-pink-500/20 text-pink-300 text-xs font-black rounded-full border border-pink-500/30 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>خصم {off.discountPercentage}%</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(off)}
                    className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl transition-colors cursor-pointer"
                    title="تعديل العرض"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {onDeleteOffer && (
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف العرض "${off.title}" برمز (${off.OfferID})؟`)) {
                          onDeleteOffer(off.OfferID);
                        }
                      }}
                      className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="حذف العرض"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white">{off.title}</h3>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>من {formatCleanDate(off.startDate)} إلى {formatCleanDate(off.endDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 5. Coupons Tab (كوبونات الخصم)
// =========================================================================
export const CouponsTab: React.FC<{ 
  coupons: Coupon[]; 
  onAddCoupon?: (c: Coupon) => void;
  onDeleteCoupon?: (code: string) => void;
}> = ({ coupons, onAddCoupon, onDeleteCoupon }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountVal, setDiscountVal] = useState<number | string>(20);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [minAmount, setMinAmount] = useState<number | string>(100);
  const [expiry, setExpiry] = useState<string>('2026-12-31');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      CouponCode: code.trim().toUpperCase(),
      discountValue: Number(discountVal) || 0,
      discountType,
      minOrderAmount: Number(minAmount) || 0,
      expiryDate: formatCleanDate(expiry) || expiry,
      usageCount: 0
    };

    if (onAddCoupon) {
      onAddCoupon(newCoupon);
    }
    setCode('');
    setShowAddForm(false);
  };

  const filtered = coupons.filter(c => {
    const q = search.toLowerCase().trim();
    const matchesSearch = c.CouponCode.toLowerCase().includes(q) || (c.expiryDate && c.expiryDate.includes(q));
    const matchesType = typeFilter === 'all' || c.discountType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header with Title & Summary Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">إدارة كوبونات الخصم والترويج</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">إضافة وتفعيل أكواد الخصم مع منتقي تواريخ تقويمي ومعرفات (ID) موثوقة للبحث والحذف في الإكسل</p>
        </div>

        {/* Counters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي الكوبونات:</span>
            <span className="font-extrabold text-amber-300 font-mono">{coupons.length}</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كوبون جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بكود الكوبون، أو تاريخ الانتهاء..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل أنواع الكوبونات ({coupons.length})</option>
            <option value="percentage">% نسبة مئوية</option>
            <option value="fixed">💵 خصم مبلغ ثابت</option>
          </select>
        </div>
      </div>

      {/* Add Coupon Modal/Form */}
      {showAddForm && (
        <form onSubmit={handleCreateCoupon} className="p-5 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>إنشاء كود خصم جديد</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">كود الخصم (المعرف في الإكسل):</label>
              <input
                type="text"
                required
                value={code || ""}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: RWNAQ50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">نوع الخصم والقيمة:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  value={discountVal ?? ""}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <select
                  value={discountType || ""}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-bold focus:outline-none"
                >
                  <option value="percentage">% نسبة</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">الحد الأدنى للطلب (ر.س):</label>
              <input
                type="number"
                min="0"
                value={minAmount ?? ""}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>تاريخ الانتهاء (تقويم):</span>
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full bg-slate-950 border border-amber-500/40 hover:border-amber-400 rounded-xl p-2.5 text-white font-mono text-xs flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="font-bold text-amber-200">{expiry || 'اختر التاريخ'}</span>
                <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              حفظ الكوبون وتفعيله
            </button>
          </div>
        </form>
      )}

      {/* DatePicker Modal for Coupon Expiry */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={expiry}
        onSelectDate={(newDate) => setExpiry(newDate)}
        title="اختر تاريخ انتهاء صلاحية الكوبون"
      />

      {/* Coupons List Table with Explicit ID column as Column 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[650px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">كود / معرف الكوبون (ID)</th>
              <th className="p-3.5">قيمة الخصم</th>
              <th className="p-3.5">الحد الأدنى للطلب</th>
              <th className="p-3.5">تاريخ الانتهاء</th>
              <th className="p-3.5">مرات الاستخدام</th>
              <th className="p-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">لا توجد كوبونات تطابق البحث</td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.CouponCode} className="hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <IdBadge id={c.CouponCode} color="amber" tooltip="كود الكوبون في شيت الكوبونات - انقر للنسخ" />
                  </td>
                  <td className="p-3.5 font-bold text-emerald-400">
                    {c.discountValue} {c.discountType === 'percentage' ? '%' : 'ر.س'}
                  </td>
                  <td className="p-3.5 font-mono">{c.minOrderAmount || 0} ر.س</td>
                  <td className="p-3.5 font-mono text-slate-400">{formatCleanDate(c.expiryDate) || '2026-12-31'}</td>
                  <td className="p-3.5 font-mono text-slate-400">{c.usageCount || 0} مرة</td>
                  <td className="p-3.5 text-center">
                    {onDeleteCoupon && (
                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف الكوبون "${c.CouponCode}"؟`)) {
                            onDeleteCoupon(c.CouponCode);
                          }
                        }}
                        className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                        title="حذف الكوبون"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 6. Audit Log Tab (سجل العمليات والأحداث الفورية)
// =========================================================================
export const AuditLogTab: React.FC<{
  logs: AuditLog[];
  onClearLogs?: () => void | Promise<void>;
  isSyncing?: boolean;
  onRefresh?: () => void;
}> = ({ logs, onClearLogs, isSyncing = false, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  const filtered = logs.filter(l => {
    const q = search.toLowerCase().trim();
    const matchesSearch = 
      (l.AuditID && l.AuditID.toLowerCase().includes(q)) ||
      l.employeeName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.timestamp.includes(q);
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleConfirmClear = async () => {
    if (!onClearLogs) return;
    try {
      setIsClearing(true);
      await onClearLogs();
    } finally {
      setIsClearing(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header with Summary Counters & Clear Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">سجل العمليات والأحداث الفورية (Audit Log)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">تسجيل فوري لكافة حركات وتعديلات النظام ومزامنتها لحظياً مع Google Sheets مع معرفات فريدة (Log ID)</p>
        </div>

        {/* Counter & Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400">إجمالي العمليات:</span>
            <span className="font-extrabold text-indigo-300 font-mono">{logs.length}</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 text-xs transition-colors cursor-pointer"
              title="تحديث قائمة السجلات"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}

          {onClearLogs && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isClearing || isSyncing}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{isClearing ? 'جاري تهيئة وتفريغ السجل...' : 'تهيئة السجل'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl text-right">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تأكيد تهيئة وتفريغ سجل العمليات</h3>
                <p className="text-xs text-slate-400">إجراء تفريغ السجل محلياً ومزامنته سحابياً مع Google Sheets</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-5 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-rose-200">⚠️ تنبيه هام:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pr-1 leading-relaxed">
                <li>سيتم مسح كافة السجلات السابقة من الذاكرة المحلية.</li>
                <li>سيتم إرسال أمر تفريغ ورقة <strong className="text-indigo-300 font-mono">سجل_العمليات</strong> في Google Sheets لضمان التطابق التام.</li>
                <li>سيتم توثيق عملية "تهيئة السجل" كحركة جديدة أولى مباشرة بعد التفريغ.</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isClearing}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
                <span>{isClearing ? 'جاري التنفيذ والتفريغ...' : 'نعم، تهيئة السجل الآن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بمعرف السجل (ID)، الموظف، نوع العملية، أو التفاصيل..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        {uniqueActions.length > 0 && (
          <div className="w-full sm:w-56">
            <select
              value={actionFilter || ""}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كل العمليات ({uniqueActions.length})</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table with Explicit ID column as Column 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[700px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">معرف السجل (ID)</th>
              <th className="p-3.5">الموظف / المصدر</th>
              <th className="p-3.5">نوع العملية</th>
              <th className="p-3.5">تفاصيل الحدث</th>
              <th className="p-3.5">التاريخ والوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">لا توجد سجلات تطابق البحث</td>
              </tr>
            ) : (
              filtered.map(l => (
                <tr key={l.AuditID} className="hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <IdBadge id={l.AuditID} color="slate" tooltip="معرف حركة السجل - انقر للنسخ" />
                  </td>
                  <td className="p-3.5 font-bold text-white">{l.employeeName}</td>
                  <td className="p-3.5 font-semibold text-indigo-400">{l.action}</td>
                  <td className="p-3.5 text-slate-300 max-w-xs truncate">{l.details}</td>
                  <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-indigo-300 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{formatRelativeTime(l.timestamp)}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatCleanDate(l.timestamp)} {l.timestamp.includes('T') ? l.timestamp.split('T')[1]?.slice(0, 5) : ''}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
