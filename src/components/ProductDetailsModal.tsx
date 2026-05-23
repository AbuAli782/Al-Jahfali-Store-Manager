import { X, Smartphone, ShieldCheck, ShoppingBag, Send, Star, CheckCircle, Heart } from 'lucide-react';
import { Product } from '../types';
import { SHOP_INFO } from '../data';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOrderNow: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onOrderNow,
  isWishlisted = false,
  onToggleWishlist
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-3xl z-10 animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-500/20 px-3 py-1 rounded-full">
            تفاصيل ومواصفات الجهاز الرائد
          </span>
          <div className="flex items-center gap-2">
            <button
              id="modal-wishlist-toggle-btn"
              onClick={() => onToggleWishlist?.(product)}
              className={`p-1.5 rounded-full border transition scale-100 hover:scale-105 active:scale-95 focus:outline-none ${
                isWishlisted
                  ? 'bg-rose-950/85 border-rose-500 text-rose-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/30'
              }`}
              title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
            <button 
              id="close-details-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable description panel */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Visuals on the left */}
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                <img
                  src={product.image}
                  alt={product.arabicName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Guarantees Box */}
              <div className="mt-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ضمان تشغيل وصيانة متميز من محل الجحفلي</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>الهواتف أصلية 100% مستوردة ومفحوصة بالكامل</span>
                </div>
              </div>
            </div>

            {/* Specifications Form on the right */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-slate-850 border border-slate-800 text-slate-300 px-2.5 py-1 rounded">
                    {product.brand}
                  </span>
                  <span className="text-xs text-slate-400">تقييم: 4.9/5</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                  {product.arabicName}
                </h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {product.price.toLocaleString()} <span className="text-sm font-sans text-amber-500 mr-0.5">ر.ي</span>
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-slate-500 line-through font-mono">
                      {product.originalPrice.toLocaleString()} ر.ي
                    </span>
                  )}
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-5">
                  {product.description}
                </p>

                {/* Highly Tech Specification list */}
                <h4 className="text-xs font-bold text-amber-500/80 mb-2">المواصفات والخصائص التقنية:</h4>
                <ul className="space-y-2 mb-6">
                  {product.specs.map((spec, index) => (
                    <li key={index} className="flex gap-2 text-xs text-gray-300">
                      <span className="text-amber-500 select-none">•</span>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action grid (Stops at footer) */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">حالة التوفر بالمخزن:</span>
                  {product.stock > 0 ? (
                    <span className="text-emerald-400 font-bold">✓ متوفر حالياً بالمحل ({product.stock} أجهزة)</span>
                  ) : (
                    <span className="text-red-400 font-bold">غير متوفر حالياً - تواصل للطلب الخاص</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="modal-add-to-cart-btn"
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 py-3 rounded-xl text-xs font-bold shadow transition"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>أضف إلى السلة</span>
                  </button>
                  <button
                    id="modal-order-now-btn"
                    onClick={() => {
                      onOrderNow(product);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 py-3 rounded-xl text-xs font-black shadow transition-all hover:scale-[1.01]"
                  >
                    <Send className="h-4 w-4" />
                    <span>اطلب عبر واتساب</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer info banner */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-[10px] text-center text-slate-500">
          موقع المحل: {SHOP_INFO.location} | رقم التواصل: {SHOP_INFO.phone}
        </div>
      </div>
    </div>
  );
}
