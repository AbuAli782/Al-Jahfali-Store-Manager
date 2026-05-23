import React, { useState } from 'react';
import { ShoppingBag, Star, Smartphone, ShieldCheck, Heart, Share2, Copy, Check, MessageCircle, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { Product } from '../types';
import { SHOP_INFO } from '../data';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOrderNow: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  isDark?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  onOrderNow,
  isWishlisted = false,
  onToggleWishlist,
  isDark = true
}: ProductCardProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Calculate discount percentage if original price exists
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const whatsAppMessage = `السلام عليكم، أحببت مشاركة هذا المنتج المميز معك من محل الجحفلي للهواتف الذكية:\n\n*${product.arabicName}*\n💵 السعر: ${product.price.toLocaleString()} ر.ي\n\nلرؤية التفاصيل وحجزه:\n${productUrl}`;
  const whatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppMessage)}`;

  return (
    <article 
      className={`group relative flex flex-col rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 border-2 ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800/80 hover:border-amber-500/50 hover:shadow-[0_22px_45px_-12px_rgba(245,158,11,0.18)]' 
          : 'bg-white border-slate-100 shadow-md hover:border-amber-500/60 hover:shadow-[0_22px_45px_-12px_rgba(245,158,11,0.22)]'
      }`}
      dir="rtl"
    >
      {/* Badge container */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {product.isBestSeller && (
          <span className="px-3 py-1.5 text-[10px] font-black tracking-wide text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg shadow-md">
            الأكثر مبيعاً
          </span>
        )}
        {product.isNewArrival && (
          <span className="px-3 py-1.5 text-[10px] font-black tracking-wide text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-md">
            جديد لعام 2026
          </span>
        )}
        {product.isSpecialOffer && (
          <span className="px-3 py-1.5 text-[10px] font-black tracking-wide text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-lg shadow-md animate-pulse">
            تخفيض خاص
          </span>
        )}
      </div>

      {discountPercent > 0 && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[10.5px] font-mono font-black rounded-lg border ${
          isDark 
            ? 'text-amber-400 bg-slate-950/80 border-amber-500/30' 
            : 'text-amber-800 bg-amber-500/10 border-amber-500/35'
        }`}>
          وفر {discountPercent}%
        </div>
      )}

      {/* Image container with zoom effect */}
      <div 
        onClick={() => onViewDetails(product)}
        className={`relative pt-[85%] overflow-hidden cursor-pointer border-b ${
          isDark ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <img
          src={product.image}
          alt={product.arabicName}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-t opacity-40 group-hover:opacity-20 transition-opacity ${
          isDark ? 'from-slate-900 via-transparent' : 'from-slate-200/50 via-transparent'
        }`} />

        {/* Floating Share Button Trigger */}
        {copied && (
          <div className="absolute bottom-13 left-3 z-13 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-xl shadow-emerald-500/20 flex items-center gap-1.5 select-none border border-emerald-400/50 animate-fade-in">
            <Check className="h-3 w-3 shrink-0" />
            <span dir="rtl">تم نسخ الرابط!</span>
            <div className="absolute bottom-[-4px] left-3.5 w-2 h-2 bg-emerald-500 rotate-45 border-r border-b border-emerald-400/50"></div>
          </div>
        )}

        <button
          id={`share-trigger-btn-${product.id}`}
          onClick={async (e) => {
            e.stopPropagation();
            setIsRotating(true);
            setTimeout(() => setIsRotating(false), 600);
            await handleCopyLink(e);
            setIsShareOpen(true);
          }}
          className={`absolute bottom-3 left-3 z-10 flex items-center justify-center w-8.5 h-8.5 rounded-full backdrop-blur-md border transition-all duration-300 shadow-md ${
            copied 
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-400 scale-110" 
              : isDark
                ? "bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-300 hover:text-amber-400"
                : "bg-white/90 border-slate-200 hover:border-amber-500/50 hover:bg-slate-50 text-slate-700 hover:text-amber-600"
          }`}
          title="نسخ رابط المنتج والمشاركة"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 animate-bounce" />
          ) : (
            <Upload 
              className="h-3.5 w-3.5 transition-transform duration-500 ease-out" 
              style={{ transform: isRotating ? 'rotate(360deg)' : 'rotate(0deg)' }}
            />
          )}
        </button>

        {/* Floating Wishlist Heart Button */}
        <button
          id={`wishlist-toggle-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) {
              onToggleWishlist(product);
            }
          }}
          className={`absolute bottom-3 right-3 z-10 flex items-center justify-center w-8.5 h-8.5 rounded-full backdrop-blur-md border transition-all duration-300 shadow-md ${
            isWishlisted
              ? "bg-rose-950/90 border-rose-500/80 text-rose-500 scale-110 shadow-[0_4px_12px_rgba(244,63,94,0.3)]"
              : isDark
                ? "bg-slate-950/80 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 text-slate-300 hover:text-rose-400"
                : "bg-white/90 border-slate-200 hover:border-rose-500/50 hover:bg-slate-50 text-slate-755 hover:text-rose-500"
          }`}
          title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart className={`h-3.5 w-3.5 transition-transform duration-300 ${isWishlisted ? "fill-rose-500 stroke-[2] animate-pulse" : "stroke-[1.5]"}`} />
        </button>

        {/* Share Overlay Dashboard */}
        {isShareOpen && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsShareOpen(false);
            }}
            className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-3 transition-all duration-300"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsShareOpen(false);
              }}
              className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold transition hover:border-slate-700"
              title="إغلاق"
            >
              ✕
            </button>
            <span className="text-[11px] font-bold text-amber-500 mb-3 block text-center">مشاركة المنتج</span>
            <div className="flex flex-col gap-2 w-full max-w-[150px]" onClick={(e) => e.stopPropagation()}>
              <button
                id={`share-copy-btn-${product.id}`}
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 text-white py-2 px-3 rounded-lg text-[11px] transition duration-200"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">تم نسخ الرابط!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>نسخ رابط المنتج</span>
                  </>
                )}
              </button>
              
              <a
                id={`share-wa-btn-${product.id}`}
                href={whatsAppShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-2 px-3 rounded-lg text-[11px] font-extrabold transition duration-200 shadow-md animate-pulse"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>إرسال عبر الواتساب</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Details section */}
      <div className={`flex-1 p-5 sm:p-6 flex flex-col justify-between ${
        isDark ? 'bg-slate-900/40' : 'bg-white'
      }`}>
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-black mb-2.5">
            <span className={`px-2.5 py-1 rounded-md border ${
              isDark 
                ? 'bg-slate-950 text-amber-500 border-slate-800/80' 
                : 'bg-slate-50 text-amber-700 border-slate-200/70'
            }`}>
              {product.brand}
            </span>
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>4.9</span>
            </span>
          </div>

          {/* LARGE & CLEAR TEXT - Arabic Product Name */}
          <h3 
            onClick={() => onViewDetails(product)}
            className={`text-lg sm:text-xl font-black transition-colors duration-250 cursor-pointer line-clamp-1 mb-2 ${
              isDark ? 'text-white hover:text-amber-400' : 'text-slate-900 hover:text-amber-600'
            }`}
          >
            {product.arabicName}
          </h3>
          
          <p className={`text-xs sm:text-sm line-clamp-2 min-h-[2.75rem] mb-4 font-sans leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {product.description}
          </p>

          {/* Core Specs Highlights Container with high visual separation */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark 
              ? 'bg-slate-950/70 border-slate-800/50' 
              : 'bg-amber-50/20 border-amber-100/50'
          } mb-4 flex flex-col`}>
            <div className="space-y-2">
              {(showAllSpecs ? product.specs : product.specs.slice(0, 2)).map((spec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs transition-all duration-350 leading-relaxed">
                  <span className="text-amber-500 font-extrabold select-none mt-0.5">▪</span>
                  <span className={`font-medium ${
                    showAllSpecs 
                      ? isDark ? 'text-slate-205' : 'text-slate-800'
                      : 'line-clamp-1 ' + (isDark ? 'text-slate-300' : 'text-slate-700')
                  }`}>
                    {spec}
                  </span>
                </div>
              ))}
            </div>

            {product.specs.length > 2 && (
              <button
                id={`toggle-specs-btn-${product.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllSpecs(!showAllSpecs);
                }}
                className={`mt-3 pt-2 w-full text-center text-[10.5px] font-black border-t flex items-center justify-center gap-1 transition-colors ${
                  isDark 
                    ? 'border-slate-800/60 text-amber-500 hover:text-amber-400' 
                    : 'border-amber-100/40 text-amber-700 hover:text-amber-600'
                }`}
              >
                {showAllSpecs ? (
                  <>
                    <span>إخفاء المواصفات الفنية</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>عرض كافة المواصفات ({product.specs.length})</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pricing & Checkout Actions with prominent separation */}
        <div className={`border-t pt-4 ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <div className="flex items-end justify-between mb-4.5">
            <div>
              <span className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                السعر نقداً وفي المتناول
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isDark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  {product.price.toLocaleString()} <span className="text-xs font-sans mr-0.5">ر.ي</span>
                </span>
                
                {product.originalPrice && (
                  <span className={`text-xs line-through font-mono ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {product.originalPrice.toLocaleString()} ر.ي
                  </span>
                )}
              </div>
            </div>
            {product.stock <= 3 && (
              <span className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-md border ${
                isDark 
                  ? 'text-red-400 bg-red-500/5 border-red-500/15' 
                  : 'text-red-600 bg-red-50 border-red-200/60'
              }`}>
                متبقي {product.stock} فقط !
              </span>
            )}
          </div>

          {/* Highly Distinct action buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id={`add-to-cart-btn-${product.id}`}
              onClick={() => onAddToCart(product)}
              className={`flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-2xl text-xs font-black transition-all hover:scale-[1.03] active:scale-95 focus:outline-none border border-slate-205 ${
                isDark 
                  ? 'bg-slate-950 text-amber-400 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900' 
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>أضف للسلة</span>
            </button>
            <button
              id={`order-whatsapp-btn-${product.id}`}
              onClick={() => onOrderNow(product)}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 py-3 px-3.5 rounded-2xl text-xs font-black transition-all hover:scale-[1.03] active:scale-95 shadow-md focus:outline-none"
            >
              <span>اطلب فوراً</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
