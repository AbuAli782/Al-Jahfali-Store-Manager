import React from 'react';
import { Heart, X, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onRemoveItem: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOpenFullPageWishlist?: () => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveItem,
  onAddToCart,
  onViewDetails,
  onOpenFullPageWishlist
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" dir="rtl">
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
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg font-bold text-white">قائمة المفضلة</h2>
            <span className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full">
              {wishlistItems.length} أجهزة
            </span>
          </div>
          <button 
            id="close-wishlist-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        {wishlistItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
              <Heart className="h-6 w-6" />
            </div>
            <p className="text-gray-400 text-base font-medium">قائمة المفضلة فارغة</p>
            <p className="text-xs text-slate-500 mt-1">تصفح الهواتف وعروضنا الرائعة، واضغط على زر القلب لحفظها هنا!</p>
            <button
              id="wishlist-browse-btn"
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-sm font-bold shadow-md transition"
            >
              استعراض الهواتف والأجهزة
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {wishlistItems.map((product) => (
              <div 
                key={product.id}
                className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-inner group transition-all hover:border-rose-500/20"
              >
                {/* Product Image and Details trigger */}
                <div 
                  onClick={() => {
                    onViewDetails(product);
                    onClose();
                  }}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-800 bg-slate-900 flex-shrink-0 cursor-pointer overflow-hidden relative"
                >
                  <img
                    src={product.image}
                    alt={product.arabicName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info and Actions */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 
                        onClick={() => {
                          onViewDetails(product);
                          onClose();
                        }}
                        className="text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-amber-400 cursor-pointer duration-200"
                      >
                        {product.arabicName}
                      </h4>
                      <button
                        id={`wishlist-remove-btn-${product.id}`}
                        onClick={() => onRemoveItem(product.id)}
                        className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors duration-200"
                        title="حذف من المفضلة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-md border border-amber-500/10">
                        {product.brand}
                      </span>
                      {product.stock <= 3 && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded border border-red-500/10">
                          متبقي {product.stock} فقط !
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price and Cart Integration */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-900">
                    <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                      {product.price.toLocaleString()} ر.ي
                    </span>
                    
                    <button
                      id={`wishlist-add-cart-btn-${product.id}`}
                      onClick={() => {
                        onAddToCart(product);
                        // Optional: Keep drawer open or provide feedback
                      }}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>أضف للسلة</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer Footer Status */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-center space-y-2.5">
          {wishlistItems.length > 0 && onOpenFullPageWishlist && (
            <button
              id="wishlist-go-fullpage-btn"
              onClick={() => {
                onOpenFullPageWishlist();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-rose-505/10 bg-rose-500/10 hover:bg-rose-500/15 text-rose-450 text-rose-400 border border-rose-500/20 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <span>عرض في صفحة كاملة مستقلة</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <p className="text-[10px] text-gray-550 text-gray-500">
            أجهزتك المفضلة يتم حفظها تلقائياً على جهازك الحالي لتصفح أسهل وشراء أسرع.
          </p>
        </div>

      </div>
    </div>
  );
}
