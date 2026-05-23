import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Banner } from '../types';

interface BannerSliderProps {
  banners: Banner[];
  onActionClick: (productId?: string) => void;
}

export default function BannerSlider({ banners, onActionClick }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  if (banners.length === 0) return null;

  return (
    <section className="relative w-full h-[320px] sm:h-[450px] md:h-[500px] overflow-hidden bg-slate-950" dir="rtl">
      {/* Slides */}
      {banners.map((banner, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
              isActive ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95 pointer-events-none'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${banner.image})` }} referrerPolicy="no-referrer">
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.colorTheme} via-slate-950/80 to-slate-950/95`} />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center h-full text-right z-10">
              <div className="max-w-2xl text-right animate-fade-in">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-4 animate-pulse">
                  عرض خاص وحصري بمناسبة العام الجديد
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-lg text-gray-300 mb-6 font-medium max-w-lg">
                  {banner.subtitle}
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    id={`banner-cta-${banner.id}`}
                    onClick={() => onActionClick(banner.productId)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all text-sm sm:text-base focus:outline-none"
                  >
                    <span>{banner.linkText || 'تسوق الآن'}</span>
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="text-xs text-amber-500/70 font-mono tracking-wide hidden sm:inline-block">
                    * الضمان ممتد داخل اليمن وصنعاء
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Manual Navigation Arrows */}
      <button
        id="banner-prev-btn"
        onClick={handlePrev}
        className="absolute top-1/2 left-4 z-20 cursor-pointer -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-800 transition-all focus:outline-none"
        aria-label="السابق"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        id="banner-next-btn"
        onClick={handleNext}
        className="absolute top-1/2 right-4 z-20 cursor-pointer -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-800 transition-all focus:outline-none"
        aria-label="التالي"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            id={`banner-dot-${index}`}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none ${
              index === currentIndex
                ? 'bg-amber-500 w-8'
                : 'bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`تغيير الشريحة إلى ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
