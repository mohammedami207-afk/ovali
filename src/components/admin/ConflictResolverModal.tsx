import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Cloud, 
  HardDrive, 
  X, 
  RefreshCw, 
  Sparkles, 
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { Product, AppSettings } from '../../types';
import { fetchDataFromGoogleSheets, sendToGoogleAppsScriptWebApp } from '../../lib/googleSheetsAppsScript';
import { extractProductImages } from '../../lib/imageUtils';

interface ConflictItem {
  productID: string;
  localProduct: Product;
  cloudProduct: Product;
  differences: string[];
  chosenSource: 'local' | 'cloud';
}

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  localProducts: Product[];
  settings: AppSettings;
  onResolveConflicts: (resolvedProducts: Product[]) => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  onClose,
  localProducts,
  settings,
  onResolveConflicts
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [checked, setChecked] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkForConflicts();
    } else {
      setConflicts([]);
      setChecked(false);
    }
  }, [isOpen]);

  const checkForConflicts = async () => {
    setIsChecking(true);
    setChecked(false);
    setConflicts([]);

    try {
      let cloudProducts: Product[] = [];
      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        const res = await fetchDataFromGoogleSheets(settings.googleAppsScriptUrl);
        if (res.success && res.products) {
          cloudProducts = res.products;
        }
      }
      if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        const detectedConflicts: ConflictItem[] = [];

        localProducts.forEach((localPrd) => {
          const matchingCloud = cloudProducts.find((sp) => {
            return (
              (sp.ProductID && sp.ProductID.toLowerCase() === localPrd.ProductID.toLowerCase()) ||
              (sp.SKU && localPrd.SKU && sp.SKU.toLowerCase() === localPrd.SKU.toLowerCase())
            );
          });

          if (matchingCloud) {
            const diffs: string[] = [];
            if (matchingCloud.name && matchingCloud.name !== localPrd.name) {
              diffs.push(`الاسم: المحلي "${localPrd.name}" ↔ السحابي "${matchingCloud.name}"`);
            }
            if (matchingCloud.salePrice > 0 && Math.abs(matchingCloud.salePrice - localPrd.salePrice) > 0.01) {
              diffs.push(`سعر البيع: المحلي (${localPrd.salePrice} ر.س) ↔ السحابي (${matchingCloud.salePrice} ر.س)`);
            }
            if (matchingCloud.quantity !== localPrd.quantity) {
              diffs.push(`الكمية: المحلي (${localPrd.quantity}) ↔ السحابي (${matchingCloud.quantity})`);
            }

            if (diffs.length > 0) {
              detectedConflicts.push({
                productID: localPrd.ProductID,
                localProduct: localPrd,
                cloudProduct: matchingCloud,
                differences: diffs,
                chosenSource: 'local' // Default preference
              });
            }
          }
        });

        setConflicts(detectedConflicts);
      }
    } catch (err) {
      // Silently catch
    } finally {
      setIsChecking(false);
      setChecked(true);
    }
  };

  const handleSelectChoice = (productID: string, choice: 'local' | 'cloud') => {
    setConflicts((prev) =>
      prev.map((item) =>
        item.productID === productID ? { ...item, chosenSource: choice } : item
      )
    );
  };

  const handleSelectAllChoice = (choice: 'local' | 'cloud') => {
    setConflicts((prev) => prev.map((item) => ({ ...item, chosenSource: choice })));
  };

  const handleApplyResolution = async () => {
    setIsApplying(true);

    const updatedLocalList = localProducts.map((p) => {
      const conflict = conflicts.find((c) => c.productID === p.ProductID);
      if (conflict) {
        return conflict.chosenSource === 'cloud' ? conflict.cloudProduct : conflict.localProduct;
      }
      return p;
    });

    onResolveConflicts(updatedLocalList);

    // Sync resolved conflicts to Google Sheets
    if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      for (const item of conflicts) {
        const chosen = item.chosenSource === 'cloud' ? item.cloudProduct : item.localProduct;
        await sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
          action: 'save_product',
          product: chosen
        });
      }
    }

    setIsApplying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                محلل وتصفية تعارضات البيانات (Conflict Resolver)
              </h2>
              <p className="text-xs text-slate-400">
                فحص تطابق البيانات بين النظام المحلي وسحابة Supabase DB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {isChecking ? (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                جاري مقارنة بيانات المنتجات بين المحلي وسحابة Supabase DB...
              </p>
            </div>
          ) : checked && conflicts.length === 0 ? (
            <div className="py-12 text-center space-y-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-300">لا توجد أي تعارضات!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                جميع بيانات المنتجات متطابقة تماماً بين النظام المحلي وقاعدة بيانات Supabase DB. لا يتطلب الأمر أي تدخل.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch Actions Bar */}
              <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  تم العثور على ({conflicts.length}) منتجات ذات بيانات مختلفة:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAllChoice('local')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition font-medium flex items-center gap-1"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    اختيار المحلي للكل
                  </button>
                  <button
                    onClick={() => handleSelectAllChoice('cloud')}
                    className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition font-medium flex items-center gap-1"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    اختيار السحابي للكل
                  </button>
                </div>
              </div>

              {/* Conflict Item Cards */}
              <div className="space-y-3">
                {conflicts.map((item) => (
                  <div
                    key={item.productID}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold rounded-md border border-amber-500/20">
                          {item.productID}
                        </span>
                        <span className="font-semibold text-white text-sm">
                          {item.localProduct.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        SKU: {item.localProduct.SKU}
                      </div>
                    </div>

                    {/* Discrepancies List */}
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-slate-400 block mb-1">الفروقات المكتشفة:</span>
                      {item.differences.map((diff, idx) => (
                        <div key={idx} className="text-amber-300/90 font-mono text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          {diff}
                        </div>
                      ))}
                    </div>

                    {/* Selection Options Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Local Option */}
                      <div
                        onClick={() => handleSelectChoice(item.productID, 'local')}
                        className={`cursor-pointer p-3 rounded-xl border transition flex items-start gap-3 ${
                          item.chosenSource === 'local'
                            ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">النسخة المحلية (Local)</span>
                            {item.chosenSource === 'local' && (
                              <Check className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-slate-300 font-medium">{item.localProduct.name}</p>
                          <p className="text-slate-400 font-mono">{item.localProduct.salePrice} ر.س | كمية: {item.localProduct.quantity}</p>
                        </div>
                      </div>

                      {/* Cloud Option */}
                      <div
                        onClick={() => handleSelectChoice(item.productID, 'cloud')}
                        className={`cursor-pointer p-3 rounded-xl border transition flex items-start gap-3 ${
                          item.chosenSource === 'cloud'
                            ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-400">نسخة Supabase DB</span>
                            {item.chosenSource === 'cloud' && (
                              <Check className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <p className="text-slate-300 font-medium">{item.cloudProduct.name}</p>
                          <p className="text-slate-400 font-mono">{item.cloudProduct.salePrice} ر.س | كمية: {item.cloudProduct.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={checkForConflicts}
            disabled={isChecking}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            إعادة الفحص المباشر
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              إلغاء
            </button>
            {conflicts.length > 0 && (
              <button
                onClick={handleApplyResolution}
                disabled={isApplying}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                {isApplying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                اعتماد واختيار الحقيقة المحددة ({conflicts.length})
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
