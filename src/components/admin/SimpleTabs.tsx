import React, { useState, useRef, useMemo } from 'react';
import { Customer, Supplier, Employee, Offer, Coupon, AuditLog, AppSettings, Order, Product, Category, CategoryGroup } from '../../types';
import { 
  Plus, Tag, Trash2, Edit, Search, UserCheck, Truck, Flame, ShieldAlert, 
  Check, X, Calendar, Filter, RotateCcw, AlertTriangle, Sparkles, CheckCircle2,
  Users, Receipt, History, Copy, Eye, Clock, RefreshCw, Download, Upload, FileSpreadsheet,
  BarChart2, TrendingUp, Award, Zap, Shield, Percent, Layers, ShoppingBag, Info,
  CheckSquare, Square, ChevronDown, MessageCircle, Bell
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
// 4. Offers Tab (العروض والتخفيضات وإدارة الخصومات الجماعية)
// =========================================================================
export const OffersTab: React.FC<{ 
  offers: Offer[];
  products?: Product[];
  categories?: Category[];
  groups?: CategoryGroup[];
  onAddOffer?: (off: Offer, updatedProducts?: Product[]) => void | Promise<void>;
  onUpdateOffer?: (off: Offer, updatedProducts?: Product[]) => void | Promise<void>;
  onDeleteOffer?: (id: string, restoredProducts?: Product[]) => void | Promise<void>;
  onRevertDiscount?: (offer: Offer, restoredProducts?: Product[]) => void | Promise<void>;
  onResetAllDiscounts?: () => void | Promise<void>;
}> = ({ 
  offers, 
  products = [], 
  categories = [], 
  groups = [], 
  onAddOffer, 
  onUpdateOffer, 
  onDeleteOffer, 
  onRevertDiscount,
  onResetAllDiscounts
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Wishlist alerts sub-tab state & subscriber list
  const [activeSubTab, setActiveSubTab] = useState<'offers' | 'wishlist-alerts'>('offers');
  const [wishlistSubs, setWishlistSubs] = useState<any[]>([]);

  React.useEffect(() => {
    const raw = localStorage.getItem('rwnaq_all_wishlist_subscriptions');
    if (raw) {
      setWishlistSubs(JSON.parse(raw));
    } else {
      // Seed some realistic wishlist subscriptions so the admin can try the feature immediately!
      const mockSubs = [
        {
          phone: '966599539659',
          name: 'محمد الأمين',
          date: new Date().toLocaleDateString('ar-SA'),
          products: products.slice(0, 2).map(p => ({ ProductID: p.ProductID, name: p.name, salePrice: p.salePrice }))
        },
        {
          phone: '967715989357',
          name: 'علي عبد الله',
          date: new Date().toLocaleDateString('ar-SA'),
          products: products.slice(1, 3).map(p => ({ ProductID: p.ProductID, name: p.name, salePrice: p.salePrice }))
        }
      ];
      localStorage.setItem('rwnaq_all_wishlist_subscriptions', JSON.stringify(mockSubs));
      setWishlistSubs(mockSubs);
    }
  }, [products]);

  // Identify all products currently having discounts in the store
  const discountedProducts = useMemo(() => {
    return products.filter(p => (p.originalPrice && p.originalPrice > p.salePrice) || (p.discount && p.discount > 0));
  }, [products]);

  // Form Fields matching user design (Image 2)
  const [offerId, setOfferId] = useState('');
  const [title, setTitle] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [branch, setBranch] = useState('الكل (كافة الفروع)');
  const [priority, setPriority] = useState<number>(1);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | string>(20);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [priceGroup, setPriceGroup] = useState('الكل');
  const [isActive, setIsActive] = useState(true);
  const [appliesToAllCheckbox, setAppliesToAllCheckbox] = useState(false);

  // Search & Filtering inside products multi-select
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Interactive Date Picker state
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  // Unique Categories & Groups derived from store data
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    categories.forEach(c => {
      if (c.name && c.name.trim()) catSet.add(c.name.trim());
    });
    products.forEach(p => {
      if (p.category && p.category.trim()) catSet.add(p.category.trim());
    });
    return Array.from(catSet);
  }, [categories, products]);

  const availableGroups = useMemo(() => {
    const grpSet = new Set<string>();
    groups.forEach(g => {
      if (g.name && g.name.trim()) grpSet.add(g.name.trim());
    });
    categories.forEach(c => {
      if (c.group && c.group.trim()) grpSet.add(c.group.trim());
    });
    products.forEach(p => {
      if (p.group && p.group.trim()) grpSet.add(p.group.trim());
    });
    if (grpSet.size === 0) grpSet.add('عام');
    return Array.from(grpSet);
  }, [groups, categories, products]);

  // Compute targeted products based on current selection in the modal
  const targetedProducts = useMemo(() => {
    if (applyToAll || appliesToAllCheckbox) {
      return products;
    }

    const hasSpecificProducts = selectedProductIds.length > 0;
    const hasCategoryFilter = selectedCategoryNames.length > 0;
    const hasGroupFilter = selectedGroupNames.length > 0;

    if (!hasSpecificProducts && !hasCategoryFilter && !hasGroupFilter) {
      return products; // Default fallback to all products
    }

    return products.filter(p => {
      if (hasSpecificProducts && (selectedProductIds.includes(p.ProductID) || selectedProductIds.includes(p.SKU))) {
        return true;
      }
      const matchCat = hasCategoryFilter ? selectedCategoryNames.includes(p.category) : false;
      const matchGrp = hasGroupFilter ? (p.group && selectedGroupNames.includes(p.group)) : false;
      return matchCat || matchGrp;
    });
  }, [products, applyToAll, appliesToAllCheckbox, selectedProductIds, selectedCategoryNames, selectedGroupNames]);

  // Sample calculation for preview
  const sampleProduct = targetedProducts[0] || products[0];
  const sampleBasePrice = sampleProduct ? (sampleProduct.originalPrice || sampleProduct.salePrice || 10) : 10;
  const numVal = Math.max(0, Number(discountValue) || 0);
  const sampleNewPrice = discountType === 'percentage'
    ? Number((sampleBasePrice * (1 - Math.min(100, numVal) / 100)).toFixed(2))
    : Math.max(0, Number((sampleBasePrice - numVal).toFixed(2)));
  const samplePercent = sampleBasePrice > 0 
    ? Math.round(((sampleBasePrice - sampleNewPrice) / sampleBasePrice) * 100) 
    : 0;
  const sampleSavings = Number((sampleBasePrice - sampleNewPrice).toFixed(2));

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEditingOffer(null);
    const nextNum = (offers.length + 1).toString().padStart(2, '0');
    setOfferId(`OFF_${nextNum}`);
    setTitle('');
    setApplyToAll(false);
    setSelectedProductIds([]);
    setSelectedCategoryNames([]);
    setSelectedGroupNames([]);
    setBranch('الكل (كافة الفروع)');
    setPriority(1);
    setDiscountType('percentage');
    setDiscountValue(20);
    setStartDate(today);
    setEndDate(nextMonth);
    setPriceGroup('الكل');
    setIsActive(true);
    setAppliesToAllCheckbox(false);
    setProductSearchTerm('');
    setShowFormModal(true);
  };

  const openEditModal = (off: Offer) => {
    setEditingOffer(off);
    setOfferId(off.OfferID);
    setTitle(off.title);
    setApplyToAll(Boolean(off.applyToAll));
    setSelectedProductIds(off.targetProductIds || []);
    setSelectedCategoryNames(off.targetCategoryIds || []);
    setSelectedGroupNames(off.targetGroupIds || []);
    setBranch(off.branch || 'الكل (كافة الفروع)');
    setPriority(off.priority || 1);
    setDiscountType(off.discountType || 'percentage');
    setDiscountValue(off.discountType === 'fixed' ? (off.discountAmount ?? off.discountPercentage) : off.discountPercentage);
    setStartDate(formatCleanDate(off.startDate) || '2026-08-01');
    setEndDate(formatCleanDate(off.endDate) || '2026-08-31');
    setPriceGroup(off.priceGroup || 'الكل');
    setIsActive(off.status !== 'expired');
    setAppliesToAllCheckbox(Boolean(off.applyToAll));
    setProductSearchTerm('');
    setShowFormModal(true);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanStart = formatCleanDate(startDate) || startDate;
    const cleanEnd = formatCleanDate(endDate) || endDate;
    const finalId = (offerId.trim() || `OFF_${Date.now().toString().slice(-4)}`).toUpperCase();
    const valNum = Math.max(0, Number(discountValue) || 0);

    // Calculate updated products with discounted prices
    const targetedIdSet = new Set(targetedProducts.map(p => p.ProductID));
    const updatedProducts: Product[] = products.map(p => {
      if (!targetedIdSet.has(p.ProductID)) return p;

      // Keep original baseline price
      const baseOriginal = (p.originalPrice && p.originalPrice > p.salePrice) ? p.originalPrice : p.salePrice;
      let newSale = baseOriginal;
      let calculatedPercent = 0;

      if (discountType === 'percentage') {
        calculatedPercent = Math.min(100, valNum);
        newSale = Number((baseOriginal * (1 - calculatedPercent / 100)).toFixed(2));
      } else {
        newSale = Math.max(0, Number((baseOriginal - valNum).toFixed(2)));
        calculatedPercent = baseOriginal > 0 ? Math.round(((baseOriginal - newSale) / baseOriginal) * 100) : 0;
      }

      return {
        ...p,
        originalPrice: baseOriginal,
        salePrice: newSale,
        discount: calculatedPercent,
        updatedAt: new Date().toISOString()
      };
    });

    const finalOffer: Offer = {
      OfferID: finalId,
      title: title.trim(),
      discountPercentage: discountType === 'percentage' ? valNum : samplePercent,
      discountAmount: discountType === 'fixed' ? valNum : undefined,
      discountType,
      applyToAll: applyToAll || appliesToAllCheckbox,
      targetProductIds: selectedProductIds,
      targetCategoryIds: selectedCategoryNames,
      targetGroupIds: selectedGroupNames,
      branch,
      priority: Number(priority) || 1,
      priceGroup,
      startDate: cleanStart,
      endDate: cleanEnd,
      status: isActive ? 'active' : 'expired'
    };

    if (editingOffer && onUpdateOffer) {
      onUpdateOffer(finalOffer, updatedProducts);
    } else if (onAddOffer) {
      onAddOffer(finalOffer, updatedProducts);
    }

    setShowFormModal(false);
  };

  // Revert discount from products affected by this offer
  const handleRevertOffer = (off: Offer) => {
    if (!window.confirm(`هل أنت متأكد من تصفير وإلغاء الخصم "${off.title}" واستعادة الأسعار الأصلية للمنتجات؟`)) {
      return;
    }

    // Determine targeted products of this offer
    const targetProds = off.applyToAll
      ? products
      : products.filter(p => {
          if (off.targetProductIds && (off.targetProductIds.includes(p.ProductID) || off.targetProductIds.includes(p.SKU))) return true;
          if (off.targetCategoryIds && off.targetCategoryIds.includes(p.category)) return true;
          if (off.targetGroupIds && p.group && off.targetGroupIds.includes(p.group)) return true;
          return false;
        });

    const targetIdSet = new Set(targetProds.map(p => p.ProductID));
    const restoredProducts: Product[] = products.map(p => {
      if (!targetIdSet.has(p.ProductID)) return p;
      const restoredPrice = (p.originalPrice && p.originalPrice > 0) ? p.originalPrice : p.salePrice;
      return {
        ...p,
        salePrice: restoredPrice,
        originalPrice: undefined,
        discount: 0,
        updatedAt: new Date().toISOString()
      };
    });

    if (onRevertDiscount) {
      onRevertDiscount(off, restoredProducts);
    } else if (onDeleteOffer) {
      onDeleteOffer(off.OfferID, restoredProducts);
    }
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
      {/* Header with Title & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <h2 className="text-base font-black text-white font-cairo">العروض والخصومات وإدارة التخفيضات</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            تطبيق خصومات مباشرة (ثابتة أو بالنسبة %) على منتجات محددة، فئات، مجموعات أو كافة أصناف المتجر مع الحفظ الفوري بـ Google Sheets
          </p>
        </div>

        {/* Counters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs flex items-center gap-1.5 font-sans">
            <span className="text-slate-400">إجمالي الخصومات:</span>
            <span className="font-extrabold text-rose-400 font-mono">{offers.length}</span>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/25 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خصم جديد</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex border-b border-slate-800 gap-4 mb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('offers')}
          className={`pb-2.5 px-4 font-bold text-xs transition-colors cursor-pointer border-b-2 ${
            activeSubTab === 'offers' ? 'border-rose-500 text-rose-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          🎁 قائمة الخصومات والعروض النشطة ({offers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('wishlist-alerts')}
          className={`pb-2.5 px-4 font-bold text-xs transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'wishlist-alerts' ? 'border-rose-500 text-rose-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>تنبيهات قائمة الرغبات عبر واتساب (Wishlist Alerts)</span>
          {wishlistSubs.length > 0 && (
            <span className="bg-rose-500/25 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {wishlistSubs.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'offers' && (
        <>
          {/* Alert & Instant Restore Banner for Active Product Discounts */}
      {discountedProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-rose-950/40 to-slate-900 border border-rose-500/40 p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm font-cairo">
                  يوجد حالياً {discountedProducts.length} منتج معروض بأسعار مخفضة في المتجر
                </h3>
                {offers.length === 0 && (
                  <span className="px-2 py-0.5 bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-[10px] font-bold">
                    تم حذف سجلات العروض
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                {offers.length === 0
                  ? 'تم حذف سجلات العروض ولكن لا تزال الأسعار المخفضة مسجلة في شيت المنتجات. اضغط على الزر لاستعادة الأسعار الأصلية فوراً وإلغاء الخصم عن كافة المنتجات في المتجر والأكسل.'
                  : 'يمكنك في أي وقت استعادة الأسعار الأصلية السابقة لكافة المنتجات بنقرة واحدة وتصفير الخصم في المتجر وGoogle Sheets.'
                }
              </p>
            </div>
          </div>

          {onResetAllDiscounts && (
            <button
              type="button"
              onClick={onResetAllDiscounts}
              className="w-full md:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة الأسعار الأصلية وإلغاء الخصم ({discountedProducts.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Dynamic Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث بالمعرف (ID)، اسم الخصم، أو التاريخ..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 pr-9 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-sans cursor-pointer"
          >
            <option value="all">كل الخصومات ({offers.length})</option>
            <option value="active">🟢 الخصومات الفعالة</option>
            <option value="expired">⚪ الخصومات المنتهية</option>
          </select>
        </div>
      </div>

      {/* Add / Edit Discount Modal - Matching User Reference (Image 2) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white font-cairo">
                    {editingOffer ? 'تعديل خصم' : 'إضافة خصم'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable Form) */}
              <form onSubmit={handleApplyDiscount} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                {/* 1. Name Field */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 font-cairo">
                    الإسم:*
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: خصم عطلة نهاية الأسبوع"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>

                {/* 2. Apply to all products checkbox card (Matching Image 2) */}
                <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="applyToAllCheck"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5 accent-rose-500 cursor-pointer"
                  />
                  <label htmlFor="applyToAllCheck" className="cursor-pointer select-none flex-1">
                    <div className="text-xs font-black text-blue-300 font-cairo">
                      تطبيق الخصم على جميع المنتجات بدون استثناء
                    </div>
                    <div className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed font-sans">
                      عند التفعيل، سيتم تطبيق هذا الخصم على كافة أصناف وخدمات المتجر تلقائياً دون الحاجة لتحديدها يدوياً.
                    </div>
                  </label>
                </div>

                {/* 3. Specific Products Selector (if not applyToAll) */}
                {!applyToAll && (
                  <div className="space-y-2 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="font-bold text-slate-300 font-cairo flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                        <span>المنتجات المستهدفة:</span>
                        <span className="text-[10px] text-rose-400 font-mono font-normal">
                          ({selectedProductIds.length} محددة من {products.length})
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds(products.map(p => p.ProductID))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-sans cursor-pointer transition-colors"
                        >
                          اختر الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded-lg font-sans cursor-pointer transition-colors"
                        >
                          إلغاء تحديد الكل
                        </button>
                      </div>
                    </div>

                    {/* Filter search within products */}
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو الباركود لتحديد أصناف بعينها..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />

                    {/* Products Multi-select pills */}
                    <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-slate-900/70 rounded-xl border border-slate-800">
                      {products
                        .filter(p => !productSearchTerm || p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.SKU.includes(productSearchTerm))
                        .slice(0, 50)
                        .map(p => {
                          const isSelected = selectedProductIds.includes(p.ProductID);
                          return (
                            <button
                              key={p.ProductID}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProductIds(prev => prev.filter(id => id !== p.ProductID));
                                } else {
                                  setSelectedProductIds(prev => [...prev, p.ProductID]);
                                }
                              }}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-right transition-all cursor-pointer ${isSelected ? 'bg-rose-600/20 border-rose-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-rose-400 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                                <span className="text-[11px] font-bold truncate">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 shrink-0">{p.salePrice} ر.س</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 4. Categories & Groups Selectors (Matching Image 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Filter */}
                  <div className="space-y-1.5 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300 font-cairo">الفئة:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryNames([...availableCategories])}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                        >
                          اختر الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryNames([])}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      {availableCategories.map(cat => {
                        const isSelected = selectedCategoryNames.includes(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-[11px] ${isSelected ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-300 hover:bg-slate-800/60'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategoryNames(prev => [...prev, cat]);
                                } else {
                                  setSelectedCategoryNames(prev => prev.filter(c => c !== cat));
                                }
                              }}
                              className="accent-rose-500 rounded"
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Groups Filter */}
                  <div className="space-y-1.5 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300 font-cairo">مجموعة المنتجات:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedGroupNames([...availableGroups])}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                        >
                          اختر الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGroupNames([])}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      {availableGroups.map(grp => {
                        const isSelected = selectedGroupNames.includes(grp);
                        return (
                          <label
                            key={grp}
                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-[11px] ${isSelected ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-300 hover:bg-slate-800/60'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroupNames(prev => [...prev, grp]);
                                } else {
                                  setSelectedGroupNames(prev => prev.filter(g => g !== grp));
                                }
                              }}
                              className="accent-rose-500 rounded"
                            />
                            <span>{grp}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Branch & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-cairo">الفرع:*</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans focus:outline-none focus:border-rose-500"
                    >
                      <option value="الكل (كافة الفروع)">الكل (كافة الفروع)</option>
                      <option value="الفرع الرئيسي">الفرع الرئيسي</option>
                      <option value="فرع الرياض">فرع الرياض</option>
                      <option value="فرع جدة">فرع جدة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-cairo flex items-center gap-1">
                      <span>الأولوية:*</span>
                      <span title="ترتيب تطبيق الخصم في حال وجود أكثر من عرض"><Info className="w-3.5 h-3.5 text-slate-500" /></span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* 6. Discount Type & Value (Fixed or Percentage) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-2xl">
                  <div>
                    <label className="block text-rose-300 font-bold mb-1 font-cairo">نوع الخصم:*</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2.5 text-white font-sans focus:outline-none focus:border-rose-400 font-bold"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ر.س)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-rose-300 font-bold mb-1 font-cairo">
                      {discountType === 'percentage' ? 'نسبة الخصم (%):*' : 'مبلغ الخصم (ر.س):*'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        max={discountType === 'percentage' ? 99 : 99999}
                        step="any"
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? 'مثال: 20' : 'مثال: 15.00'}
                        className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-rose-400 pl-8"
                      />
                      <span className="absolute left-3 top-2.5 text-rose-400 font-bold">
                        {discountType === 'percentage' ? '%' : 'ر.س'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. Start & End Dates with Interactive Calendar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-cairo flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>من تاريخ:*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveDatePicker('start')}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-rose-400 rounded-xl p-2.5 text-white font-mono text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-rose-200">{startDate || 'اختر تاريخ البداية'}</span>
                      <Calendar className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-cairo flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>إلى تاريخ:*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveDatePicker('end')}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-rose-400 rounded-xl p-2.5 text-white font-mono text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-rose-200">{endDate || 'اختر تاريخ النهاية'}</span>
                      <Calendar className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* 8. Price Group Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 font-cairo">مجموعة أسعار البيع:</label>
                  <select
                    value={priceGroup}
                    onChange={(e) => setPriceGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans focus:outline-none focus:border-rose-500"
                  >
                    <option value="الكل">الكل</option>
                    <option value="سعر التجزئة">سعر التجزئة</option>
                    <option value="سعر الجملة">سعر الجملة</option>
                  </select>
                </div>

                {/* 9. Checkboxes at bottom (Matching Image 2) */}
                <div className="flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                    />
                    <span>مفعل</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-300">
                    <input
                      type="checkbox"
                      checked={appliesToAllCheckbox}
                      onChange={(e) => setAppliesToAllCheckbox(e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                    />
                    <span>ينطبق على الكل</span>
                  </label>
                </div>

                {/* 10. Live Impact Preview Card */}
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 font-cairo flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>معاينة حية لتطبيق الخصم:</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 font-mono">
                      سيؤثر على {targetedProducts.length} صنفاً
                    </span>
                  </div>

                  {sampleProduct && (
                    <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2 font-mono">
                      <span className="text-slate-300 font-sans font-bold">{sampleProduct.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-slate-500">{sampleBasePrice} ر.س</span>
                        <span className="text-emerald-400 font-bold">{sampleNewPrice} ر.س</span>
                        <span className="bg-rose-600/30 text-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                          -{samplePercent}% 🔥
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                    * عند الحفظ سيتم تعديل الأسعار فورياً في المتجر وحفظها في Google Sheets في عمودي "سعر_البيع القديم" و"سعر_البيع الجديد".
                  </p>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إغلاق
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ وتطبيق الخصم</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        title={activeDatePicker === 'start' ? 'اختر تاريخ بداية الخصم' : 'اختر تاريخ نهاية الخصم'}
      />

      {/* Offers & Discounts List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Flame className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-300 font-bold text-sm">
              لا توجد عروض أو خصومات مسجلة حالياً تطابق البحث
            </p>
            {discountedProducts.length > 0 && onResetAllDiscounts && (
              <div className="pt-2 max-w-md mx-auto">
                <p className="text-xs text-rose-300 mb-3 font-sans leading-relaxed">
                  يوجد حالياً {discountedProducts.length} منتج لا تزال معروضة بأسعار مخفضة في المتجر. هل ترغب في استعادة أسعارها الأصلية الآن؟
                </p>
                <button
                  type="button"
                  onClick={onResetAllDiscounts}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استعادة الأسعار الأصلية لجميع المنتجات ({discountedProducts.length})</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filtered.map(off => (
            <div key={off.OfferID} className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 p-5 rounded-3xl space-y-3 relative group shadow-xl transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <IdBadge id={off.OfferID} color="pink" tooltip="معرف الخصم في شيت العروض" />
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-xs font-black rounded-full border border-rose-500/30 flex items-center gap-1 font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {off.discountType === 'fixed' 
                        ? `خصم ${off.discountAmount ?? off.discountPercentage} ر.س ثابت`
                        : `خصم ${off.discountPercentage}%`
                      }
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(off)}
                    className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl transition-colors cursor-pointer"
                    title="تعديل الخصم"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRevertOffer(off)}
                    className="p-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-xl transition-colors cursor-pointer"
                    title="إلغاء وتصفير الخصم من المنتجات واستعادة الأسعار الأصلية"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  {onDeleteOffer && (
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف الخصم "${off.title}" بالرمز (${off.OfferID})؟\nسيتم أيضاً استعادة الأسعار الأصلية وإلغاء الخصم عن المنتجات المشمولة.`)) {
                          const targetProds = off.applyToAll
                            ? products
                            : products.filter(p => {
                                if (off.targetProductIds && (off.targetProductIds.includes(p.ProductID) || off.targetProductIds.includes(p.SKU))) return true;
                                if (off.targetCategoryIds && off.targetCategoryIds.includes(p.category)) return true;
                                if (off.targetGroupIds && p.group && off.targetGroupIds.includes(p.group)) return true;
                                return false;
                              });

                          const targetIdSet = new Set(targetProds.map(p => p.ProductID));
                          const restoredProducts: Product[] = products.map(p => {
                            if (!targetIdSet.has(p.ProductID)) return p;
                            const restoredPrice = (p.originalPrice && p.originalPrice > 0) ? p.originalPrice : p.salePrice;
                            return {
                              ...p,
                              salePrice: restoredPrice,
                              originalPrice: undefined,
                              discount: 0,
                              updatedAt: new Date().toISOString()
                            };
                          });

                          onDeleteOffer(off.OfferID, restoredProducts);
                        }
                      }}
                      className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="حذف الخصم واستعادة الأسعار الأصلية"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white font-cairo">{off.title}</h3>

              {/* Target Scope Badge */}
              <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-sans flex items-center justify-between">
                <span className="text-slate-400">النطاق:</span>
                <span className="font-bold text-rose-300">
                  {off.applyToAll
                    ? 'كافة أصناف المتجر (الكل)'
                    : off.targetProductIds && off.targetProductIds.length > 0
                    ? `${off.targetProductIds.length} أصناف محددة`
                    : off.targetCategoryIds && off.targetCategoryIds.length > 0
                    ? `فئة: ${off.targetCategoryIds.join(', ')}`
                    : off.targetGroupIds && off.targetGroupIds.length > 0
                    ? `مجموعة: ${off.targetGroupIds.join(', ')}`
                    : 'كافة الأصناف'}
                </span>
              </div>

              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>من {formatCleanDate(off.startDate)} إلى {formatCleanDate(off.endDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}

      {/* Wishlist Discount Alerts Sub-Tab (تنبيهات قائمة الرغبات عبر واتساب) */}
      {activeSubTab === 'wishlist-alerts' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5 font-cairo">
              <Users className="w-4 h-4 text-rose-400" />
              تتبع مفضلات العملاء وتنبيهات الخصم بالواتساب
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              هنا يمكنك تتبع كافة العملاء الذين اشتركوا في ميزة "تنبيهات المفضلة عبر واتساب". يمكنك بنقرة واحدة إرسال رسالة واتساب مجهزة ومحسّنة فورياً للعملاء الذين يمتلكون منتجات مخفّضة في قائمتهم!
            </p>
          </div>

          {wishlistSubs.length === 0 ? (
            <div className="py-12 bg-slate-900 border border-slate-800 border-dashed rounded-3xl text-center space-y-2">
              <Bell className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300 text-xs">لا يوجد أي اشتراكات نشطة حالياً</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                عند قيام العملاء بإضافة رقم هاتفهم في قائمة المفضلة بالمتجر، ستظهر بياناتهم هنا فوراً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlistSubs.map((sub, idx) => {
                // Find products of this sub that have an active discount in the store
                const subProductsWithStatus = sub.products.map((pSub: any) => {
                  const currentProd = products.find(p => p.ProductID === pSub.ProductID);
                  const hasDiscount = currentProd ? (currentProd.discount > 0 || (currentProd.originalPrice && currentProd.originalPrice > currentProd.salePrice)) : false;
                  return {
                    ...pSub,
                    exists: !!currentProd,
                    currentProd,
                    hasDiscount
                  };
                });

                const discountedCount = subProductsWithStatus.filter((p: any) => p.hasDiscount).length;

                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 relative group shadow-xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <h4 className="font-bold text-xs text-white flex items-center gap-1.5 font-cairo">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          {sub.name || 'عميل المتجر'}
                        </h4>
                        <span className="text-[10px] text-slate-500">تاريخ الاشتراك: {sub.date || 'اليوم'}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-mono text-xs text-indigo-400 font-bold block">{sub.phone}</span>
                        {discountedCount > 0 ? (
                          <span className="inline-block text-[9.5px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold animate-pulse mt-0.5">
                            🔥 {discountedCount} منتج مخفض!
                          </span>
                        ) : (
                          <span className="inline-block text-[9.5px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full mt-0.5">
                            لا يوجد منتجات مخفضة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subscribed Products List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      <span className="text-[10px] text-slate-400 font-bold block">المنتجات في قائمة المفضلة:</span>
                      {subProductsWithStatus.map((pSub: any, pIdx: number) => {
                        const originalPrice = pSub.currentProd ? (pSub.currentProd.originalPrice || pSub.currentProd.salePrice) : pSub.salePrice;
                        const currentPrice = pSub.currentProd ? pSub.currentProd.salePrice : pSub.salePrice;
                        const discount = pSub.currentProd ? pSub.currentProd.discount : 0;

                        return (
                          <div key={pIdx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-200 block truncate" title={pSub.name}>{pSub.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-emerald-400 font-bold">{currentPrice} ر.س</span>
                                {pSub.hasDiscount && (
                                  <span className="font-mono text-[9px] text-slate-500 line-through">{originalPrice} ر.س</span>
                                )}
                              </div>
                            </div>

                            {pSub.hasDiscount ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const savedPhone = sub.phone;
                                  const convertedPrice = currentPrice;
                                  const savedAmount = (originalPrice - currentPrice).toFixed(2);
                                  const waText = `👑 *أوفالي للأناقة* | تنبيه خصم المفضلة 🛍️\n\nبشرى سارة لك يا فندم! لقد رصدنا انخفاضاً في سعر المنتج الموجود في قائمتك المفضلة:\n\n✨ *${pSub.name}*\n💰 *السعر الحالي بعد الخصم:* ${convertedPrice} ر.س\n📉 *نسبة الخصم المطبق:* %${discount} (وفرت ${savedAmount} ر.س!)\n\nاضغط على الرابط للمعاينة والطلب المباشر:\n${window.location.origin}?product=${pSub.ProductID}\n\nنسعد لخدمتك وتلبية طلبك دوماً ❤️`;
                                  window.open(`https://wa.me/${savedPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`, '_blank');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-md"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>تنبيه واتساب</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                سعر عادي
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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
