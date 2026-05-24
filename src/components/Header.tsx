import { useState, useEffect } from 'react';
import { Smartphone, Laptop, Headphones, Search, ShoppingBag, Menu, X, ShieldAlert, PhoneCall, Heart, Sun, Moon } from 'lucide-react';
import { SHOP_INFO } from '../data';
import Logo from './Logo';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  wishlistCount: number;
  openWishlist: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openAdmin: () => void;
  isAdminLoggedIn: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  cartCount,
  openCart,
  wishlistCount,
  openWishlist,
  searchTerm,
  setSearchTerm,
  openAdmin,
  isAdminLoggedIn,
  isDark,
  onToggleTheme
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'all', label: 'الرئيسية' },
    { id: 'smartphones', label: 'هواتف جديدة' },
    { id: 'used_devices', label: 'مستعمل ومجدد' },
    { id: 'recharge_cards', label: 'باقات وبطاقات شحن' },
    { id: 'services', label: 'ورشة الصيانة والتتبع' },
    { id: 'offers', label: 'العروض الخاصة' },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? isDark 
          ? 'bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-amber-500/15 py-3' 
          : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200 py-3'
        : isDark
          ? 'bg-slate-950 py-4 border-b border-slate-900'
          : 'bg-white py-4 border-b border-gray-100'
    }`} dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Mobile Menu Icon */}
          <div className="flex md:hidden">
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md transition-colors focus:outline-none ${
                isDark 
                  ? 'text-gray-400 hover:text-amber-500 hover:bg-slate-900' 
                  : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
              }`}
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-95 transition-all" onClick={() => setCurrentTab('all')}>
            <Logo size={42} />
            <div>
              <h1 className={`text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-l bg-clip-text text-transparent ${
                isDark ? 'from-amber-400 via-yellow-205 to-white' : 'from-amber-600 via-amber-500 to-slate-905'
              }`}>
                الجحفلي
              </h1>
              <p className={`hidden sm:block text-[10px] font-black tracking-wider text-right -mt-0.5 ${
                isDark ? 'text-amber-500/80' : 'text-amber-600/90'
              }`}>
                للهواتف الذكية ومستلزماتها
              </p>
            </div>
          </div>

          {/* Search Input - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="desktop-search-input"
              type="text"
              placeholder="ابحث عن هاتف، شاحن، سماعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-10 pl-4 py-2 text-sm transition-all text-right rounded-full border focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 ${
                isDark 
                  ? 'bg-slate-900/90 text-white border-slate-800/80' 
                  : 'bg-slate-100 text-slate-800 border-gray-300'
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-amber-500 hover:text-amber-400 font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Desktop Navigation Link */}
          <nav className="hidden lg:flex items-center space-x-1 space-x-reverse text-sm font-black">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`nav-${link.id}`}
                onClick={() => {
                  setCurrentTab(link.id);
                  setSearchTerm(''); // Clear search on tab switch
                }}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentTab === link.id
                    ? 'text-amber-500 bg-amber-550/10 border-b-2 border-amber-500 rounded-b-none'
                    : isDark
                      ? 'text-gray-300 hover:text-amber-400 hover:bg-slate-900'
                      : 'text-slate-700 hover:text-amber-600 hover:bg-slate-105'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* User / Cart Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className={`flex items-center justify-center p-2 rounded-full border transition-all shadow-md focus:outline-none hover:scale-110 active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:border-amber-500/50'
                  : 'bg-slate-100 border-gray-200 text-amber-500 hover:border-amber-400'
              }`}
              title={isDark ? "تغيير للوضع الفاتح" : "تغيير للوضع الداكن"}
            >
              {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {/* Direct Call Button */}
            <a
              id="quick-call-link"
              href={`tel:${SHOP_INFO.phone}`}
              className={`flex items-center justify-center p-2 rounded-full border transition-all shadow-md focus:outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-amber-500 text-amber-400 hover:text-amber-300'
                  : 'bg-slate-100 border-gray-200 hover:border-amber-400 text-amber-600 hover:text-amber-700'
              }`}
              title="اتصل بنا فوراً"
            >
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>

            {/* Admin Badge/Access */}
            <button
              id="admin-panel-btn"
              onClick={openAdmin}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-black transition-all ${
                isAdminLoggedIn
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-505 hover:bg-emerald-500/20'
                  : isDark
                    ? 'bg-slate-900 border border-slate-800 text-gray-400 hover:text-amber-400 hover:border-amber-500/30'
                    : 'bg-slate-100 border border-gray-200 text-slate-600 hover:text-amber-650 hover:border-amber-500/30'
              }`}
              title="لوحة الإدارة لإضافة وتحديث الهواتف والأسعار"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">التحكم</span>
            </button>

            {/* Wishlist Trigger */}
            <button
              id="wishlist-trigger-btn"
              onClick={openWishlist}
              className={`relative flex items-center justify-center p-2 rounded-full border transition-all font-bold shadow-md hover:scale-105 active:scale-95 focus:outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50 text-rose-500'
                  : 'bg-slate-100 border-gray-200 hover:border-amber-400 text-rose-500'
              }`}
              title="قائمة المفضلة"
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow ring-2 ring-slate-900 animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button
              id="cart-trigger-btn"
              onClick={openCart}
              className="relative flex items-center justify-center p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all font-bold shadow-md hover:scale-105 active:scale-95 focus:outline-none"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow ring-2 ring-amber-550 animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Search Bar - Mobile View */}
        <div className="flex md:hidden mt-3 relative">
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="mobile-search-input"
            type="text"
            placeholder="ابحث عن هاتف أو إكسسوار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pr-10 pl-4 py-2 border rounded-full focus:outline-none focus:border-amber-500 text-sm text-right ${
              isDark 
                ? 'bg-slate-900 text-white border-slate-800' 
                : 'bg-slate-105 text-slate-800 border-gray-200'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-amber-500"
            >
              مسح
            </button>
          )}
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 w-full shadow-2xl z-50 animate-fade-in divide-y ${
          isDark 
            ? 'bg-slate-950/98 border-t border-slate-900 divide-slate-900 shadow-slate-950/60' 
            : 'bg-white/98 border-t border-slate-200 divide-slate-100 shadow-slate-200/50'
        }`}>
          <div className="px-3 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`mobile-nav-${link.id}`}
                onClick={() => {
                  setCurrentTab(link.id);
                  setSearchTerm('');
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-right px-4 py-3 rounded-md text-base font-black transition-all ${
                  currentTab === link.id
                    ? 'text-amber-500 bg-amber-500/10 border-r-4 border-amber-500'
                    : isDark
                      ? 'text-gray-300 hover:text-amber-400 hover:bg-slate-900'
                      : 'text-slate-700 hover:text-amber-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
