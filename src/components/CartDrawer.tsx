import React, { useState, FormEvent } from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';
import { SHOP_INFO } from '../data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);

  if (!isOpen) return null;

  const totalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckoutViaWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!userName.trim() || !userAddress.trim()) {
      alert('الرجاء تعبئة الاسم والعنوان لإكمال الطلب عبر واتساب.');
      return;
    }

    // Build the formatted Arabic text for WhatsApp
    let messageText = `السلام عليكم ورحمة الله وبركاته،\n`;
    messageText += `يا محل *الجحفلي للهواتف الذكية ومستلزماتها*، أود تقديم طلب شراء جديد من الموقع الإلكتروني:\n\n`;
    messageText += `📦 *تفاصيل الطلب:*\n`;
    messageText += `-------------------------------------------\n`;
    
    cartItems.forEach((item, index) => {
      messageText += `${index + 1}. *${item.product.arabicName}*\n`;
      messageText += `    العدد: ${item.quantity}  |  السعر الفردي: ${item.product.price.toLocaleString()} ر.ي  |  المجموع: ${(item.product.price * item.quantity).toLocaleString()} ر.ي\n`;
    });
    
    messageText += `-------------------------------------------\n`;
    messageText += `💵 *المجموع الإجمالي النهائي:* ${totalPrice.toLocaleString()} ر.ي\n\n`;
    messageText += `👤 *معلومات الزبون:*\n`;
    messageText += `- *الاسم:* ${userName.trim()}\n`;
    messageText += `- *العنوان بالتفصيل:* ${userAddress.trim()}\n`;
    if (userNotes.trim()) {
      messageText += `- *ملاحظات خاصة:* ${userNotes.trim()}\n`;
    }
    messageText += `\n*شكراً لكم وسأنتظر تواصلكم لتأكيد الاستلام والتوصيل.*`;

    // Encode text to URI standard
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${SHOP_INFO.whatsapp}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Set state ordered
    setIsOrdered(true);
    setTimeout(() => {
      onClearCart();
      setIsOrdered(false);
      onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 h-full flex flex-col shadow-2xl z-10 border-r border-slate-800 animate-slide-left">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-amber-400" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {cartItems.length}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white">سلة المشتريات</h2>
          </div>
          <button 
            id="close-cart-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        {isOrdered ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-900 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">تم تجهيز طلبك بنجاح!</h3>
            <p className="text-gray-300 text-sm max-w-xs mb-4">
              تم توجيه قائمة المشتريات إلى واتساب المحل الرسمي لتأكيد الشحن والتسليم في العاصمة صنعاء.
            </p>
            <span className="text-xs text-amber-500 font-mono">* ثواني وسيتم تفريغ السلة تلقائياً...</span>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-gray-400 text-base font-medium">سلة المشتريات فارغة تماماً</p>
            <p className="text-xs text-slate-500 mt-1">تصفح أقسامنا الفاخرة وأضف الهواتف وإكسسواراتها فوراً</p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold shadow-md transition"
            >
              استعراض الهواتف
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {cartItems.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-inner group transition-all"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.arabicName}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {item.product.arabicName}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-gray-500 hover:text-red-400 p-0.5 rounded transition"
                          title="حذف من السلة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">
                        {item.product.brand}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => item.quantity > 1 && onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-6 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {(item.product.price * item.quantity).toLocaleString()} ر.ي
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form & Pricing Panel */}
            <div className="bg-slate-950 border-t border-slate-800 p-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>عدد الأجهزة الإجمالي:</span>
                  <span className="font-mono text-white">{cartItems.reduce((acc, item) => acc + item.quantity, 0)} قطعة</span>
                </div>
                <div className="flex justify-between items-end border-t border-slate-950 pt-2">
                  <span className="text-sm text-slate-300 font-bold">المجموع الإجمالي:</span>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">{totalPrice.toLocaleString()} ر.ي</span>
                </div>
              </div>

              {/* Order Information Fields */}
              <form onSubmit={handleCheckoutViaWhatsApp} className="space-y-3">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400/90 border-b border-slate-800 pb-1.5">
                    معلومات استلام الطلب والشحن:
                  </h3>
                  <div>
                    <label htmlFor="user-name" className="block text-[11px] text-gray-400 mb-1">
                      اسم المشتري بالكامل <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      required
                      placeholder="مثال: أحمد عبد الله الجحفلي"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-address" className="block text-[11px] text-gray-400 mb-1">
                      عنوان التوصيل بصنعاء بالتفصيل <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="user-address"
                      type="text"
                      required
                      placeholder="مثال: صنعاء - دارس - وراء الجولة"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-notes" className="block text-[11px] text-gray-400 mb-1">
                      ملاحظات أو مواصفات خاصة (اختياري)
                    </label>
                    <textarea
                      id="user-notes"
                      rows={2}
                      placeholder="مثال: أريد لون تيتانيوم طبيعي، مع لاصقة حماية هدية..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right resize-none"
                    />
                  </div>
                </div>

                <button
                  id="final-checkout-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 py-3.5 rounded-xl text-sm font-black transition-all hover:scale-[1.01] shadow-lg shadow-amber-500/10 focus:outline-none"
                >
                  <Send className="h-4 w-4" />
                  <span>إرسال الطلب ومتابعة الشراء عبر واتساب</span>
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
