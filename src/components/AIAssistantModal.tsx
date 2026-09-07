import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, X, Send, Sparkles, ShoppingBag, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { Product, CurrencyRate, AppSettings } from '../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: CurrencyRate;
  settings?: AppSettings;
  onSelectProduct?: (p: Product) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  settings,
  onSelectProduct
}) => {
  const storeName = settings?.storeName || 'المتجر';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `مرحباً بك في المساعد الذكي لـ ${storeName}! 🌸 أستطيع مساعدتك في اختيار أفضل المنتجات، معرفة تفاصيل التوصيل إلى المملكة العربية السعودية أو اليمن، واستفسارات الأسعار وسعر الصرف.`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currency: currency.currencyCode,
          storeName: storeName,
          storePhone: settings?.storePhone,
          storePhoneSaudi: settings?.storePhoneSaudi,
          storePhoneYemen: settings?.storePhoneYemen,
          deliveryInfo: settings?.deliveryInfo,
          productsSummary: products.map(p => `${p.name} - السعر: ${p.salePrice}`).join('\n')
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || `تفضل، كيف يمكنني مساعدتك أكثر في اختيار منتجات ${storeName}؟`,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Fallback local smart response logic
      let replyText = `يسعدنا خدمتك دائماً في ${storeName}! يمكنك تصفح التشكيلة وإضافتها إلى حقيبة التسوق، مع التوصيل السريع إلى كافة مدن المملكة واليمن.`;
      const lower = textToSend.toLowerCase();

      if (lower.includes('توصيل') || lower.includes('شحن') || lower.includes('يمن') || lower.includes('سعودية')) {
        replyText = '⚡ التوصيل متوفر لكافة مدن المملكة العربية السعودية (خلال 2-4 أيام عمل) وجميع محافظات اليمن (عدن، صنعاء، تعز، حضرموت) مع خيارات دفع آمنة وعند الاستلام.';
      } else if (lower.includes('سعر') || lower.includes('عملة') || lower.includes('دولار') || lower.includes('صرف')) {
        replyText = `💰 نقبل الدفع بالريال السعودي (ر.س)، الريال اليمني (ر.ي)، والدولار الأمريكي ($). عملتك الحالية هي ${currency.currencyName} (${currency.symbol}).`;
      } else if (lower.includes('عروض') || lower.includes('خصم')) {
        replyText = '🔥 يتوفر حالياً خصم خاص على التشكيلة المميزة باستعمال الكود الترويجي عند إتمام الطلب!';
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-theme-card border border-theme-card rounded-3xl max-w-lg w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden relative text-right text-theme-main"
      >
        
        {/* Header */}
        <div className="p-4 bg-theme-gradient text-white border-b border-theme-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-2xl shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-contrast flex items-center gap-2">
                مساعد {storeName} الذكي
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">AI Guide</span>
              </h3>
              <p className="text-[10px] text-white/80">مساعدك في اختيار المنتجات والأسعار والتوصيل</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-theme-inner/50 border-b border-theme-card flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs text-theme-subtext">
          <button
            onClick={() => handleSend('ما هي تفاصيل التوصيل إلى اليمن والسعودية؟')}
            className="flex items-center gap-1.5 px-3 py-1 bg-theme-card hover:bg-theme-inner text-theme-main rounded-full whitespace-nowrap border border-theme-card transition-all text-[11px]"
          >
            <Truck className="w-3.5 h-3.5 text-sky-500" />
            التوصيل والمدن
          </button>

          <button
            onClick={() => handleSend('ما هي العملات وسعر الصرف المتاح؟')}
            className="flex items-center gap-1.5 px-3 py-1 bg-theme-card hover:bg-theme-inner text-theme-main rounded-full whitespace-nowrap border border-theme-card transition-all text-[11px]"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            العملات والصرف
          </button>

          <button
            onClick={() => handleSend('اقترح لي أفضل الملابس والعروض الفاخرة')}
            className="flex items-center gap-1.5 px-3 py-1 bg-theme-card hover:bg-theme-inner text-theme-main rounded-full whitespace-nowrap border border-theme-card transition-all text-[11px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />
            أفضل العروض
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-theme-bg">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-theme-gradient text-white rounded-tr-none shadow-md'
                    : 'bg-theme-card text-theme-main rounded-tl-none border border-theme-card'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-theme-subtext mt-1 px-1 font-mono">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-theme-subtext text-xs bg-theme-card p-3 rounded-2xl border border-theme-card w-fit">
              <Bot className="w-4 h-4 text-theme-primary animate-bounce" />
              <span>جاري صياغة الإجابة...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 bg-theme-inner border-t border-theme-card flex items-center gap-2"
        >
          <input
            type="text"
            value={input || ""}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب استفسارك هنا..."
            className="flex-1 bg-theme-card border border-theme-card rounded-2xl px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary outline-none transition-all placeholder:text-theme-subtext"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-theme-gradient hover:opacity-90 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>

      </motion.div>
    </div>
  );
};
