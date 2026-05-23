import React, { useState, FormEvent } from 'react';
import { MapPin, Phone, MessageSquare, Clock, User, ShieldCheck, Star, Award, HeartHandshake, CheckCircle } from 'lucide-react';
import { SHOP_INFO } from '../data';
import { Testimonial } from '../types';

interface AboutContactProps {
  testimonials: Testimonial[];
  onSubmitReview: (name: string, rating: number, comment: string) => void;
}

export default function AboutContact({ testimonials, onSubmitReview }: AboutContactProps) {
  // Contact Form State
  const [formData, setFormData] = useState({ name: '', phone: '', subject: 'whatsapp', message: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSuccess, setIsReviewSuccess] = useState(false);

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;

    // Direct WhatsApp message formatting for support
    const text = `📬 *رسالة استفسار جديدة من موقع المحل:*\n\n` +
                 `👤 *الاسم:* ${formData.name}\n` +
                 `📞 *رقم الهاتف:* ${formData.phone}\n` +
                 `💬 *الموضوع:* ${formData.subject === 'whatsapp' ? 'شراء منتج خاص' : 'استفسار عام / صيانة'}\n\n` +
                 `✉️ *نص الاستفسار:*\n${formData.message}\n`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${SHOP_INFO.whatsapp}?text=${encoded}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    setIsSuccess(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', subject: 'whatsapp', message: '' });
      setIsSuccess(false);
    }, 4000);
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    onSubmitReview(reviewName, reviewRating, reviewComment);
    
    setIsReviewSuccess(true);
    setReviewName('');
    setReviewComment('');
    setReviewRating(5);
    setTimeout(() => {
      setIsReviewSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-16 py-8" dir="rtl">
      
      {/* SECTION 1: ABOUT US (من نحن) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            قصتنا وهويتنا
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 leading-tight">
            محل الجحفلي للهواتف الذكية ومستلزماتها
          </h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto mt-4 rounded"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Brand Info Cards */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">خبرة وموثوقية ممتدة</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    نعمل في سوق الهواتف الذكية والإلكترونيات في اليمن لأكثر من عشر سنوات، ونسعى دائماً لتوفير الأجهزة والمستلزمات الأصلية بأعلى درجات المصداقية والضمان الفعلي وتحت الإشراف المباشر لمالك المحل الأستاذ جمال الجحفلي.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">رؤيتنا ورسالتنا</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    تسهيل حصول المواطن اليمني في صنعاء وباقي الحافظات على أحدث التقنيات العالمية بأقل كلفة ممكنة مع توفير ضمانات حقيقية وخدمات برمجة وصيانة متكاملة تلبي رغبات الزبائن وتكسب ثقتهم الدائمة.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">لماذا تختار الجحفلي؟</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    السرعة في الاستجابة، دقة الفحص والصيانة للأجهزة، تنوع خيارات الدفع والطلب، بالإضافة لمقرنا المتميز والآمن على الخط العام في منطقة دارس بالعاصمة صنعاء.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Presentation on Right */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>

            <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-slate-800 pb-2">تفاصيل البطاقة التجارية للمحل</h3>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3.5 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <span className="text-slate-400 font-medium block">مالك المحل والمدير المسؤول</span>
                  <span className="text-white font-bold text-base">{SHOP_INFO.owner}</span>
                </div>
              </li>
              <li className="flex items-center gap-3.5 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <span className="text-slate-400 font-medium block">مقر وعنوان المحل</span>
                  <span className="text-white font-bold">{SHOP_INFO.location}</span>
                </div>
              </li>
              <li className="flex items-center gap-3.5 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <span className="text-slate-400 font-medium block">رقم تلفون التواصل المالي والطلبات</span>
                  <span className="text-white font-bold font-mono tracking-wide text-lg text-amber-400">{SHOP_INFO.phone}</span>
                </div>
              </li>
              <li className="flex items-center gap-3.5 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <span className="text-slate-400 font-medium block">أوقات وساعات الدوام</span>
                  <span className="text-slate-300 text-xs leading-relaxed">{SHOP_INFO.hours}</span>
                </div>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center bg-slate-950/40 p-4 rounded-xl">
              <p className="text-xs text-slate-400 italic">"نحن لا نبيع الأجهزة فحسب، بل نبني علاقات ثقة متينة تدوم لسنوات"</p>
              <span className="block text-[10px] text-amber-500 font-bold mt-1">- جمال الجحفلي</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: CLIENT TESTIMONIALS & FEEDBACK PANEL */}
      <section className="bg-slate-950 py-12 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Live testimonials slider */}
            <div className="lg:col-span-7">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                <span>آراء وتقييمات زبائننا الكرام</span>
              </h3>
              
              <div className="space-y-4">
                {testimonials.slice(-4).reverse().map((test) => (
                  <div key={test.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm animate-fade-in">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        {test.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">{test.date}</span>
                    </div>
                    
                    <div className="flex gap-0.5 mb-2.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < test.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} 
                        />
                      ))}
                    </div>

                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      "{test.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Create dynamic Feedback block */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-inner">
              <h3 className="text-xl font-bold text-amber-400 mb-1">أضف تقييمك الخاص</h3>
              <p className="text-xs text-slate-400 mb-4">يسعدنا تلقي رأيكم لنستمر في تحسين وتطوير الخدمات.</p>

              {isReviewSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center text-emerald-400 animate-fade-in text-xs space-y-2">
                  <CheckCircle className="h-8 w-8 mx-auto text-emerald-400" />
                  <p className="font-bold">شكراً جزيلاً لتقييمك الرائع!</p>
                  <p className="text-slate-400">تمت إضافة رأيك إلى القائمة وتحديث شاشة العملاء فوراً.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="review-name" className="block text-xs text-slate-400 mb-1">الاسم الكامل / المستعار</label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      placeholder="مثال: يوسف الكاهلي"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-rating" className="block text-xs text-slate-400 mb-1">اختر عدد النجوم</label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const score = i + 1;
                        return (
                          <button
                            key={i}
                            id={`star-btn-${score}`}
                            type="button"
                            onClick={() => setReviewRating(score)}
                            className="p-1 focus:outline-none focus:scale-110 duration-150"
                          >
                            <Star 
                              className={`h-5 w-5 ${score <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-xs text-slate-400 mb-2">رأيك بالتفصيل عن المحل أو المعاملة</label>
                    <textarea
                      id="review-comment"
                      required
                      rows={3}
                      placeholder="اكتب ملاحظاتك بحرّية، تعاملنا معك يهمنا جداً..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>

                  <button
                    id="submit-review-btn"
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-850 text-amber-400 font-bold py-2 rounded-xl text-xs border border-slate-800 hover:border-amber-500/40 transition"
                  >
                    نشر التقيم في المعرض
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: CONTACT US FORM & DIRECTIONS (تواصل معنا) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          
          {/* Quick Contact Form */}
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-400" />
                <span>نموذج المراسلة والطلبات الفورية</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                املأ الفراغات التالية وسيتم فتح محادثة مباشرة مع المدير جمال الجحفلي فوراً لإكمال طلبك الخاص.
              </p>

              {isSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center text-emerald-400 text-xs animate-fade-in">
                  <p className="font-bold mb-1">تم التحويل بنجاح!</p>
                  <p className="text-slate-400">لقد تم تجهيز طلب المراسلة الخاص بك وتوجيهه المباشر إلى رقم المحل على واتساب.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs text-slate-400 mb-1">اسمك الكريم</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="مثال: صالح الدارسي"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-xs text-slate-400 mb-1">رقم تلفونك (أو رقم واتساب الخاص بك)</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="مثال: 777123456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs text-slate-400 mb-1">نوع المعاملة المطلوبة</label>
                    <select
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right"
                    >
                      <option value="whatsapp">شراء هاتف أو حجز مستلزمات</option>
                      <option value="repair">صيانة، برمجة وفورمات أجهزة</option>
                      <option value="general">استفسار عام عن الأسعار المتوفرة</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs text-slate-400 mb-1">تفاصيل الاستفسار أو الأجهزة المطلوبة</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={3}
                      placeholder="أريد الاستفسار عن توفر هاتف آيفون 16 تيتانيوم..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-950 text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 text-right resize-none"
                    />
                  </div>

                  <button
                    id="contact-submit-btn"
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition"
                  >
                    متابعة عبر محادثة واتساب المحل
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Interactive Directions & Simulated Google Map */}
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-400" />
                <span>خريطة الموقع الجغرافي للمحل</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                صنعاء - دارس - على الخط العام (موقع استراتيجي يسهل الوصول إليه وتتوفر أمامه مواقف سيارات مريحة).
              </p>

              {/* Dynamic Styled Canvas representing high quality GPS Map */}
              <div className="relative w-full h-[240px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4 mb-4 flex flex-col justify-between">
                {/* Background Grid Accent Lines mapping the road */}
                <div className="absolute inset-0 bg-slate-950 opacity-15" style={{ 
                  backgroundImage: 'radial-gradient(circle, #f59e0b 0.6px, transparent 0.6px)',
                  backgroundSize: '12px 12px' 
                }} />

                {/* Simulated Street drawing */}
                <div className="absolute top-1/2 left-0 right-0 h-10 bg-slate-900 flex items-center justify-around border-y border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest">◀ الخط العام لشارع دارس صنعاء ▶</span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest">◀ الخط العام لشارع دارس صنعاء ▶</span>
                </div>

                {/* Point of interest indicator */}
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10 animate-bounce">
                  <div className="bg-gradient-to-tr from-amber-400 to-yellow-500 p-2 text-slate-950 rounded-full border-2 border-white shadow-xl">
                    <MapPin className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <span className="mt-1.5 px-3 py-1 bg-slate-900 border border-amber-500 text-[10px] text-amber-400 font-bold rounded-lg shadow-lg">
                    محل الجحفلي للهواتف الذكية
                  </span>
                </div>

                {/* Overlay guides */}
                <div className="z-10 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-[10px] text-slate-300 max-w-xs space-y-1">
                  <p className="font-bold text-amber-400 flex items-center gap-1">📍 دليل علامات الطريق:</p>
                  <p>1. مقابل الخط العام مباشرة بدارس.</p>
                  <p>2. بجوار الصرافين والخدمات الرئيسية.</p>
                </div>

                <div className="z-10 text-right self-end">
                  <span className="text-[9px] text-slate-500 font-mono">خرائط الجحفلي الذكية ٢٠٢٦ ©</span>
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-center">
                  <Phone className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">اتصال مباشر</span>
                  <a href={`tel:${SHOP_INFO.phone}`} className="text-sm font-bold text-white font-mono hover:text-amber-400">
                    {SHOP_INFO.phone}
                  </a>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-center">
                  <Clock className="h-4 w-4 text-teal-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">ساعات العمل</span>
                  <span className="text-[10px] font-bold text-slate-200 block truncate">
                    9:00 ص - 11:00 م
                  </span>
                </div>
              </div>
            </div>

            <a
              id="google-maps-redirect"
              href={`https://maps.google.com/?q=${encodeURIComponent('صنعاء - دارس')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>افتح الاتجاهات على خرائط Google Maps</span>
              <MapPin className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
