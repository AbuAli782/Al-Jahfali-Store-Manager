import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Laptop, Headphones, ShieldCheck, Truck, Sparkles, MessageSquare, 
  MapPin, Phone, Award, Heart, ScrollText, Filter, Star, HelpCircle, RefreshCw, ChevronLeft, Calendar
} from 'lucide-react';

import { Product, CartItem, Testimonial, Banner } from './types';
import { INITIAL_PRODUCTS, INITIAL_BANNERS, INITIAL_TESTIMONIALS, SHOP_INFO } from './data';

import Header from './components/Header';
import BannerSlider from './components/BannerSlider';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ProductDetailsModal from './components/ProductDetailsModal';
import AboutContact from './components/AboutContact';
import AdminPanel from './components/AdminPanel';
import { 
  dbGetProducts, dbGetTestimonials, dbSaveBooking, dbGetJobs, dbGetExchangeRates, dbGetJob 
} from './lib/db';

export default function App() {
  // Page Navigation State
  const [currentTab, setCurrentTab] = useState('all');

  // Theme State (Dark mode default)
  const [isDark, setIsDark] = useState(true);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Dynamic SEO Title & Description Updater based on Selected Tab
  useEffect(() => {
    let title = "محلات الجحفلي للهواتف الذكية ومستلزماتها | بيع وصيانة الهواتف بصنعاء";
    let desc = "الموقع الرسمي لمحلات الجحفلي للهواتف الذكية ومستلزماتها في دارس، صنعاء، اليمن. بيع وشراء أحدث الهواتف الجديدة والمستعملة بضمان، وشحن باقات ورصيد، وورشة صيانة متطورة.";

    switch (currentTab) {
      case 'all':
        title = "محلات الجحفلي للهواتف الذكية ومستلزماتها | بيع وصيانة الهواتف بصنعاء";
        desc = "الموقع الرسمي لمحلات الجحفلي للهواتف الذكية ومستلزماتها في دارس، صنعاء، اليمن. بيع وشراء أحدث الهواتف الجديدة والمستعملة بضمان، وشحن باقات ورصيد، وورشة صيانة متطورة.";
        break;
      case 'smartphones':
        title = "معرض الهواتف الذكية الجديدة كلياً بضمان الوكلاء | محلات الجحفلي";
        desc = "تصفح أحدث الهواتف الذكية الجديدة كلياً بضمان الوكلاء الرسميين وبأفضل الأسعار المنافسة في صنعاء، اليمن. سامسونج، آبل، شاومي، وأحدث الإصدارات العالمية.";
        break;
      case 'used_devices':
        title = "الأجهزة المستعملة والمجددة المضمونة 100% | محلات الجحفلي";
        desc = "نوفر أجهزة ذكية مستعملة ومجددة تحت إشراف هندسي دقيق وبضمان محل حقيقي. تصفح التشكيلة الفاخرة المتاحة في صنعاء.";
        break;
      case 'recharge_cards':
        title = "باقات وبطاقات شحن الرصيد الفوري والإنترنت | محلات الجحفلي";
        desc = "شحن باقات سوبر يمن موبايل، سبأفون، يو، وكروت شحن الإنترنت والشبكات بصنعاء بشكل فوري بأفضل الأسعار وبأمان تام.";
        break;
      case 'services':
        title = "ورشة الصيانة الاحترافية وتتبع الأجهزة بالـ QR | محلات الجحفلي";
        desc = "تتبع صيانة جهازك مباشرة بإدخل رقم الكود أو مسح رمز QR الصيانة. احجز موعد صيانة لهاتفك من المنزل بضمان محلات الجحفلي.";
        break;
      case 'offers':
        title = "العروض الحصرية والتخفيضات الكبرى اليومية | محلات الجحفلي";
        desc = "اغتنم الفرص الذهبية والخصومات الكبرى على الهواتف والسماعات والشواحن في محلات الجحفلي للهواتف في صنعاء.";
        break;
      case 'wishlist':
        title = "قائمة الأجهزة المفضلة لديك | محلات الجحفلي";
        desc = "قائمتك المفضلة لتصفح أسرع وحفظ الأجهزة ومتابعتها وطلبها بنقرة واحدة عبر واتساب.";
        break;
      default:
        break;
    }

    document.title = title;
    
    // Dynamically update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }, [currentTab]);

  // Application Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [banners] = useState<Banner[]>(INITIAL_BANNERS);

  // Cart & UI Overlay States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1500000);
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-asc', 'price-desc', 'best-seller'

  // Maintenance Track States
  const [trackCodeInput, setTrackCodeInput] = useState('');
  const [trackedJob, setTrackedJob] = useState<any | null>(null);
  const [trackError, setTrackError] = useState('');

  // Currency Converter States
  const [convUSDInput, setConvUSDInput] = useState('');
  const [convSARInput, setConvSARInput] = useState('');
  const [exchangeRates, setExchangeRates] = useState({
    usdBuy: 530,
    sarBuy: 140,
    usdSell: 535,
    sarSell: 141
  });

  // Maintenance Booking States
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookDevice, setBookDevice] = useState('');
  const [bookFault, setBookFault] = useState('');
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  // 1. Initialize DB asynchronously from persistent storage (Live Firestore / LocalStorage)
  useEffect(() => {
    async function loadRealData() {
      try {
        const liveProducts = await dbGetProducts();
        setProducts(liveProducts);

        const liveReviews = await dbGetTestimonials();
        setTestimonials(liveReviews);

        const liveRates = await dbGetExchangeRates();
        if (liveRates) {
          setExchangeRates(liveRates);
        }

        // Auto-open product details if shared via URL parameters
        try {
          const params = new URLSearchParams(window.location.search);
          const sharedProductId = params.get('product') || params.get('p');
          if (sharedProductId) {
            const matchedProduct = liveProducts.find(p => String(p.id) === sharedProductId);
            if (matchedProduct) {
              setSelectedProduct(matchedProduct);
            }
          }
        } catch (urlErr) {
          console.warn('Could not parse shared product url param:', urlErr);
        }
      } catch (err) {
        console.warn("Dynamic DB loading warnings: ", err);
      }
    }

    loadRealData();

    // Load Cart from cache
    const savedCart = localStorage.getItem('aljahfali_cart_v2');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        setCartItems([]);
      }
    }

    // Load Wishlist from cache
    const savedWishlist = localStorage.getItem('aljahfali_wishlist_v2');
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (e) {
        setWishlistItems([]);
      }
    }
  }, []);

  // Sync Cart with LocalStorage on mutation
  const updateCartState = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('aljahfali_cart_v2', JSON.stringify(newCart));
  };

  // Sync Wishlist with LocalStorage on mutation
  const handleToggleWishlist = (product: Product) => {
    const isAlreadyIn = wishlistItems.some(item => item.id === product.id);
    let updated: Product[];
    if (isAlreadyIn) {
      updated = wishlistItems.filter(item => item.id !== product.id);
    } else {
      updated = [...wishlistItems, product];
    }
    setWishlistItems(updated);
    localStorage.setItem('aljahfali_wishlist_v2', JSON.stringify(updated));
  };

  // 2. Admin operations
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    localStorage.setItem('aljahfali_products_v2', JSON.stringify(updated));
    setIsAdminLoggedIn(true);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    localStorage.setItem('aljahfali_products_v2', JSON.stringify(updated));
    setIsAdminLoggedIn(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    localStorage.setItem('aljahfali_products_v2', JSON.stringify(updated));
    setIsAdminLoggedIn(true);
  };

  const handleResetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.setItem('aljahfali_products_v2', JSON.stringify(INITIAL_PRODUCTS));
  };

  const handleAddReview = (name: string, rating: number, comment: string) => {
    const newReview: Testimonial = {
      id: `review-${Date.now()}`,
      name,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [...testimonials, newReview];
    setTestimonials(updated);
    localStorage.setItem('aljahfali_reviews_v2', JSON.stringify(updated));
  };

  // 3. Cart operations
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updateCartState(updated);
    } else {
      const updated = [...cartItems, { product, quantity: 1 }];
      updateCartState(updated);
    }
    // Open Cart drawer for immediate pleasant UX feedback
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const updated = cartItems.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    updateCartState(updated);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updated = cartItems.filter(item => item.product.id !== productId);
    updateCartState(updated);
  };

  const handleClearCart = () => {
    updateCartState([]);
  };

  // 4. Direct Checkout Link generation
  const handleOrderNowDirectly = (product: Product) => {
    const message = `السلام عليكم ورحمة الله،\n` +
                    `يا محل *الجحفلي للهواتف الذكية ومستلزماتها*، أود طلب هذا الجهاز تواصل سريع عبر الموقع:\n` +
                    `📱 *الجهاز:* ${product.arabicName}\n` +
                    `💵 *السعر التنافسي:* ${product.price.toLocaleString()} ر.ي (ريال يمني)\n` +
                    `الرجاء التواصل لتأكيد التجهيز والتسليم في صنعاء.\n` +
                    `رابط المنتج: ${product.image}`;
    window.open(`https://wa.me/${SHOP_INFO.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Deep Link CTA action click
  const handleBannerActionClick = (productId?: string) => {
    if (productId) {
      const matched = products.find(p => p.id === productId);
      if (matched) {
        setSelectedProduct(matched);
        return;
      }
    }
    // Fallback to special offers tab
    setCurrentTab('offers');
  };

  // Calculate unique brands for filtering lists
  const availableBrands = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  // 5. Filter Products dynamically based on view parameters and Search Keyword
  const getFilteredProducts = () => {
    return products.filter(p => {
      // Tab category filter
      if (currentTab === 'smartphones' && p.category !== 'smartphones') return false;
      if (currentTab === 'used_devices' && p.category !== 'used_devices') return false;
      if (currentTab === 'recharge_cards' && p.category !== 'recharge_cards') return false;
      if (currentTab === 'offers' && !p.isSpecialOffer) return false;

      // Brand filter
      if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;

      // Maximum Price Filter
      if (p.price > maxPrice) return false;

      // Text/Keyword Search Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesArabic = p.arabicName.toLowerCase().includes(query);
        const matchesEnglish = p.name.toLowerCase().includes(query);
        const matchesBrand = p.brand.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        if (!matchesArabic && !matchesEnglish && !matchesBrand && !matchesDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'best-seller') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return 0; // default order
    });
  };

  const filteredCatalog = getFilteredProducts();

  // Get lists for homepage showcase clusters
  const bestSellersShowcase = products.filter(p => p.isBestSeller).slice(0, 4);
  const newArrivalsShowcase = products.filter(p => p.isNewArrival).slice(0, 4);
  const specialOffersShowcase = products.filter(p => p.isSpecialOffer || (p.originalPrice && p.originalPrice > p.price)).slice(0, 4);

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      
      {/* 1. Universal Top Header bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistItems.length}
        openWishlist={() => setIsWishlistOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={(term) => {
          setSearchTerm(term);
          if (term.trim() !== '' && !['smartphones', 'electronics', 'accessories'].includes(currentTab)) {
            // Pivot to 'smartphones' view automatically if they search from general home/about tabs to show catalogs
            setCurrentTab('smartphones');
          }
        }}
        openAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Page Content Router */}
      <main className="flex-grow">
        
        {/* VIEW A: LANDING PAGE (الرئيسية) */}
        {currentTab === 'all' && (
          <div className="space-y-12">
            
            {/* Sliding promotional headers */}
            <BannerSlider 
              banners={banners} 
              onActionClick={handleBannerActionClick} 
            />

            {/* Quick trust metrics icons layout (No tech logs lint, purely beautiful values) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3.5 transition hover:scale-[1.01]">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">ضمان حقيقي 100%</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">ثقة ومصداقية لأكثر من 10 سنوات</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3.5 transition hover:scale-[1.01]">
                  <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">توصيل آمن بصنعاء</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">لباب منزلك أو مقر عملك</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3.5 transition hover:scale-[1.01]">
                  <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl border border-pink-500/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">المدير جمال الجحفلي</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">إشراف عائلي ومصداقية بالتعامل</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3.5 transition hover:scale-[1.01]">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">دعم وتجهيز سريع</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">تواصل مباشر لخدمتك على مدار الساعة</p>
                  </div>
                </div>

              </div>
            </section>

            {/* Visual taxonomy shortcuts */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-center md:text-right mb-6">
                <span className="text-xs text-amber-500 font-bold tracking-widest block mb-1">تسوق حسب فئة احتياجك</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">الأقسام الفاخرة المتاحة</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div 
                  onClick={() => setCurrentTab('smartphones')}
                  className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/35 transition"
                >
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 duration-350" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400')` }} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 right-4 text-right">
                    <Smartphone className="h-6 w-6 text-amber-400 mb-2" />
                    <h4 className="text-base font-bold text-white">قسم الهواتف الذكية</h4>
                    <p className="text-xs text-slate-400">جميع الإصدارات الجديدة بضمان الوكلاء الأصليين</p>
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentTab('electronics')}
                  className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/35 transition"
                >
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 duration-350" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=400')` }} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 right-4 text-right">
                    <Laptop className="h-6 w-6 text-teal-400 mb-2" />
                    <h4 className="text-base font-bold text-white">قسم الأجهزة الإلكترونية</h4>
                    <p className="text-xs text-slate-400">ساعات ذكية، لابتوبات ومكبرات صوت ممتازة</p>
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentTab('accessories')}
                  className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/35 transition"
                >
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 duration-350" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400')` }} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 right-4 text-right">
                    <Headphones className="h-6 w-6 text-pink-400 mb-2" />
                    <h4 className="text-base font-bold text-white">إكسسوارات الهواتف الفاخرة</h4>
                    <p className="text-xs text-slate-400">جرابات سيليكون، شواحن ولاصقات ضد الكسر</p>
                  </div>
                </div>

              </div>
            </section>

            {/* SHOWCASE SECTION 1: BEST SELLERS (الأكثر مبيعاً) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-amber-500 font-bold block">مقتنيات النخبة الأكثر موثوقية</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-1.5">
                    <span>الهواتف الذكية الأكثر مبيعا</span>
                    <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setCurrentTab('smartphones');
                    setSortBy('best-seller');
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestSellersShowcase.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onOrderNow={handleOrderNowDirectly}
                    isWishlisted={wishlistItems.some(item => item.id === prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isDark={isDark}
                  />
                ))}
              </div>
            </section>

            {/* Middle Welcome banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="z-10 text-right max-w-xl">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                    أهلاً بكم في مجلة الجحفلي لبيع وصيانة الهواتف
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    تحت قيادة <b>الأستاذ جمال الجحفلي</b>، نلتزم منذ سنوات بمقرنا في العاصمة صنعاء - دارس على الخط العام بتقديم أعلى درجات الخدمة. نوفر لكم تشكيلة واسعة من الهواتف الذكية، وأحدث السماعات السلكية واللاسلكية، مع توفر خيارات التراسل المباشر والطلب السهل عبر واتساب.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-mono text-xs font-semibold">📍 صنعاء - دارس - الخط العام</span>
                    <span className="text-slate-500 font-mono text-xs">|</span>
                    <span className="text-amber-500 font-mono text-xs font-semibold">📞 781831833</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setCurrentTab('contact')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition"
                  >
                    تواصل معنا أو زر موقعنا
                  </button>
                  <a
                    href="https://wa.me/967781831833"
                    target="_blank"
                    rel="noreferrer"
                    className="text-center text-slate-400 hover:text-white text-xs border border-slate-800 hover:border-amber-500/20 py-2 rounded-xl transition"
                  >
                    محادثة واتساب سريعة
                  </a>
                </div>
              </div>
            </section>

            {/* SHOWCASE SECTION 2: SPECIAL OFFERS (العروض والتخفيضات) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-rose-500 font-bold block">فرص ذهبية بخصومات حقيقية</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">العروض المخفضة الكبرى</h3>
                </div>
                <button 
                  onClick={() => setCurrentTab('offers')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                >
                  <span>عرض جميع العروض</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {specialOffersShowcase.length > 0 ? (
                  specialOffersShowcase.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onAddToCart={handleAddToCart}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      onOrderNow={handleOrderNowDirectly}
                      isWishlisted={wishlistItems.some(item => item.id === prod.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isDark={isDark}
                    />
                  ))
                ) : (
                  <p className="col-span-4 text-center text-xs text-slate-550">ستُدرَج عروض إضافية خصيصاً قريباً جداً.</p>
                )}
              </div>
            </section>

            {/* SHOWCASE SECTION 3: NEW ARRIVALS (وصل حديثاً) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-teal-400 font-bold block">مواكبة الهواتف العالمية فور صدورها</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">أحدث الأجهزة ونسخ العام الحالي</h3>
                </div>
                <button 
                  onClick={() => {
                    setCurrentTab('smartphones');
                    setSortBy('default');
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                >
                  <span>استكشف الجديد</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivalsShowcase.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onOrderNow={handleOrderNowDirectly}
                    isWishlisted={wishlistItems.some(item => item.id === prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isDark={isDark}
                  />
                ))}
              </div>
            </section>

            {/* Testimonials Review widget embedded inside Home */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-10">
              <div className="bg-slate-900 border border-slate-850 p-6 sm:p-10 rounded-3xl">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <Star className="h-8 w-8 text-amber-500 mx-auto fill-amber-500 mb-2" />
                  <h3 className="text-xl sm:text-2xl font-black text-white">شركاء النجاح يعبرون عن الجحفلي</h3>
                  <p className="text-xs text-slate-400 mt-1">نعتز بثقتكم ونفخر بآراء زبائننا عبر صنعاء وباقي مدن يمننا الحبيب</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonials.slice(0, 3).map((test) => (
                    <div key={test.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                      <div className="flex gap-0.5 text-amber-500 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < test.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-800'}`} />
                        ))}
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4">
                        "{test.comment}"
                      </p>
                      <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-amber-400 font-bold border border-slate-800">
                          {test.name[0]}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">{test.name}</span>
                          <span className="block text-[10px] text-slate-500">{test.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <button 
                    onClick={() => setCurrentTab('about')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold border-b border-amber-500 pb-0.5"
                  >
                    قراءة كافة الآراء أو ترك تقييمك الخاص
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VIEW B: PRODUCT CATALOG PAGES (هواتف ذكية - مستعمل ومجدد - باقات وكروت شحن) */}
        {['smartphones', 'used_devices', 'recharge_cards', 'offers'].includes(currentTab) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
            
            {/* Page title panel with deep blue royal aesthetics */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/20 p-6 rounded-2xl border border-slate-800 text-right">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {currentTab === 'smartphones' && 'قسم الهواتف الذكية الجديدة كلياً'}
                {currentTab === 'used_devices' && 'قسم الأجهزة المستعملة والمجددة بضمان'}
                {currentTab === 'recharge_cards' && 'شحن باقات ورصيد فوري (يمن موبايل - سبأفون - يو - إنترنت)'}
                {currentTab === 'offers' && 'العروض الحصرية والتخفيضات الكبرى'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                تصفح الكتالوج الفاخر المعتمد بأوثق الأسعار والخدمات الموزعة برعاية الأستاذ جمال الجحفلي.
              </p>
            </div>

            {/* Filter Tools Widget (Dynamic sorting & taxonomy) */}
            <div className="bg-slate-900 border border-slate-850 p-4 sm:p-5 rounded-2xl space-y-4">
              
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-305 flex items-center gap-1.5 py-1">
                  <Filter className="h-4 w-4 text-amber-500" />
                  <span>تصفية وفرز الكتالوج المتقدم:</span>
                </span>

                {/* Reset button if filter is active */}
                {(selectedBrand !== 'All' || maxPrice < 1500000 || searchTerm !== '') && (
                  <button
                    onClick={() => {
                      setSelectedBrand('All');
                      setMaxPrice(1500000);
                      setSearchTerm('');
                      setSortBy('default');
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>إعادة تصفير الفلاتر</span>
                  </button>
                )}
              </div>

              {/* Filtering Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-right items-end">
                
                {/* Brand select */}
                <div className="md:col-span-4 space-y-1.5">
                  <label htmlFor="brand-filter-select" className="text-xs text-slate-400 font-medium">الشركة المصنعة</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        id={`filter-brand-${brand}`}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedBrand === brand
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-850'
                        }`}
                      >
                        {brand === 'All' ? 'الكل' : brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price slider */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <label htmlFor="price-range">السعر الأقصى:</label>
                    <span className="font-mono text-amber-500 font-bold">{maxPrice.toLocaleString()} ر.ي</span>
                  </div>
                  <input
                    id="price-range"
                    type="range"
                    min="1000"
                    max="1500000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>1,000 ر.ي</span>
                    <span>1,500,000 ر.ي</span>
                  </div>
                </div>

                {/* Sort drop down */}
                <div className="md:col-span-4 space-y-1.5">
                  <label htmlFor="sort-dropdown" className="text-xs text-slate-400 font-medium">ترتيب حسب</label>
                  <select
                    id="sort-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="default">الترتيب الافتراضي للمحل</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                    <option value="best-seller">الأكثر مبيعاً بالمقدمة</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Catalog Grid */}
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCatalog.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onOrderNow={handleOrderNowDirectly}
                    isWishlisted={wishlistItems.some(item => item.id === prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isDark={isDark}
                  />
                ))}
              </div>
            ) : (
              /* Catalog empty fallbacks */
              <div className="text-center py-16 bg-slate-900 border border-slate-850 rounded-2xl p-6">
                <Smartphone className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-base text-slate-300 font-bold mb-1">عذراً، لم نجد نتائج موازية لتفضيلات الفلتر الخاصة بك</p>
                <p className="text-xs text-slate-500">حاول تغيير خيارات البحث، أو إعادة تصفير التفضيلات لاستعراض الهواتف.</p>
                <button
                  onClick={() => {
                    setSelectedBrand('All');
                    setMaxPrice(1500000);
                    setSearchTerm('');
                    setSortBy('default');
                  }}
                  className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                >
                  إعادة تصفير فوري للفلاتر
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW B.2: DEDICATED WISHLIST VIEW (المفضلة) */}
        {currentTab === 'wishlist' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
            {/* Page title panel */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-rose-950/20 p-6 sm:p-8 rounded-2xl border border-slate-800 text-right relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />
              <span className="text-xs text-rose-500 font-bold tracking-wider block mb-1">جمعنا لك كل الأجهزة والهواتف التي نالت إعجابك</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
                <span>قائمة الأجهزة المفضلة لديك</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                تصفح أسرع لأجهزتك المفضلة، ويمكنك النقر لإضافة الأجهزة مباشرة بداخل سلة المشتريات ومباشرة الشحن فوراً.
              </p>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-850 rounded-2xl p-6">
                <Heart className="h-12 w-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                <p className="text-base text-slate-300 font-bold mb-1">قائمة المفضلة فارغة حالياً</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">لم تحفظ أي منتجات أو هواتف ذكية بعد. توجه إلى المعرض وأضف ما يعجبك بضغطة واحدة!</p>
                <button
                  onClick={() => setCurrentTab('smartphones')}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                >
                  الذهاب إلى معرض الهواتف الذكية
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistItems.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onOrderNow={handleOrderNowDirectly}
                    isWishlisted={true}
                    onToggleWishlist={handleToggleWishlist}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW D: INTERACTIVE ELECTRONICS WORKSHOP & EXCHANGE RATES ('services') */}
        {currentTab === 'services' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10" dir="rtl">
            {/* Main Section Header Banner */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/20 p-6 sm:p-8 rounded-2xl border border-slate-800 text-right relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
              <span className="text-xs text-amber-500 font-bold tracking-wider block mb-1">خدمات متكاملة بمواصفات عالمية</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">ورشة صيانة الجحفلي وتتبع حالة جهازك</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                تحت إشراف الأستاذ جمال الجحفلي ونخبة مهندسي الهواتف في صنعاء؛ نوفر خدمات تبديل الشاشات الأصلية، صيانة أعطال اللوحة الأم والآيسي، وكشف السيرفر وتخطي الحسابات بضمان وبأعلى جودة.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right Column: Interactive Maintenance Tracking & Booking (7 of 12) */}
              <div className="lg:col-span-7 space-y-8 text-right">
                
                {/* 1. Maintenance Status Tracker Panel */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white">تتبع حالة صيانة جهازك</h3>
                    <p className="text-xs text-slate-400">أدخل رقم كرت الصيانة الممنوح لك عند تسليم الهاتف للمحل في دارس:</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      id="track-code-field"
                      type="text"
                      placeholder="أدخل رقم الكرت (جرب 7818 أو 1234)"
                      value={trackCodeInput}
                      onChange={(e) => setTrackCodeInput(e.target.value)}
                      className="flex-1 text-xs sm:text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                    <button
                      id="track-submit-btn"
                      onClick={async () => {
                        const code = trackCodeInput.trim();
                        if (code === '') {
                          setTrackError('الرجاء كتابة رقم الكرت أولاً.');
                          setTrackedJob(null);
                          return;
                        }

                        try {
                          const matched = await dbGetJob(code);
                          if (matched) {
                            setTrackedJob(matched);
                            setTrackError('');
                          } else {
                            setTrackError('عذراً، رقم الكرت هذا غير مسجل في النظام حالياً. يرجى تجربة رقم تتبع افتراضي مثل 7818 أو 1234 أو كود قمت بإنشائه بالإدارة.');
                            setTrackedJob(null);
                          }
                        } catch (err) {
                          setTrackError('فشل جلب التذكرة من الخادم وقاعدة البيانات.');
                          setTrackedJob(null);
                        }
                      }}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition duration-150"
                    >
                      تتبع الحالة
                    </button>
                  </div>

                  {trackError && (
                    <p className="text-xs text-red-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10 font-medium">
                      ⚠️ {trackError}
                    </p>
                  )}

                  {trackedJob && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-5 animate-fade-in text-xs sm:text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-850">
                        <div>
                          <span className="text-slate-500 block">الجهاز المحول:</span>
                          <span className="font-bold text-white block">{trackedJob.device}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">المشكلة والخدمة:</span>
                          <span className="font-bold text-amber-400 block">{trackedJob.fault}</span>
                        </div>
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500 block">المهندس المسؤول:</span>
                          <span className="text-white block">{trackedJob.engineer}</span>
                        </div>
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500 block">تكلفة الصيانة المقررة نقداً:</span>
                          <span className="text-amber-500 font-bold block">{trackedJob.price}</span>
                        </div>
                      </div>

                      {/* Diagnostic Visual Step indicator */}
                      <div className="space-y-3">
                        <span className="text-xs text-slate-400 block font-semibold mb-2">مراحل إنجاز العملية:</span>
                        <div className="grid grid-cols-4 gap-1.5 relative">
                          {/* Connecting background Line */}
                          <div className="absolute top-3.5 right-6 left-6 h-0.5 bg-slate-800 z-0 hidden sm:block" />

                          <div className="text-center flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900 z-10 flex items-center justify-center text-xs font-bold font-mono text-emerald-400">
                              ✓
                            </div>
                            <span className="text-[10px] sm:text-xs text-slate-400 mt-1 block">مستلم</span>
                          </div>

                          <div className="text-center flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border z-10 flex items-center justify-center text-xs font-bold font-mono ${
                              ['ready', 'in-progress', 'spare-parts'].includes(trackedJob.status)
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-slate-800 bg-slate-900 text-slate-600'
                            }`}>
                              {['ready', 'in-progress', 'spare-parts'].includes(trackedJob.status) ? '✓' : '٢'}
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-1 block ${
                              ['ready', 'in-progress', 'spare-parts'].includes(trackedJob.status) ? 'text-teal-400 font-bold' : 'text-slate-500'
                            }`}>قيد المعاينة</span>
                          </div>

                          <div className="text-center flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border z-10 flex items-center justify-center text-xs font-bold font-mono ${
                              trackedJob.status === 'spare-parts'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500 animate-pulse'
                                : ['ready', 'in-progress'].includes(trackedJob.status)
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-slate-800 bg-slate-900 text-slate-600'
                            }`}>
                              {trackedJob.status === 'spare-parts' ? '!' : ['ready', 'in-progress'].includes(trackedJob.status) ? '✓' : '٣'}
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-1 block ${
                              trackedJob.status === 'spare-parts' ? 'text-amber-500 font-bold' : ['ready', 'in-progress'].includes(trackedJob.status) ? 'text-teal-400' : 'text-slate-600'
                            }`}>
                              {trackedJob.status === 'spare-parts' ? 'نقص قطع' : 'العمل الفعلي'}
                            </span>
                          </div>

                          <div className="text-center flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border z-10 flex items-center justify-center text-xs font-bold font-mono ${
                              trackedJob.status === 'ready'
                                ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-black'
                                : 'border-slate-800 bg-slate-900 text-slate-600'
                            }`}>
                              {trackedJob.status === 'ready' ? '✓' : '٤'}
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-1 block ${
                              trackedJob.status === 'ready' ? 'text-emerald-400 font-extrabold' : 'text-slate-600'
                            }`}>تسليم الجهاز</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/65 text-center text-xs mt-4">
                          <span className="text-slate-400 block mb-0.5">موعد التسليم المتوقع:</span>
                          <span className="text-white font-extrabold">{trackedJob.readyDate}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <a
                          href={`https://wa.me/967781831833?text=${encodeURIComponent(`السلام عليكم أريد الاستفسار عن كرت الصيانة رقم ${trackedJob.id} هاتف ${trackedJob.device}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all"
                        >
                          استفسار سريع بالواتساب
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Book New Maintenance Service Form Panel */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                      <span>احجز تصليح أو برمجة لجهازك الآن</span>
                    </h3>
                    <p className="text-xs text-slate-400">يمكنك حجز موعد لنفحص جهازك في الورشة، وسنتواصل معك فورا:</p>
                  </div>

                  {isBookedSuccess ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/35 text-center rounded-xl space-y-2">
                      <h4 className="text-emerald-400 font-black">تم تسجيل حجز صيانة جهازك بنجاح!</h4>
                      <p className="text-xs text-slate-300">يتم إرشادك الآن لتأكيد التفاصيل ومتابعة الحجز على واتساب المحل الرسمي.</p>
                      <button
                        onClick={() => setIsBookedSuccess(false)}
                        className="text-xs bg-slate-950 text-amber-500 hover:text-white px-3 py-1.5 rounded-lg transition"
                      >
                        حجز خدمة ثانية لجهاز آخر
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!bookName || !bookPhone || !bookDevice || !bookFault) {
                          alert('الرجاء ملء جميع معايير نموذج صيانة الهواتف.');
                          return;
                        }
                        
                        // Construct message
                        let msg = `السلام عليكم يا محل الجحفلي، أود حجز فحص وصيانة لجهازي الـ تالي:\n\n`;
                        msg += `👤 *الاسم:* ${bookName}\n`;
                        msg += `📞 *رقم التلفون:* ${bookPhone}\n`;
                        msg += `📱 *الجهاز:* ${bookDevice}\n`;
                        msg += `🔧 *العطل أو المشكلة:* ${bookFault}\n\n`;
                        msg += `أرجو تحديد موعد للفحص المجاني وتكلفة صيانته التقريبية وشكراً.`;

                        // Store booking in database
                        const newBooking = {
                          id: `booking-${Date.now()}`,
                          name: bookName,
                          phone: bookPhone,
                          device: bookDevice,
                          fault: bookFault,
                        };
                        dbSaveBooking(newBooking).catch(err => console.warn("Save booking log: ", err));

                        window.open(`https://wa.me/967781831833?text=${encodeURIComponent(msg)}`, '_blank');
                        setIsBookedSuccess(true);
                        setBookName('');
                        setBookPhone('');
                        setBookDevice('');
                        setBookFault('');
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="book-name" className="block text-[11px] text-gray-400 mb-1">الاسم الكامل *</label>
                          <input
                            id="book-name"
                            type="text"
                            required
                            placeholder="مثال: محمد الصنعاني"
                            value={bookName}
                            onChange={(e) => setBookName(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                          />
                        </div>
                        <div>
                          <label htmlFor="book-phone" className="block text-[11px] text-gray-400 mb-1">رقم الهاتف *</label>
                          <input
                            id="book-phone"
                            type="text"
                            required
                            placeholder="مثال: 777123456"
                            value={bookPhone}
                            onChange={(e) => setBookPhone(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="book-device" className="block text-[11px] text-gray-450 mb-1">موديل ونوع الهاتف المتضرر *</label>
                          <input
                            id="book-device"
                            type="text"
                            required
                            placeholder="مثال: آيفون 15 برو، نوت 40 برو"
                            value={bookDevice}
                            onChange={(e) => setBookDevice(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                          />
                        </div>
                        <div>
                          <label htmlFor="book-fault" className="block text-[11px] text-gray-455 mb-1">شرح المشكلة بالتفصيل *</label>
                          <input
                            id="book-fault"
                            type="text"
                            required
                            placeholder="مثال: الشاشة مكسورة، لا يشحن، بطيء"
                            value={bookFault}
                            onChange={(e) => setBookFault(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                          />
                        </div>
                      </div>

                      <button
                        id="book-submit-btn"
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 font-extrabold text-slate-950 text-xs sm:text-sm rounded-xl transition duration-150 shadow"
                      >
                        تأكيد حجز الصيانة وإرسال الطلب لواتساب الورشة
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Left Column: Exchange Rate Converter & Calculations (5 of 12) */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-8 text-right lg:order-first">
                
                {/* 1. Cash Exchange Rate Display */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full border border-amber-500/20 font-bold">مباشر بصنعاء</span>
                      <h3 className="text-lg font-black text-white">حاسبة الصرف اليومية وشراء الأجهزة</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">تداول العملات والأسعار المعتمدة لإتمام معاملات الدفع والشراء:</p>
                  </div>

                  {/* Currencies stats tiles */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Dollar Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded">USD</span>
                        <span className="text-slate-500 text-[10px]">الدولار الأمريكي</span>
                      </div>
                      <div className="mt-2 text-center col-span-2">
                        <span className="text-[10px] text-slate-400">سعر الصرف للشراء:</span>
                        <h4 className="text-xl font-black text-amber-500 font-mono mt-0.5">{exchangeRates.usdBuy} <span className="text-[9px] font-sans">ريالاً</span></h4>
                        <span className="text-[9px] text-slate-500 block mt-1">البيع للمواطن: {exchangeRates.usdSell} ريالاً</span>
                      </div>
                    </div>

                    {/* Saudi Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded">SAR</span>
                        <span className="text-slate-500 text-[10px]">الريال السعودي</span>
                      </div>
                      <div className="mt-2 text-center col-span-2">
                        <span className="text-[10px] text-slate-400">سعر الصرف للشراء:</span>
                        <h4 className="text-xl font-black text-amber-500 font-mono mt-0.5">{exchangeRates.sarBuy} <span className="text-[9px] font-sans">ريالاً</span></h4>
                        <span className="text-[9px] text-slate-500 block mt-1">البيع للمواطن: {exchangeRates.sarSell} ريالاً</span>
                      </div>
                    </div>

                  </div>

                  {/* Converter Calculator Container */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                    <h4 className="text-xs font-bold text-amber-450 border-b border-slate-850 pb-2">حاسبة التحويل لـ الريال اليمني (YER):</h4>
                    
                    <div className="space-y-3.5">
                      {/* USD to YER Block */}
                      <div>
                        <label htmlFor="usd-calc-input" className="block text-[11px] text-slate-400 mb-1">المبلغ بـ الدولار الأمريكي ($):</label>
                        <div className="relative">
                          <input
                            id="usd-calc-input"
                            type="number"
                            placeholder="أدخل مبلغ بالدولار"
                            value={convUSDInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConvUSDInput(val);
                              if (val) {
                                // Clear Saudi input to make calculations clear
                                setConvSARInput('');
                              }
                            }}
                            className="w-full text-xs font-mono px-3 py-2.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right pr-4"
                          />
                          <span className="absolute left-3 top-2.5 text-[10px] text-slate-550">$ USD</span>
                        </div>
                      </div>

                      {/* SAR to YER Block */}
                      <div>
                        <label htmlFor="sar-calc-input" className="block text-[11px] text-slate-400 mb-1">المبلغ بـ الريال السعودي (سعودي):</label>
                        <div className="relative">
                          <input
                            id="sar-calc-input"
                            type="number"
                            placeholder="أدخل مبلغ بالسعودي"
                            value={convSARInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConvSARInput(val);
                              if (val) {
                                // Clear Dollar input
                                setConvUSDInput('');
                              }
                            }}
                            className="w-full text-xs font-mono px-3 py-2.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right pr-4"
                          />
                          <span className="absolute left-3 top-2.5 text-[10px] text-slate-550">ر.س SAR</span>
                        </div>
                      </div>

                      {/* Out YER Equivalent */}
                      <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 border-dashed text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">القيمة المحسوبة بالريال اليمني (صنعاء):</span>
                        <h5 className="text-2xl font-black text-amber-400 font-mono">
                          {convUSDInput 
                            ? `${(Number(convUSDInput) * exchangeRates.usdBuy).toLocaleString()} ر.ي`
                            : convSARInput
                            ? `${(Number(convSARInput) * exchangeRates.sarBuy).toLocaleString()} ر.ي`
                            : '٠ ر.ي'
                          }
                        </h5>
                        <span className="text-[9px] text-slate-500 block mt-1.5">* احتساب الصرف يعتمد على أسعار لحظية غير رسمية قد تتغير بالأسواق.</span>
                      </div>

                    </div>
                  </div>

                  {/* Exchange helper message */}
                  <div className="bg-amber-500/5 p-3.5 border border-amber-500/15 rounded-xl text-xs flex gap-2">
                    <span className="text-amber-500 text-base leading-none shrink-0 font-bold">ℹ</span>
                    <p className="text-slate-350 leading-relaxed text-[11px]">
                      <b>ملاحظة الدفع في محل الجحفلي:</b> نرحب بجميع بطاقات الدفع والتحويلات اللاسلكية مثل كريمي، كاش، النجم، أو كاش موبايل بشكل فوري بالدولار، السعودي أو اليمني وبأرخص كلفة تحويل في صنعاء ورأس دارس.
                    </p>
                  </div>
                </div>

                {/* Maintenance workshop advice banner */}
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <h4 className="text-slate-200 text-xs sm:text-sm font-bold">نصائح حماية بطارية وإرشادات جمال الجحفلي:</h4>
                  <ul className="space-y-2 text-[11px] text-slate-400 pr-1 leading-relaxed list-disc list-inside">
                    <li>تجنب استخدام الشواحن التجارية منخفضة التكلفة، واحترف اقتناء شواحن GaN الذكية (تجدها في متجرنا).</li>
                    <li>لا تدع هاتفك متصلاً بالكهرباء لفترات طويلة تزيد عن اللزوم بعد امتلاء مخزون الطاقة لـ 100%.</li>
                    <li>عند حدوث رطوبة أو غوص الهاتف في السيول، أسرع بإطفائه فوراً والذهاب لورشتنا المعتمدة في الخط العام قبل جفاف العناصر الداخلية وتلف اللوحة الأم.</li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* VIEW C: ABOUT US & CONTACT US WRAPPERS */}
        {(currentTab === 'about' || currentTab === 'contact') && (
          <AboutContact 
            testimonials={testimonials} 
            onSubmitReview={handleAddReview} 
          />
        )}

      </main>

      {/* 2.8 SEO Keywords & Local Business Credentials Accordion */}
      <section className={`py-12 border-t ${isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-100/50 border-slate-200'}`} dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            <div className="text-right space-y-4">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                لماذا تختار محلات الجحفلي للهواتف الذكية بصنعاء؟
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                تعتبر <b>محلات الجحفلي للهواتف الذكية ومستلزماتها</b> بإدارة <b>الأستاذ جمال الجحفلي</b> من أوثق وأعرق محلات بيع وصيانة الأجهزة الذكية في أمانة العاصمة صنعاء - دارس. نوفر ضمانات حقيقية وخدمات مبيعات وصيانة متميزة وموثوقة لأكثر من 10 سنوات.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-amber-500 font-bold text-xs block mb-1">اتصال مباشر بالمدير جمال الجحفلي:</span>
                  <span className={`text-sm font-mono font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>781831833</span>
                  <span className={`text-sm font-mono font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>781831833</span>
                </div>
                
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-amber-500 font-bold text-xs block mb-1">الرقم الدولي والواتساب المعتمد:</span>
                  <span className={`text-sm font-mono font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>+967 781831833</span>
                  <span className={`text-sm font-mono font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>+967 781831833</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-4">
              <h3 className={`text-base font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                الكلمات الدلالية ومحاور البحث الشائعة لعملائنا:
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-500">
                محل الجحفلي للهواتف صنعاء دارس، رقم تلفون جمال الجحفلي 781831833، صيانة شاشات أصلية صنعاء، شراء آيفون وكالة مستعمل اليمن، شحن باقة سوبر يمن موبايل فوري دارس الخط العام، رقم 781831833 الجحفلي صيانة، أسعار الصرف والدولار في صنعاء متجر الجحفلي، وكيل هواتف شاومي وسامسونج اليمن، ورشة صيانة جمال الجحفلي، أفضل مهندس تلفونات بصنعاء.
              </p>
              
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-100 border-slate-200'} text-[11px] leading-relaxed text-slate-400`}>
                ℹ️ <b>دليل الوصول والأرشفة:</b> يسهل هذا القسم على محرك بحث Google مطابقة كلمات البحث المكتوبة من قبل زبائننا بصنعاء واليمن للوصول مباشرة إلى صفحة تتبع صيانة أجهزتهم وحساب الصرف ومعرض الأجهزة.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Immersive Footer with directions & copyrights */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* About brief */}
            <div className="md:col-span-2 space-y-4 text-right">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                  ج
                </div>
                <h4 className="text-lg font-bold text-white tracking-wide">الحجفلي للهواتف الذكية</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                نحن نوفر لعملائنا في صنعاء واليمن التشكيلة الأوفر والأكثر أماناً من الهواتف مع الضمان السنوي الفعلي وخدمات البرمجة تحت رعاية الأستاذ جمال الجحفلي.
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <a href={`tel:${SHOP_INFO.phone}`} className="text-xs text-amber-500 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-amber-500 leading-none">
                  اتصال: {SHOP_INFO.phone}
                </a>
                <a href={`https://wa.me/${SHOP_INFO.whatsapp}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-emerald-500 leading-none">
                  محادثة واتساب
                </a>
              </div>
            </div>

            {/* Quick sections Links list */}
            <div className="text-right space-y-3">
              <h5 className="text-white text-sm font-bold border-b border-slate-850 pb-1.5">أقسام المتجر</h5>
              <div className="flex flex-col gap-2 text-xs">
                <button onClick={() => setCurrentTab('smartphones')} className="text-right hover:text-amber-400 duration-150">قسم الهواتف الذكية</button>
                <button onClick={() => setCurrentTab('electronics')} className="text-right hover:text-amber-400 duration-150">الأجهزة الإلكترونية والساعات</button>
                <button onClick={() => setCurrentTab('accessories')} className="text-right hover:text-amber-400 duration-150">إكسسوارات الجوال والسيارات</button>
                <button onClick={() => setCurrentTab('offers')} className="text-right hover:text-amber-400 duration-150">آخر العروض والتخفيضات</button>
              </div>
            </div>

            {/* Contact quick summaries */}
            <div className="text-right space-y-3">
              <h5 className="text-white text-sm font-bold border-b border-slate-850 pb-1.5">معلومات التواصل والموقع</h5>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{SHOP_INFO.location}</span>
                </li>
                <li className="flex items-start gap-1.5 font-mono">
                  <Phone className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>تلفون: {SHOP_INFO.phone}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed">{SHOP_INFO.hours}</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 text-right gap-3">
            <p className="order-2 sm:order-1 font-mono">
              جميع الحقوق محفوظة لمحلات الجحفلي للهواتف الذكية ومستلزماتها © ٢٠٢٦ م.
            </p>
            <p className="order-1 sm:order-2">
              تطوير متكامل بالتعاون مع <span className="text-amber-500 font-bold">جمال الجحفلي</span>
            </p>
          </div>
        </div>
      </footer>

      {/* 4. OVERLAY: CART SLIDER PANEL */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* 4.5. OVERLAY: WISHLIST SLIDER PANEL */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveItem={(productId) => setWishlistItems(prev => {
          const updated = prev.filter(item => item.id !== productId);
          localStorage.setItem('aljahfali_wishlist_v2', JSON.stringify(updated));
          return updated;
        })}
        onAddToCart={handleAddToCart}
        onViewDetails={(product) => setSelectedProduct(product)}
        onOpenFullPageWishlist={() => setCurrentTab('wishlist')}
      />

      {/* 5. OVERLAY: DETAILED PRODUCT HIGHLIGHTS MODAL */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onOrderNow={handleOrderNowDirectly}
        isWishlisted={selectedProduct ? wishlistItems.some(item => item.id === selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 6. OVERLAY: ADMIN PANEL / CUSTOM CATALOG UPDATES */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={async () => {
          setIsAdminOpen(false);
          try {
            const liveRates = await dbGetExchangeRates();
            if (liveRates) setExchangeRates(liveRates);
            const liveProducts = await dbGetProducts();
            setProducts(liveProducts);
            const liveReviews = await dbGetTestimonials();
            setTestimonials(liveReviews);
          } catch (e) {
            console.warn("Sync error: ", e);
          }
        }}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetToDefaults={handleResetToDefaults}
        isDark={isDark}
      />

    </div>
  );
}
