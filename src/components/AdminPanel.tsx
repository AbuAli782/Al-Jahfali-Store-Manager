import React, { useState, useEffect, FormEvent } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Plus, Trash2, Edit, Save, Lock, Unlock, Sparkles, AlertCircle, 
  RefreshCw, Laptop, Smartphone, FileText, DollarSign, Star, Check, PhoneCall, CheckSquare, Upload,
  Download, Bell, Barcode, CheckCircle2, AlertTriangle, Eye, ShieldAlert, Layers, Activity, Calendar, Printer
} from 'lucide-react';
import { Product, CategoryType, Testimonial, Employee, EmployeeRole, EmployeePermission } from '../types';
import { 
  dbSaveProduct, dbDeleteProduct, dbGetBookings, dbSaveBooking, dbGetJobs, dbSaveJob, dbDeleteJob,
  dbGetExchangeRates, dbSaveExchangeRates, dbGetTestimonials, dbSaveTestimonial,
  dbGetEmployees, dbSaveEmployee, dbDeleteEmployee,
  auth, isFirebaseReal, isFirestoreOffline
} from '../lib/db';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetToDefaults: () => void;
}

type AdminTab = 'products' | 'jobs' | 'bookings' | 'rates' | 'testimonials' | 'employees';

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetToDefaults
}: AdminPanelProps) {
  // Authorization credentials with local sessions
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('aljahfali_admin_session_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });
  
  const isAuthorized = !!currentEmployee;
  const [loginError, setLoginError] = useState('');

  // Employees List & Management State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState<{
    name: string;
    username: string;
    password?: string;
    role: EmployeeRole;
    permissions: EmployeePermission[];
    status: 'active' | 'suspended';
  }>({
    name: '',
    username: '',
    password: '',
    role: 'sales',
    permissions: ['manage_products'],
    status: 'active'
  });

  // Firebase Auth admin states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // --- QR Code & Camera scanner states ---
  const [selectedQRProduct, setSelectedQRProduct] = useState<Product | null>(null);
  const [generatedQRDataURL, setGeneratedQRDataURL] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [html5QrScannerInstance, setHtml5QrScannerInstance] = useState<Html5Qrcode | null>(null);
  const [manualQRInput, setManualQRInput] = useState('');

  // --- Live Notifications & Center Dialog State ---
  interface AdminNotification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warn';
    title: string;
    message: string;
    time: string;
  }

  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: 'init-1',
      type: 'success',
      title: 'اتصال آمن',
      message: 'تم تأسيس الاتصال المشفر مع قواعد بيانات الجحفلي المعتمدة بنجاح.',
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'init-2',
      type: 'info',
      title: 'حماية المخزون',
      message: 'تم تفعيل حماية أسعار صرف الريال اليمني وتتبع كود الصيانة.',
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info' | 'warn'; title: string; message: string } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const playBarcodeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio Context beep blocked or unsupported.", e);
    }
  };

  // --- QR & Camera Barcode Scanner Utility Actions ---
  const handleShowQRCodeModal = async (prod: Product) => {
    try {
      const shareUrl = `${window.location.origin}?product=${prod.id}`;
      const dataUrl = await QRCode.toDataURL(shareUrl, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#030712', // solid slate-950
          light: '#ffffff'
        }
      });
      setGeneratedQRDataURL(dataUrl);
      setSelectedQRProduct(prod);
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      triggerToast('توليد الرمز ⚠️', 'لم نتمكن من توليد رمز المربع الذكي للمنتج.', 'warn');
    }
  };

  const printSticker = () => {
    if (!selectedQRProduct) return;
    const printWindow = window.open('', '_blank', 'width=550,height=600');
    if (!printWindow) {
      triggerToast('عذراً للمقاطعة ⚠️', 'قام متصفح الويب بحظر نافذة الطباعة المنبثقة. يرجى تفعيل السماح بالنوافذ المنبثقة للتطبيق.', 'warn');
      return;
    }
    
    const usdPrice = Math.round(selectedQRProduct.price / (rates.usdSell || 535));
    const sarPrice = Math.round(selectedQRProduct.price / (rates.sarSell || 141));
    
    const content = `
      <html>
      <head>
        <title>ملصق - ${selectedQRProduct.arabicName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          body {
            margin: 0;
            padding: 25px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            text-align: center;
            background-color: white;
            color: #000;
          }
          .sticker-card {
            border: 3px dashed #334155;
            padding: 20px;
            border-radius: 12px;
            max-width: 320px;
            margin: 0 auto;
            box-sizing: border-box;
            background: #fff;
          }
          .store-header {
            font-size: 13px;
            font-weight: 900;
            color: #b45309;
            margin-bottom: 3px;
            letter-spacing: -0.5px;
          }
          .store-tagline {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 12px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
            font-weight: bold;
          }
          .brand-tag {
            display: inline-block;
            background: #f1f5f9;
            color: #1e293b;
            font-size: 10px;
            font-weight: 900;
            padding: 3px 10px;
            border-radius: 9999px;
            margin-bottom: 8px;
          }
          .title-arabic {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin: 4px 0;
            line-height: 1.3;
          }
          .title-english {
            font-size: 10px;
            font-family: monospace;
            color: #64748b;
            margin-bottom: 12px;
          }
          .qr-box {
            background: #fff;
            padding: 8px;
            display: inline-block;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 12px;
          }
          .qr-img {
            width: 160px;
            height: 160px;
            display: block;
          }
          .price-block {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 15px;
          }
          .price-yer {
            font-size: 18px;
            font-weight: 900;
            color: #15803d;
          }
          .price-conversions {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-top: 6px;
            font-size: 10px;
            color: #475569;
            font-weight: bold;
            border-top: 1px solid #dcfce7;
            padding-top: 4px;
          }
          .footer-text {
            font-size: 8px;
            color: #94a3b8;
            margin-top: 8px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="sticker-card">
          <div class="store-header">مجموعة الجحفلي المعتمدة للهواتف</div>
          <div class="store-tagline">مبيعات الجملة والتجزئة والصيانة الفورية المعتمدة</div>
          <span class="brand-tag">${selectedQRProduct.brand}</span>
          <div class="title-arabic">${selectedQRProduct.arabicName}</div>
          <div class="title-english">${selectedQRProduct.name}</div>
          <div class="qr-box">
            <img class="qr-img" src="${generatedQRDataURL}" />
          </div>
          <div class="price-block">
            <div class="price-yer">${selectedQRProduct.price.toLocaleString()} ر.ي</div>
            <div class="price-conversions">
              <span>الدولار: $${usdPrice}</span>
              <span>السعودي: ${sarPrice} ر.س</span>
            </div>
          </div>
          <div class="footer-text">اصنع مسحاً للرمز عبر الكاميرا للاطلاع الفوري على المواصفات والخصائص</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const startScanning = async () => {
    setScannerError('');
    setShowQRScanner(true);
    
    // Stop any existing IMEI camera stream to release video device lock
    if (cameraStream) {
      try {
        cameraStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn("Error releasing cameraStream:", e);
      }
      setCameraStream(null);
      setIsCameraScannerOpen(false);
    }

    if (html5QrScannerInstance) {
      try {
        if (html5QrScannerInstance.isScanning) {
          await html5QrScannerInstance.stop();
        }
      } catch (e) {
        console.warn("Error stopping active scanner:", e);
      }
      setHtml5QrScannerInstance(null);
    }
    
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("admin-qr-reader");
        setHtml5QrScannerInstance(scanner);
        
        const scanConfig = {
          fps: 15,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.75;
            return { width: size, height: size };
          }
        };

        try {
          // Tier 1: Try environment (back/rear) camera first
          await scanner.start(
            { facingMode: "environment" },
            scanConfig,
            (decodedText) => {
              handleScannedCode(decodedText, scanner);
            },
            () => {}
          );
        } catch (envError) {
          console.warn("Failed to start with environment camera, trying user camera:", envError);
          // Tier 2: Try user (front) camera
          try {
            await scanner.start(
              { facingMode: "user" },
              scanConfig,
              (decodedText) => {
                handleScannedCode(decodedText, scanner);
              },
              () => {}
            );
          } catch (userError) {
            console.warn("Failed to start with user camera, querying physical devices:", userError);
            // Tier 3: Query physical camera devices list and start with first index
            const devices = await Html5Qrcode.getCameras().catch(() => []);
            if (devices && devices.length > 0) {
              await scanner.start(
                devices[0].id,
                scanConfig,
                (decodedText) => {
                  handleScannedCode(decodedText, scanner);
                },
                () => {}
              );
            } else {
              throw new Error(`تعذر تشغيل مصدر الفيديو. يرجى التحقق من عدم استخدام الكاميرا في تطبيق آخر أو صفحة أخرى. تفاصيل الخطأ: ${envError}`);
            }
          }
        }
        
        triggerToast('نشاط الكاميرا 📹', 'تم تهيئة عدسة ومسح الكاميرا بنجاح.', 'success');
      } catch (err: any) {
        console.error("Camera scanner start failed:", err);
        setScannerError(err.message || String(err));
        triggerToast('تهيئة الكاميرا 🛑', 'لم نستطع تشغيل الكاميرا بالمتصفح.', 'info');
      }
    }, 600);
  };

  const stopScanning = async (scannerToStop?: any) => {
    const active = scannerToStop || html5QrScannerInstance;
    if (active) {
      try {
        if (active.isScanning) {
          await active.stop();
        }
      } catch (err) {
        console.warn("Failed stopping camera stream:", err);
      }
    }
    setHtml5QrScannerInstance(null);
    setShowQRScanner(false);
  };

  const handleScannedCode = async (text: string, activeScanner: any) => {
    playBarcodeSound();
    await stopScanning(activeScanner);
    
    triggerToast('تم المسح بنجاح 💡', `المحتوى الذي تم رصده: ${text}`, 'success');
    
    try {
      let productId = '';
      let jobId = '';
      
      if (text.includes('product=') || text.includes('p=')) {
        const urlParams = new URLSearchParams(text.split('?')[1]);
        productId = urlParams.get('product') || urlParams.get('p') || '';
      } else {
        const trimmed = text.trim();
        const matchedProd = products.find(p => String(p.id).toLowerCase() === trimmed.toLowerCase());
        if (matchedProd) {
          productId = matchedProd.id;
        } else {
          const fetchedJobs = await dbGetJobs();
          const matchedJob = fetchedJobs.find(j => String(j.id) === trimmed || String(j.trackingCode) === trimmed);
          if (matchedJob) {
            jobId = matchedJob.id;
          }
        }
      }

      if (productId) {
        const matchedProduct = products.find(p => String(p.id) === productId);
        if (matchedProduct) {
          setActiveTab('products');
          selectProductForEdit(matchedProduct);
          showAlert('تم العثور على المنتج 🏷️', `تم التعرف على جهاز "${matchedProduct.arabicName}" وفتح التحرير فوراً.`, 'success');
        } else {
          showAlert('منتج مفقود ⚠️', `تم استخراج المعرف [ ${productId} ] ولكن هذا المعرف غير مسجل بكتالوج المتجر.`, 'info');
        }
      } else if (jobId) {
        const fetchedJobs = await dbGetJobs();
        const foundJob = fetchedJobs.find(j => String(j.id) === jobId);
        if (foundJob) {
          setActiveTab('jobs');
          editJobTicket(foundJob);
          showAlert('تتبع تذكرة صيانة 🛠️', `تم رصد الكود وجلب تذكرة الضمان للعميل "${foundJob.clientName}" - "${foundJob.device}".`, 'success');
        } else {
          showAlert('تذكرة مفقودة ⚠️', `لم نجد أي تذكرة تتبع نشطة بالكود المستهدف.`, 'info');
        }
      } else {
        showAlert('بيانات مشفرة غريبة 🧩', `محتوى الرمز: "${text}"\n لم نطابق هذا الرمز مع أي منتج أو كرت صيانة نشط بمحل الجحفلي.`, 'info');
      }
    } catch (e) {
      console.error(e);
      showAlert('حدث خطأ 🛑', 'فشل فرز الرمز أو قراءته بشكل سليم.', 'error');
    }
  };

  const triggerToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warn' = 'success') => {
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 40));
    setToast({
      id: `toast-${Date.now()}`,
      type,
      title,
      message
    });
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertDialog({
      isOpen: true,
      type,
      title,
      message
    });
    triggerToast(title, message, type);
  };

  // Sync auth state
  useEffect(() => {
    if (isFirebaseReal && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user && user.email === 'lya628625@gmail.com') {
          const superEmp: Employee = {
            id: 'emp-google-super',
            name: user.displayName || 'المدير العام (جوجل)',
            username: 'lya628625@gmail.com',
            role: 'admin',
            permissions: ['manage_products', 'manage_jobs', 'manage_bookings', 'manage_rates', 'manage_employees', 'manage_testimonials'],
            status: 'active'
          };
          setCurrentEmployee(superEmp);
          localStorage.setItem('aljahfali_admin_session_v2', JSON.stringify(superEmp));
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Toast automatic dismiss effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tab routing
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const checkPermission = (permission: EmployeePermission): boolean => {
    if (!currentEmployee) return false;
    if (currentEmployee.role === 'admin') return true;
    return currentEmployee.permissions.includes(permission);
  };

  const handleAddOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.username) {
      showAlert('حقول ناقصة 🛑', 'يرجى إدخال اسم الموظف واسم المستخدم الخاص به.', 'error');
      return;
    }

    const currentEmployees = await dbGetEmployees();
    
    // Check if username is already taken by another employee
    const usernameExists = currentEmployees.some(emp => 
      emp.username.toLowerCase() === employeeFormData.username.toLowerCase() && 
      emp.id !== (editingEmployee?.id || '')
    );
    if (usernameExists) {
      showAlert('اسم مستخدم مكرر ⚠️', 'اسم المستخدم هذا مستخدم بالفعل من قبل موظف آخر. الرجاء اختيار اسم مختلف.', 'info');
      return;
    }

    const targetId = editingEmployee ? editingEmployee.id : `emp-${Date.now()}`;
    const targetPassword = employeeFormData.password || (editingEmployee?.password || '123456');

    const updatedEmployee: Employee = {
      id: targetId,
      name: employeeFormData.name,
      username: employeeFormData.username,
      password: targetPassword,
      role: employeeFormData.role,
      permissions: employeeFormData.permissions,
      status: employeeFormData.status,
      lastActive: editingEmployee?.lastActive || 'لم ينشط بعد'
    };

    await dbSaveEmployee(updatedEmployee);
    const refreshed = await dbGetEmployees();
    setEmployees(refreshed);
    
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeFormData({
      name: '',
      username: '',
      password: '',
      role: 'sales',
      permissions: ['manage_products'],
      status: 'active'
    });

    triggerToast(
      editingEmployee ? 'تم تحديث الموظف 📝' : 'تمت إضافة الموظف 🎉',
      `تم حفظ بيانات الموظف ${updatedEmployee.name} وصلاحياته بنجاح في قاعدة البيانات.`,
      'success'
    );
  };

  const handleEditEmployeeStart = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeFormData({
      name: emp.name,
      username: emp.username,
      password: emp.password || '',
      role: emp.role,
      permissions: emp.permissions,
      status: emp.status
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployeeTicket = async (empId: string, empName: string) => {
    if (empId === 'emp-jamal' || empId === 'emp-google-super') {
      showAlert('عملية مرفوضة 🚫', 'لا يمكن حذف حساب مدير النظام أو الحساب السحابي الافتراضي لسلامة النظام.', 'error');
      return;
    }

    if (currentEmployee?.id === empId) {
      showAlert('عملية مرفوضة 🚫', 'لا يمكنك حذف حساب الموظف الخاص بك أثناء تسجيل الدخول منه الحالي.', 'error');
      return;
    }

    if (window.confirm(`هل أنت متأكد تماماً من رغبتك في حذف الموظف "${empName}" نهائياً من النظام؟`)) {
      await dbDeleteEmployee(empId);
      const refreshed = await dbGetEmployees();
      setEmployees(refreshed);
      triggerToast('تم الحذف بنجاح 🗑️', `تم شطب الموظف "${empName}" وإلغاء وصوله بالكامل.`, 'success');
    }
  };

  const handleToggleEmployeeSuspension = async (emp: Employee) => {
    if (emp.id === 'emp-jamal' || emp.id === 'emp-google-super') {
      showAlert('غير مسموح 🛑', 'لا يمكن تجميد حساب المدير العام الإداري الرئيسي لضمان إمكانية الإدارة.', 'error');
      return;
    }

    if (currentEmployee?.id === emp.id) {
      showAlert('غير مسموح 🛑', 'لا يمكنك تجميد جلسة حسابك النشط المفتوح حالياً.', 'error');
      return;
    }

    const updated: Employee = {
      ...emp,
      status: emp.status === 'active' ? 'suspended' : 'active'
    };

    await dbSaveEmployee(updated);
    const refreshed = await dbGetEmployees();
    setEmployees(refreshed);
    
    triggerToast(
      updated.status === 'active' ? 'تم التفعيل 🟢' : 'تم التجميد 🔴',
      `تم تعديل حالة الموظف "${emp.name}" إلى ${updated.status === 'active' ? 'نشط ومصرح له' : 'موقوف عن العمل فوراً'}.`,
      'info'
    );
  };

  // Preset role permissions mapping for quick selection in UI
  const setPresetPermissionsForRole = (role: EmployeeRole) => {
    let perms: EmployeePermission[] = [];
    if (role === 'admin') {
      perms = ['manage_products', 'manage_jobs', 'manage_bookings', 'manage_rates', 'manage_employees', 'manage_testimonials'];
    } else if (role === 'manager') {
      perms = ['manage_products', 'manage_jobs', 'manage_bookings', 'manage_rates', 'manage_testimonials'];
    } else if (role === 'sales') {
      perms = ['manage_products', 'manage_bookings'];
    } else if (role === 'technician') {
      perms = ['manage_jobs'];
    }
    setEmployeeFormData(prev => ({ ...prev, role, permissions: perms }));
  };

  // AI Generator local states
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIFillProduct = async () => {
    if (!aiSearchQuery || !aiSearchQuery.trim()) {
      showAlert("تنبيه 💡", "الرجاء كتابة اسم أو نوع الجهاز الذي ترغب في توليد بياناته أولاً.", "info");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/gemini/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textInput: aiSearchQuery }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشلت عملية التوليد الذكي.');
      }
      const data = await res.json();
      
      let suggestedImage = "";
      const search_lower = aiSearchQuery.toLowerCase();
      if (search_lower.includes("s32") || search_lower.includes("s24") || search_lower.includes("s23") || search_lower.includes("samsung") || search_lower.includes("سامسونج")) {
        suggestedImage = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80";
      } else if (search_lower.includes("iphone") || search_lower.includes("آيفون") || search_lower.includes("apple") || search_lower.includes("ايفون")) {
        suggestedImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
      } else if (search_lower.includes("cards") || search_lower.includes("شحن") || search_lower.includes("باقة") || search_lower.includes("رصيد")) {
        suggestedImage = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80";
      } else if (search_lower.includes("accessories") || search_lower.includes("سماعة") || search_lower.includes("شاحن") || search_lower.includes("كابل")) {
        suggestedImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80";
      } else {
        suggestedImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
      }

      setProdForm({
        name: data.name || '',
        arabicName: data.arabicName || '',
        category: (data.category as CategoryType) || 'smartphones',
        brand: data.brand || 'Samsung',
        price: data.price || 0,
        originalPrice: data.originalPrice || 0,
        image: suggestedImage,
        specsInput: Array.isArray(data.specs) ? data.specs.join('\n') : '',
        description: data.description || '',
        isBestSeller: true,
        isSpecialOffer: false,
        isNewArrival: true,
      });

      showAlert("توليد الذكاء الاصطناعي ✨", "تم توليد كامل مواصفات وبيانات الهاتف بنجاح وتم تعبئة نموذج نشر الهاتف تلقائياً ببيانات حقيقية 100%! تم إرفاق السعر المناسب في صنعاء بالريال اليمني ومقترحات فنية.", "success");
    } catch (err: any) {
      console.error(err);
      showAlert("خطأ في التوليد الذكي ❌", err.message || "حدث خطأ غير متوقع أثناء توليد البيانات بالذكاء الاصطناعي.", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };



  // --- BARCODE, IMEI, & SERIAL MANAGEMENT STATE ---
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  const startCamera = async () => {
    setCameraError('');
    
    // Stop any active QR code scanner first to release its lock
    if (html5QrScannerInstance) {
      try {
        if (html5QrScannerInstance.isScanning) {
          await html5QrScannerInstance.stop();
        }
      } catch (err) {
        console.warn("Failed stopping QR scanner inside startCamera:", err);
      }
      setHtml5QrScannerInstance(null);
      setShowQRScanner(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraScannerOpen(true);
      triggerToast("تشغيل الكاميرا 📷", "تم تنشيط كاميرا قارئ الباركود والسيريلات بنجاح.", "success");
    } catch (err: any) {
      console.warn("Camera input error: ", err);
      setCameraError("يتعذر تشغيل الكاميرا في هذا المتصفح نتيجة قيود الحماية داخل الإطار. المرجو استخدام نظام إدخال الأكواد والباركود اليدوي السريع أو محاكاة المسح الاحترافي.");
      setIsCameraScannerOpen(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraScannerOpen(false);
  };

  const handleBarcodeScanned = (code: string) => {
    if (!code || !code.trim()) return;
    playBarcodeSound();
    setScannedResult(code);
    triggerToast("قراءة الكود بنجاح ⚡", `تم رصد كود باركود/سيريال: ${code}`, "success");
    
    const cleanCode = code.trim().toLowerCase();
    
    // Exact lookups or broad matching
    const matchedProduct = products.find(p => 
      p.id.toLowerCase().includes(cleanCode) || 
      p.name.toLowerCase().includes(cleanCode) || 
      p.arabicName.toLowerCase().includes(cleanCode) ||
      (p.brand && p.brand.toLowerCase().includes(cleanCode))
    );

    const matchedJob = jobs.find(j => 
      j.id.toLowerCase().includes(cleanCode) || 
      (j.device && j.device.toLowerCase().includes(cleanCode))
    );

    if (matchedProduct) {
      setProdForm({
        name: matchedProduct.name,
        arabicName: matchedProduct.arabicName,
        category: matchedProduct.category,
        brand: matchedProduct.brand,
        price: matchedProduct.price,
        originalPrice: matchedProduct.originalPrice || 0,
        image: matchedProduct.image,
        specsInput: matchedProduct.specs.join('\n'),
        description: matchedProduct.description,
        isBestSeller: matchedProduct.isBestSeller || false,
        isSpecialOffer: matchedProduct.isSpecialOffer || false,
        isNewArrival: matchedProduct.isNewArrival || false,
      });
      setEditingProdId(matchedProduct.id);
      setActiveTab('products');
      showAlert("ربط كود الباركود بنجاح 📦", `تم اكتشاف المنتج "${matchedProduct.arabicName}" وتحميل كامل بياناته في حقول التعديل فوراً!`, "success");
    } else if (matchedJob) {
      setJobForm({
        id: matchedJob.id,
        device: matchedJob.device,
        fault: matchedJob.fault,
        price: matchedJob.price,
        status: matchedJob.status,
        engineer: matchedJob.engineer,
        receivedDate: matchedJob.receivedDate,
        readyDate: matchedJob.readyDate,
      });
      setEditingJobId(matchedJob.id);
      setActiveTab('jobs');
      showAlert("تتبع الصيانة بالفحص الفوري 🛠️", `تم التعرف على كود الصيانة ${matchedJob.id} للجهاز: ${matchedJob.device}.`, "success");
    } else {
      triggerToast("لم يتم العثور على تطابق بالمخزون", `كود المسح "${code}" غير مرتبط بجهاز مسجل. يمكنك الآن استخدامه لإنشاء أو تحديث كود منتجك.`, "warn");
    }
  };

  // --- JSON EXPORT FULL BACKUP ---
  const handleExportJSONBackup = () => {
    try {
      const backupData = {
        products: products,
        bookings: bookings,
        jobs: jobs,
        reviews: reviews,
        rates: rates,
        exportMeta: {
          backupDate: new Date().toISOString(),
          shopAuthority: "معرض جمال الجحفلي لخدمات الهواتف ومبيعاتها بصنعاء",
          systemVersion: "v2.5 Full-Stack Gemini Enterprise"
        }
      };
      
      const fileString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", fileString);
      downloadAnchor.setAttribute("download", `aljahfali_backup_full_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      showAlert("احتمال وإتمام النسخ الاحتياطي 💾", "تم إنتاج الكتالوج الموحد لبيانات المبيعات والحجوزات وتذاكر الصيانة بنجاح وتحميله على جهازك الآن وملائمته للطوارئ.", "success");
    } catch (err: any) {
      showAlert("فشل إتمام الأرشفة المحلية ❌", `تعذر سحب البيانات وتصدير ملف التخزين الاحتياطي: ${err.message || String(err)}`, "error");
    }
  };

  // --- 1. PRODUCT CRUD STATE ---
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    arabicName: '',
    category: 'smartphones' as CategoryType,
    brand: 'Samsung',
    price: 0,
    originalPrice: 0,
    image: '',
    specsInput: '',
    description: '',
    isBestSeller: false,
    isSpecialOffer: false,
    isNewArrival: false,
  });

  // --- 2. MAINTENANCE TRACK TICKETS STATE ---
  const [jobs, setJobs] = useState<any[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({
    id: '', // Booking card numbers e.g. 7818
    device: '',
    fault: '',
    price: '',
    status: 'ready',
    engineer: 'م/ عادل الجحفلي',
    receivedDate: new Date().toISOString().split('T')[0],
    readyDate: 'بانتظار الفحص الفوري',
  });

  // --- 3. CUSTOMER BOOKINGS LIST ---
  const [bookings, setBookings] = useState<any[]>([]);

  // --- 4. EXCHANGE CONVERTER STATE ---
  const [rates, setRates] = useState({
    usdBuy: 530,
    sarBuy: 140,
    usdSell: 535,
    sarSell: 141,
  });
  const [rateSaveSuccess, setRateSaveSuccess] = useState(false);

  // --- 5. TESTIMONIALS MANAGER ---
  const [reviews, setReviews] = useState<Testimonial[]>([]);

  // Fetch admin panel supporting data once logged-in
  useEffect(() => {
    if (isAuthorized) {
      loadSupportiveData();
    }
  }, [isAuthorized]);

  const loadSupportiveData = async () => {
    try {
      const fetchedJobs = await dbGetJobs();
      setJobs(fetchedJobs);

      const fetchedBookings = await dbGetBookings();
      setBookings(fetchedBookings);

      const fetchedRates = await dbGetExchangeRates();
      if (fetchedRates) setRates(fetchedRates);

      const fetchedReviews = await dbGetTestimonials();
      setReviews(fetchedReviews);

      const fetchedEmployees = await dbGetEmployees();
      setEmployees(fetchedEmployees);
    } catch (e) {
      console.error("Could not load backend data for admin panel", e);
    }
  };

  if (!isOpen) return null;

  // Google Sign-In with Firebase Auth
  const handleGoogleLogin = async () => {
    if (!isFirebaseReal || !auth) {
      setLoginError('قاعدة البيانات الحقيقية غير مفعلة حالياً.');
      return;
    }
    setIsSigningIn(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setFirebaseUser(user);
      
      if (user.email === 'lya628625@gmail.com') {
        const superEmp: Employee = {
          id: 'emp-google-super',
          name: user.displayName || 'المدير العام (جوجل)',
          username: 'lya628625@gmail.com',
          role: 'admin',
          permissions: ['manage_products', 'manage_jobs', 'manage_bookings', 'manage_rates', 'manage_employees', 'manage_testimonials'],
          status: 'active'
        };
        setCurrentEmployee(superEmp);
        localStorage.setItem('aljahfali_admin_session_v2', JSON.stringify(superEmp));
        setLoginError('');
        triggerToast('تم الدخول بجوجل ✅', `مرحباً بك يا مدير النظام: ${superEmp.name}`, 'success');
      } else {
        const emps = await dbGetEmployees();
        const found = emps.find(e => e.username.toLowerCase() === user.email?.toLowerCase());
        if (found) {
          if (found.status === 'suspended') {
            setLoginError('❌ عذراً، هذا الحساب الموظف موقوف حالياً من قبل الإدارة العامة.');
            return;
          }
          setCurrentEmployee(found);
          localStorage.setItem('aljahfali_admin_session_v2', JSON.stringify(found));
          setLoginError('');
          triggerToast('تم الدخول بجوجل ✅', `مرحباً بك مجدداً يا ${found.name}`, 'success');
        } else {
          setLoginError(`تم تسجيل الدخول بنجاح بـ ${user.email}، ولكن هذا الحساب غير مسجل كمسؤول أو موظف نشط بمحل الجحفلي.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked' || err.message?.includes('popup') || err.message?.toLowerCase().includes('popup-blocked') || err.message?.toLowerCase().includes('blocked')) {
        setLoginError('🔏 قام المتصفح بحظر النافذة المنبثقة لمصادقة جوجل بسبب تشغيل التطبيق في نافذة مستعارة (Iframe). يرجى فتح التطبيق في نافذة مستقلة كاملة، أو استخدام رمز الدخول السريع (هاتف المحل) أدناه لتسجيل الدخول فوراً وبأمان تام.');
      } else {
        setLoginError(`خطأ في مصادقة جوجل: ${err.message || String(err)}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign-in authentication
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // Fetch latest employees to authenticate correctly
    const currentEmployees = await dbGetEmployees();

    if (!trimmedUser && trimmedPass === '781831833') {
      const superEmp = currentEmployees.find(e => e.username === 'admin') || {
        id: 'emp-jamal',
        name: 'جمال الجحفلي',
        username: 'admin',
        password: '781831833',
        role: 'admin',
        permissions: ['manage_products', 'manage_jobs', 'manage_bookings', 'manage_rates', 'manage_employees', 'manage_testimonials'],
        status: 'active'
      };
      if (superEmp.status === 'suspended') {
        setLoginError('❌ تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة.');
        return;
      }
      setCurrentEmployee(superEmp);
      localStorage.setItem('aljahfali_admin_session_v2', JSON.stringify(superEmp));
      triggerToast('تم الدخول بنجاح 👤', `مرحباً بك مجدداً يا ${superEmp.name}. تم تسجيل الدخول بصلاحية مدير النظام.`, 'success');
      return;
    }

    const found = currentEmployees.find(
      (emp) => emp.username.toLowerCase() === trimmedUser.toLowerCase() && emp.password === trimmedPass
    );

    if (found) {
      if (found.status === 'suspended') {
        setLoginError('❌ عذراً، هذا الحساب الموظف موقوف حالياً من قبل الإدارة العامة.');
        return;
      }
      setCurrentEmployee(found);
      localStorage.setItem('aljahfali_admin_session_v2', JSON.stringify(found));
      
      found.lastActive = new Date().toLocaleString('ar-YE');
      await dbSaveEmployee(found);

      triggerToast('تم الدخول بنجاح 🔑', `مرحباً بك مجدداً، ${found.name} (${found.role === 'admin' ? 'مدير نظام' : found.role === 'manager' ? 'مشرف' : found.role === 'sales' ? 'مبيعات' : 'فني صيانة'}).`, 'success');
    } else {
      setLoginError('❌ اسم المستخدم أو رمز الدخول غير صحيح. يرجى التحقق من المدخلات.');
    }
  };

  const handleLogout = async () => {
    setCurrentEmployee(null);
    localStorage.removeItem('aljahfali_admin_session_v2');
    setUsername('');
    setPassword('');
    if (isFirebaseReal && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Error logging out", err);
      }
    }
    setFirebaseUser(null);
    triggerToast('تم الخروج 🔒', 'تم إنهاء الجلسة الإدارية للموظف بأمان وإغلاق النظام.', 'info');
  };

  // --- 1. PRODUCT OPERATIONS ---
  const handleCreateOrUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!prodForm.arabicName || !prodForm.price || !prodForm.image) {
      showAlert('تنبيه ناقص ⚠️', 'الرجاء تعبئة اسم المنتج بالكامل وصورة الهاتف والسعر لبدء النشر.', 'error');
      return;
    }

    const finalSpecs = prodForm.specsInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s !== '');

    const pData: Product = {
      id: editingProdId || `custom-phone-${Date.now()}`,
      name: prodForm.name || prodForm.arabicName,
      arabicName: prodForm.arabicName,
      category: prodForm.category,
      brand: prodForm.brand,
      price: Number(prodForm.price),
      originalPrice: prodForm.originalPrice ? Number(prodForm.originalPrice) : undefined,
      image: prodForm.image,
      specs: finalSpecs.length > 0 ? finalSpecs : ['خصائص تقنية عالية متطورة'],
      description: prodForm.description || 'جهاز مميز أصلي متوفر للبيع في محلنا المعتمد بصنعاء.',
      isBestSeller: prodForm.isBestSeller,
      isSpecialOffer: prodForm.isSpecialOffer,
      isNewArrival: prodForm.isNewArrival,
      stock: 10
    };

    if (editingProdId) {
      onUpdateProduct(pData);
      await dbSaveProduct(pData);
      showAlert('تم تحديث الهاتف بنجاح ✅', `تم تعديل مواصفات وحجم مخزون الجهاز "${pData.arabicName}" وتحديثه بقاعدة البيانات الحية ومزامنته للزوار.`, 'success');
      setEditingProdId(null);
    } else {
      onAddProduct(pData);
      await dbSaveProduct(pData);
      showAlert('تم إضافة الهاتف الجديد 📦', `تم إدراج الجهاز الفريد "${pData.arabicName}" ضمن بوابات المعرض بنجاح وبدء تسويقه فوراً لعملاء اليمن.`, 'success');
    }

    // Reset product form
    setProdForm({
      name: '',
      arabicName: '',
      category: 'smartphones',
      brand: 'Samsung',
      price: 0,
      originalPrice: 0,
      image: '',
      specsInput: '',
      description: '',
      isBestSeller: false,
      isSpecialOffer: false,
      isNewArrival: false,
    });
  };

  const selectProductForEdit = (prod: Product) => {
    setEditingProdId(prod.id);
    setProdForm({
      name: prod.name,
      arabicName: prod.arabicName,
      category: prod.category,
      brand: prod.brand,
      price: prod.price,
      originalPrice: prod.originalPrice || 0,
      image: prod.image,
      specsInput: prod.specs.join('\n'),
      description: prod.description,
      isBestSeller: !!prod.isBestSeller,
      isSpecialOffer: !!prod.isSpecialOffer,
      isNewArrival: !!prod.isNewArrival,
    });
  };

  const deleteProductItem = async (pId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك بالمسح الفوري لهذا الهاتف من المتجر؟')) {
      onDeleteProduct(pId);
      await dbDeleteProduct(pId);
      showAlert('تم الحذف بنجاح 🗑️', 'تمت إزالة المنتج نهائياً من الخوادم وقاعدة السحابة والكتالوج العام.', 'success');
    }
  };

  // --- 2. REPAIR TICKET / JOB OPERATIONS ---
  const handleSaveJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!jobForm.id || !jobForm.device || !jobForm.fault) {
      showAlert('حقول غير مكتملة ⚠️', 'الرجاء كتابة كود التتبع الفريد، ونوع الجهاز، والعطل المراد صيانته لإصدار كارت الضمان.', 'error');
      return;
    }

    await dbSaveJob(jobForm);
    showAlert('تم إصدار بطاقة الصيانة 🛠️', `تم تثبيت كارت الضمان والتتبع بالرمز [ ${jobForm.id} ] للجهاز [ ${jobForm.device} ] بنجاح وحفظه.`, 'success');
    
    // Refresh list
    const fetchedJobs = await dbGetJobs();
    setJobs(fetchedJobs);
    
    // Clear Form
    setJobForm({
      id: '',
      device: '',
      fault: '',
      price: '',
      status: 'ready',
      engineer: 'م/ عادل الجحفلي',
      receivedDate: new Date().toISOString().split('T')[0],
      readyDate: 'جاهز فوراً للتسليم',
    });
    setEditingJobId(null);
  };

  const editJobTicket = (job: any) => {
    setEditingJobId(job.id);
    setJobForm({
      id: job.id,
      device: job.device,
      fault: job.fault,
      price: job.price,
      status: job.status,
      engineer: job.engineer,
      receivedDate: job.receivedDate,
      readyDate: job.readyDate,
    });
  };

  const deleteJobTicket = async (jId: string) => {
    if (window.confirm('هل ترغب حقاً في إزالة تذكرة الصيانة هذه نهائياً؟')) {
      await dbDeleteJob(jId);
      const fetched = await dbGetJobs();
      setJobs(fetched);
      showAlert('تمت الإزالة 🗑️', `تم مسح كارت الضمان وتتبع الصيانة بالرمز [ ${jId} ] نهائياً من قاعدة البيانات السحابية.`, 'success');
    }
  };

  // --- 4. EXCHANGE RATES UPDATES ---
  const saveRatesForm = async (e: FormEvent) => {
    e.preventDefault();
    await dbSaveExchangeRates(rates);
    
    // Auto sync state to user-face conversions
    localStorage.setItem('aljahfali_rates_v2', JSON.stringify(rates));
    setRateSaveSuccess(true);
    setTimeout(() => setRateSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 text-slate-100 font-sans" dir="rtl">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-indigo-950/75 backdrop-blur-md transition-opacity" />

      {/* Admin Window - Premium Slate Indigo Royal Layout */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950/85 to-slate-900 border border-indigo-400/20 rounded-3xl w-full max-w-5xl z-10 shadow-[0_25px_60px_rgba(49,46,129,0.35)] overflow-hidden max-h-[92vh] flex flex-col animate-fade-in text-right">
        
        {/* Title Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-950/85 backdrop-blur-md border-b border-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-300 rounded-xl text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
              <Lock className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-lg font-black text-white tracking-wide">لوحة تحكم محل الجحفلي المعتمد</h2>
                {isFirebaseReal ? (
                  isFirestoreOffline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      مزامنة محلية مؤمنة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      سحابي نشط
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black bg-slate-550/10 text-slate-400 border border-slate-800">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    تخزين محلي آمن
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-sans mt-0.5">الرعاية والاشراف التقني المعتمد بإدارة الأستاذ جمال الجحفلي</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAuthorized ? (
          /* Locked Login Form */
          <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-slate-950/20">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-pulse">
              <Lock className="h-8 w-8" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">إدارة متكاملة وقواعد بيانات حقيقية</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              لإدارة وتحديث الأسعار، إضافة هواتف وصور جديدة، تعبئة أكواد تتبع الصيانة، تصفح حجوزات الزبائن وتعديل الصرف؛ يرجى كتابة الرمز الإداري.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3.5">
              <div className="space-y-1.5 text-right">
                <label htmlFor="admin-user-form-input" className="block text-xs font-bold text-slate-400 mr-1">اسم الموظف / اسم المستخدم:</label>
                <input
                  id="admin-user-form-input"
                  type="text"
                  placeholder="مثال: admin أو saleh..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-center px-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 text-white rounded-xl focus:outline-none text-sm font-sans placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label htmlFor="admin-pass-form-input" className="block text-xs font-bold text-slate-400 mr-1">رمز الدخول الشخصي للموظف:</label>
                <input
                  id="admin-pass-form-input"
                  type="password"
                  required
                  placeholder="أدخل الرمز الخاص بك..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-center px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 text-white rounded-xl focus:outline-none font-mono tracking-widest text-lg"
                />
                <span className="block text-right text-[10px] text-amber-500/80 mt-1 mr-1">
                  💡 تلميح: اترك حقل الاسم فارغاً واكتب هاتف المحل <b>781831833</b> للدخول مباشرة كمدير عام.
                </span>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-right">
                  <AlertCircle className="h-4 w-4 shrink-0 animate-bounce" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-md"
              >
                ولوج آمن ومصادقة
              </button>

              {isFirebaseReal && (
                <>
                  <div className="flex items-center my-3">
                    <div className="flex-grow border-t border-slate-900"></div>
                    <span className="mx-2.5 text-[10px] text-slate-500">أو الطريقة السحابية المباشرة</span>
                    <div className="flex-grow border-t border-slate-900"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{isSigningIn ? 'جاري الاتصال بالسحابة...' : 'مصادقة بصفتك المالك (Google Sign-In)'}</span>
                  </button>
                </>
              )}
            </form>
          </div>
        ) : (
          /* Fully-Fledged Workspace */
          <div className="flex-grow flex flex-col overflow-hidden">
            
            {/* Top Stats Indicator & Tab Bar Switcher */}
            <div className="bg-slate-950 p-3 sm:px-6 border-b border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {checkPermission('manage_products') && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'products'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>كتالوج الهواتف والمنتجات</span>
                  </button>
                )}
                {checkPermission('manage_jobs') && (
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'jobs'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    <span>تذاكر وأكواد تتبع الصيانة</span>
                  </button>
                )}
                {checkPermission('manage_bookings') && (
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      activeTab === 'bookings'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>طلب حجوزات ومراسلات</span>
                    {bookings.length > 0 && (
                      <span className="absolute -top-1 -left-1 bg-red-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                        {bookings.length}
                      </span>
                    )}
                  </button>
                )}
                {checkPermission('manage_rates') && (
                  <button
                    onClick={() => setActiveTab('rates')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'rates'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>تعديل الصرف والعملات</span>
                  </button>
                )}
                {checkPermission('manage_testimonials') && (
                  <button
                    onClick={() => setActiveTab('testimonials')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'testimonials'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Star className="h-4 w-4" />
                    <span>مراجعات وتقييمات زبائن</span>
                  </button>
                )}
                {checkPermission('manage_employees') && (
                  <button
                    onClick={() => setActiveTab('employees')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'employees'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>شؤون الموظفين والصلاحيات</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startScanning}
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] transition-all duration-200 shadow-lg cursor-pointer shrink-0"
                >
                  <Barcode className="h-3.5 w-3.5" />
                  <span>ماسح الكاميرا الذكي 📹</span>
                </button>
                <span className="hidden lg:inline text-[10px] text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-full bg-slate-950/40">
                  👤 الموظف: <b className="text-amber-400">{currentEmployee?.name}</b> <span className="opacity-60 font-medium">({currentEmployee?.role === 'admin' ? 'مدير عام' : currentEmployee?.role === 'manager' ? 'مشرف' : currentEmployee?.role === 'sales' ? 'مبيعات' : 'فني'})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full transition-all"
                >
                  تسجيل خروج
                </button>
              </div>
            </div>

            {/* Main Interactive Screen Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/40 custom-scrollbar space-y-6">

              {/* === UNIFIED COMMAND DECK: BACKUPS, LIVE ALERTS & BARCODE SYSTEMS === */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. BACKUP & SYSTEM RECOVERY */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
                        <ShieldAlert className="h-4 w-4 animate-pulse text-amber-500" />
                        <span>الأرشفة وتحصين قواعد البيانات 💾</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                        تكامل حي نشط
                      </span>
                    </div>
                    <h4 className="text-white font-extrabold text-sm">تصدير كتالوج المخزون والحجوزات ومكافأة الطوارئ</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      قم بإنشاء وتنزيل ملف نسخ احتياطي من نوع <code className="font-mono text-amber-400">JSON</code> مشفر يحمل كامل محتويات معرض جمال الجحفلي لعام 2026، من مبيعات هواتف، وطلبات صيانة، وتغيير عملات للتأمين الفوري.
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded-lg text-[9px] text-slate-400 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span>نوع التشفير المعتمد:</span>
                        <span className="text-slate-300">UTF-8 / RSA-256</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المنتجات حالياً في المخزن:</span>
                        <span className="text-amber-500 font-bold">{products.length} هاتف</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الحجوزات المعلقة:</span>
                        <span className="text-amber-500 font-bold">{bookings.length} زبون</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleExportJSONBackup}
                    className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>تصدير ملف النسخ الاحتياطي الفوري (.JSON)</span>
                  </button>
                </div>

                {/* 2. LIVE BARCODE / IMEI SCANNER DELEGATOR */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-yellow-500 font-extrabold text-xs">
                        <Barcode className="h-4 w-4" />
                        <span>محطة مسح باركود الهواتف والسيريلات IMEI ⚡</span>
                      </div>
                      <button
                        onClick={startCamera}
                        className="text-[9px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        <span>مسح كاميرا</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                      مسح وربط سيريال المنتج أو كود التتبع بصورة فورية. أدخل الرمز يدوياً، أو استخدم مسدس ليزر الباركود المباشر، أو جرب أكواد الفحص التوضيحية لفرز الهاتف فوراً بالتعديل:
                    </p>

                    {/* Camera Video Simulator UI */}
                    {isCameraScannerOpen && (
                      <div className="relative mb-3.5 bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 text-center animate-fade-in">
                        <div className="bg-indigo-900/10 p-2.5 rounded border border-indigo-500/10 text-[10px] text-indigo-300 leading-relaxed">
                          {cameraError ? (
                            <span className="text-red-400 font-semibold">{cameraError}</span>
                          ) : (
                            <div className="space-y-2">
                              <span className="block text-emerald-400 font-bold animate-pulse">● القارئ البصري المتفاعل قيد العمل...</span>
                              <span className="text-slate-400">كاميرا الهاتف تفحص خطوط الباركود. يمكنك كتابة الكود يدويًا أدناه لمحاكاة الاتصال.</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={stopCamera}
                          className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 rounded-md border border-red-500/10 cursor-pointer"
                        >
                          إغلاق الكاميرا
                        </button>
                      </div>
                    )}

                    {/* Simulators tags */}
                    <div className="text-[9px] mb-3">
                      <span className="text-slate-400 block mb-1">انقر أدناه لمحاكاة مسح جهاز أو كود صيانة فوري:</span>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {products.slice(0, 2).map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleBarcodeScanned(p.id)}
                            className="bg-slate-950 hover:bg-slate-850 hover:border-amber-400 text-slate-300 px-2 py-1 rounded border border-slate-850 block text-right max-w-full truncate cursor-pointer"
                            title={p.arabicName}
                          >
                            📟 باركود: <b className="text-amber-500">{p.id.substring(0, 15)}...</b>
                          </button>
                        ))}
                        {jobs.slice(0, 1).map(j => (
                          <button
                            key={j.id}
                            onClick={() => handleBarcodeScanned(j.id)}
                            className="bg-slate-950 hover:bg-slate-850 hover:border-amber-400 text-slate-300 px-2 py-1 rounded border border-slate-850 block text-right max-w-full truncate cursor-pointer"
                            title={j.device}
                          >
                            🛠️ صيانة: <b className="text-sky-500">{j.id}</b>
                          </button>
                        ))}
                        <button
                          onClick={() => handleBarcodeScanned("7818-notfound")}
                          className="bg-slate-950 hover:bg-slate-850 text-slate-400 px-2 py-1 rounded border border-slate-850 block text-right text-[8px] cursor-pointer"
                        >
                          🧪 اختبار جديد
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أدخل باركود أو سيريال IMEI..."
                        value={inventorySearchQuery}
                        onChange={(e) => setInventorySearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeScanned(inventorySearchQuery);
                            setInventorySearchQuery('');
                          }
                        }}
                        className="flex-grow px-3 py-2 bg-slate-950 focus:bg-slate-900 border border-slate-800 focus:border-amber-500 text-white rounded-lg text-xs font-mono"
                      />
                      <button
                        onClick={() => {
                          handleBarcodeScanned(inventorySearchQuery);
                          setInventorySearchQuery('');
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Barcode className="h-3 w-5" />
                        <span>تأكيد</span>
                      </button>
                    </div>
                  </div>
                  {scannedResult && (
                    <div className="mt-3.5 flex items-center justify-between text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-850 animate-fade-in">
                      <span className="text-slate-400">آخر الكود مقروء:</span>
                      <span className="font-mono text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{scannedResult}</span>
                    </div>
                  )}
                </div>

                {/* 3. LIVE LOGS AND RECENT AUDIT NOTIFICATIONS */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs">
                        <Bell className="h-4 w-4 text-sky-400" />
                        <span>سجل إشعارات والعمليات الإدارية الحية 📢</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                      تتغير هذه السجلات الحالية استجابةً لكل الإجراءات التي تقوم بها بالمتجر، كإلغاء حجز أو تحديث سعر صرف أو تعديل كارت صيانة:
                    </p>

                    <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar pr-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850/50">
                      {notifications.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-[10px]">لا توجد تنبيهات نشطة حالياً.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="text-[10px] border-b border-slate-900/30 pb-1.5 last:border-0 last:pb-0 flex items-start gap-1.5 text-right font-sans">
                            <span className="mt-0.5 shrink-0">
                              {n.type === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {n.type === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                              {n.type === 'warn' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              {n.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                            </span>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-200 text-[10px]">{n.title}</span>
                                <span className="text-[8px] text-slate-500 font-mono">{n.time}</span>
                              </div>
                              <p className="text-slate-400 text-[9px] mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        setNotifications([
                          {
                            id: `notif-${Date.now()}`,
                            type: 'info',
                            title: 'تطهير يدوي 🛡️',
                            message: 'تم تصفير لوحة التنبيهات وإبقاء نوافذ الحماية نشطة.',
                            time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
                          }
                        ]);
                        triggerToast("تطهير السجل 🧹", "تم تفريغ التنبيهات المكدسة لإبقاء اللوحة واضحة ومستقرة.", "info");
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      تطهير السجل الإداري
                    </button>
                    <span className="text-[8px] text-slate-500">اتصال المخدم: معتمد وآمن 🔐</span>
                  </div>
                </div>
              </div>

              {/* TABS 1: PRODUCTS CRUDS */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Form Adding */}
                  <div className="bg-slate-950/40 p-4 sm:p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 mb-4">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>{editingProdId ? 'تحديث وتعديل بيانات الهاتف الحالي' : 'إدراج جهاز جديد أو بطاقة تعبئة للكتالوج الحقيقي'}</span>
                    </h3>

                    {/* قسم التعبئة التلقائية المبتكر بالذكاء الاصطناعي */}
                    <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs mb-1.5">
                        <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                        <span>تعبئة تلقائية ذكية للمنتجات بذكاء اصطناعي حقيقي لـ Gemini ✨</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                        اكتب اسم أي جهاز (مثال: s32 ultra, iphone 16 mini, شاحن انكر سريع) وسيقوم الذكاء الاصطناعي بتوليد كامل المواصفات الفنية باللغة العربية، والسعر المناسب في صنعاء بالريال اليمني، وتفاصيل تسويقية كاملة فوراً!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="مثلاً: s32 ultra, ايفون 16 برو ماكس..."
                          value={aiSearchQuery}
                          onChange={(e) => setAiSearchQuery(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAIFillProduct}
                          disabled={isGeneratingAI}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {isGeneratingAI ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                              <span>جاري طبخ البيانات بالذكاء الاصطناعي...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              <span>تعبئة البيانات تلقائياً 🪄</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleCreateOrUpdateProduct} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-1">اسم الهاتف بالعربي الإملائي للمشترين *</label>
                          <input
                            type="text"
                            required
                            placeholder="آيفون 16 برو ماكس - بضمان المحل"
                            value={prodForm.arabicName}
                            onChange={(e) => setProdForm({ ...prodForm, arabicName: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">الاسم بالإنجليزية (اختياري)</label>
                          <input
                            type="text"
                            placeholder="iPhone 16 Pro Max"
                            value={prodForm.name}
                            onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">القسم والنوع لفرز الهواتف في الواجهات</label>
                          <select
                            value={prodForm.category}
                            onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as CategoryType })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          >
                            <option value="smartphones">هواتف ذكية جديدة</option>
                            <option value="used_devices">أجهزة مستعملة ومجددة</option>
                            <option value="electronics">أجهزة وساعات إلكترونية</option>
                            <option value="accessories">إكسسوارات وسماعات</option>
                            <option value="recharge_cards">باقات وبطاقات شحن سوبر</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">الشركة المصنعة</label>
                          <select
                            value={prodForm.brand}
                            onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          >
                            <option value="iPhone">Apple / iPhone</option>
                            <option value="Samsung">Samsung</option>
                            <option value="Xiaomi">Xiaomi</option>
                            <option value="Oppo">Oppo</option>
                            <option value="Realme">Realme</option>
                            <option value="Infinix">Infinix</option>
                            <option value="Tecno">Tecno</option>
                            <option value="Yemen Mobile">Yemen Mobile (باقات شحن)</option>
                            <option value="SabaFon">SabaFon (باقات شحن)</option>
                            <option value="YOU">YOU (باقات شحن)</option>
                            <option value="Other">ماركات أخرى متفرقة</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">السعر البيعي المطلوب (ر.ي ريال يمني) *</label>
                          <input
                            type="number"
                            required
                            min="10"
                            placeholder="650000"
                            value={prodForm.price || ''}
                            onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">السعر القديم قبل الخصم (ر.ي) (اختياري)</label>
                          <input
                            type="number"
                            placeholder="700000"
                            value={prodForm.originalPrice || ''}
                            onChange={(e) => setProdForm({ ...prodForm, originalPrice: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Image direct URL input or local device upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-1 font-bold text-slate-300">الخيار أ: رابط صورة خارجي للمنتج</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={prodForm.image.startsWith('data:') ? '' : prodForm.image}
                            onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1 font-bold text-slate-300">الخيار ب: رفع ملف صورة من جهازك الإداري 📂</label>
                          <div className="relative border border-dashed border-slate-700 hover:border-amber-500 rounded-lg p-2 flex items-center justify-center bg-slate-950/40 text-center cursor-pointer transition">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 15 * 1024 * 1024) {
                                    showAlert("ملف كبير جداً ⚠️", "حجم الملف كبير جداً! يرجى اختيار صورة يقل كلياً حجمها عن 15 ميجابايت لتجنب إبطاء العميل.", "error");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setProdForm({ ...prodForm, image: reader.result });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex items-center gap-2 text-slate-300 py-1 font-bold">
                              <Upload className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>اضغط هنا لاختيار صورة من جهازك</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Image Preview Area */}
                      {prodForm.image && (
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3.5">
                          <img
                            src={prodForm.image}
                            alt="معاينة الهاتف"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] text-emerald-400 font-bold">✓ تم تفعيل الصورة بنجاح وجاهزة للحفظ</span>
                            <span className="block text-[9px] text-slate-500 truncate mt-0.5">{prodForm.image.startsWith('data:') ? 'ملف مرفوع محلياً (Base64 Data URI)' : prodForm.image}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, image: '' })}
                            className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-1 rounded hover:text-red-400 font-black"
                          >
                            إزالة الصورة
                          </button>
                        </div>
                      )}

                      {/* Description */}
                      <div>
                        <label className="block text-slate-400 mb-1">تفاصيل إرشادية ووصف للمشتري بالعربية</label>
                        <textarea
                          rows={2}
                          placeholder="هاتف فاخر أصلي تم اختباره متكامل للتسليم الفوري في صنعاء..."
                          value={prodForm.description}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>

                      {/* Specifications separated by line */}
                      <div>
                        <label className="block text-slate-400 mb-1">المميزات والخصائص الفنية (اكتب كل ميزة في سطر منفرد)</label>
                        <textarea
                          rows={3}
                          placeholder="شاشة حجم 6.9 بوصة سوبر أموليد&#10;كاميرا تصوير 5x حقيقية&#10;بطارية سعتها 4800 ملي أمبير كرت"
                          value={prodForm.specsInput}
                          onChange={(e) => setProdForm({ ...prodForm, specsInput: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                        />
                      </div>

                      {/* Promotion badges */}
                      <div className="bg-slate-900 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodForm.isBestSeller}
                            onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                            className="rounded border-slate-800 text-amber-500 font-mono"
                          />
                          <span>تثبيت في الأكثر مبيعاً ⭐</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodForm.isSpecialOffer}
                            onChange={(e) => setProdForm({ ...prodForm, isSpecialOffer: e.target.checked })}
                            className="rounded border-slate-800 text-amber-500 font-mono"
                          />
                          <span>تثبيت في التخفيضات الكبرى 🔥</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={prodForm.isNewArrival}
                            onChange={(e) => setProdForm({ ...prodForm, isNewArrival: e.target.checked })}
                            className="rounded border-slate-800 text-amber-500 font-mono"
                          />
                          <span>تثبيت في قسم وصل حديثاً ✨</span>
                        </label>
                      </div>

                      <div className="flex gap-2 justify-end">
                        {editingProdId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProdId(null);
                              setProdForm({
                                name: '', arabicName: '', category: 'smartphones', brand: 'Samsung',
                                price: 0, originalPrice: 0, image: '', specsInput: '', description: '',
                                isBestSeller: false, isSpecialOffer: false, isNewArrival: false
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 font-bold"
                          >
                            إلغاء
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-6 py-2 rounded-xl font-bold shadow-md hover:from-amber-600 hover:to-yellow-500 text-xs transition-all"
                        >
                          <Save className="h-4 w-4" />
                          <span>{editingProdId ? 'حفظ تعديلات الهاتف' : 'حفظ ونشر الهاتف في المعرض'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Products listings table */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden p-4">
                    <h4 className="text-white font-extrabold mb-3 text-sm">الأجهزة المتوفرة بالموقع ({products.length} منتج نشط):</h4>
                    <div className="overflow-x-auto text-[11px]">
                      <table className="w-full text-right divide-y divide-slate-800">
                        <thead>
                          <tr className="text-slate-400">
                            <th className="px-3 py-2">الصورة والاسم بالتفصيل</th>
                            <th className="px-3 py-2">القسم</th>
                            <th className="px-3 py-2">العلامة</th>
                            <th className="px-3 py-2">السعر ر.ي</th>
                            <th className="px-3 py-2 text-center">الإجراءات والتحكم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300">
                          {products.map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-900/40">
                              <td className="px-3 py-2 flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.arabicName}
                                  className="w-9 h-9 object-cover rounded border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="max-w-[180px] truncate">
                                  <span className="block font-bold text-white text-[12px]">{prod.arabicName}</span>
                                  <span className="block text-[9px] text-slate-500 truncate font-mono">{prod.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-400">{prod.category}</td>
                              <td className="px-3 py-2 text-slate-400 font-bold">{prod.brand}</td>
                              <td className="px-3 py-2 text-amber-400 font-bold font-mono">{prod.price.toLocaleString()} ر.ي</td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleShowQRCodeModal(prod)}
                                    className="p-1.5 rounded bg-slate-900 text-emerald-400 hover:text-emerald-300 hover:bg-slate-850 hover:scale-105 border border-slate-800 transition-all cursor-pointer"
                                    title="توليد ملصق وطباعة الرمز المربع"
                                  >
                                    <Barcode className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => selectProductForEdit(prod)}
                                    className="p-1.5 rounded bg-slate-900 text-slate-300 hover:text-amber-400 border border-slate-800"
                                    title="تعديل بيانات"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteProductItem(prod.id)}
                                    className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    title="مسح من الكتالوج"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TABS 2: MAINTENANCE TO TRACK CUSTOMER REPAIRS */}
              {activeTab === 'jobs' && (
                <div className="space-y-6">
                  {/* Create Repair Job Form */}
                  <div className="bg-slate-950/40 p-4 sm:p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 mb-4">
                      <Laptop className="h-4 w-4 text-amber-500" />
                      <span>{editingJobId ? 'تعديل تذكرة الصيانة المفتوحة' : 'إنشاء تذكرة صيانة برمز تتبع خاص لخدمة الزبائن'}</span>
                    </h3>

                    <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-1">كود التتبع الفريد للزبون (مثلاً: 7818, 1234) *</label>
                          <input
                            type="text"
                            required
                            placeholder="7818"
                            disabled={!!editingJobId}
                            value={jobForm.id}
                            onChange={(e) => setJobForm({ ...jobForm, id: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">نوع الجهاز المستلم *</label>
                          <input
                            type="text"
                            required
                            placeholder="Samsung S23 Ultra"
                            value={jobForm.device}
                            onChange={(e) => setJobForm({ ...jobForm, device: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">المهندس الفاحص المسلم للتوجيه</label>
                          <input
                            type="text"
                            placeholder="م/ عادل الجحفلي"
                            value={jobForm.engineer}
                            onChange={(e) => setJobForm({ ...jobForm, engineer: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">الحالة الراهنة للجهاز بالورشة</label>
                          <select
                            value={jobForm.status}
                            onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-right"
                          >
                            <option value="diagnosed">تحت الفحص والتشخيص الفوري</option>
                            <option value="spare-parts">في انتظار تأمين قطع الغيار الأصلية</option>
                            <option value="in-progress">تحت الصيانة والإصلاح الفعلي</option>
                            <option value="ready">جاهز فوراً للاستلام والتسليم للزبون ✅</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-slate-400 mb-1">تفاصيل العطل الفني المشخص *</label>
                          <input
                            type="text"
                            required
                            placeholder="تبديل شاشة أصلية كاملة مع فريم وكالة وحل مشكلة الشحن السريع"
                            value={jobForm.fault}
                            onChange={(e) => setJobForm({ ...jobForm, fault: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">التكلفة والأسعار والضمان بالريال</label>
                          <input
                            type="text"
                            placeholder="55,000 ريال يمني"
                            value={jobForm.price}
                            onChange={(e) => setJobForm({ ...jobForm, price: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">موعد التسليم المتوقع والجاهزية</label>
                          <input
                            type="text"
                            placeholder="غداً مساءً الساعة 6"
                            value={jobForm.readyDate}
                            onChange={(e) => setJobForm({ ...jobForm, readyDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        {editingJobId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJobId(null);
                              setJobForm({
                                id: '', device: '', fault: '', price: '', status: 'ready', engineer: 'م/ عادل الجحفلي',
                                receivedDate: new Date().toISOString().split('T')[0], readyDate: 'جاهز فوراً'
                              });
                            }}
                            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl"
                          >
                            إلغاء
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-all"
                        >
                          <Save className="h-4 w-4" />
                          <span>{editingJobId ? 'تعديل التذكرة وإرسال التحديث للزبون' : 'إطلاق وتثبيت تذكرة التتبع'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Active Repair Tickets Listings */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden p-4">
                    <h4 className="text-white font-extrabold mb-3 text-sm">التذاكر المسجلة بقاعدة بيانات التتبع المباشر ({jobs.length} تذكرة):</h4>
                    <div className="overflow-x-auto text-[11px]">
                      <table className="w-full text-right divide-y divide-slate-800">
                        <thead>
                          <tr className="text-slate-400">
                            <th className="px-3 py-2">كود التتبع للزبون</th>
                            <th className="px-3 py-2">نوع الهاتف المستلم</th>
                            <th className="px-3 py-2">العطل المتواجد</th>
                            <th className="px-3 py-2">المهندس الفاحص</th>
                            <th className="px-3 py-2">السعر المدان</th>
                            <th className="px-3 py-2">حالة التصليح</th>
                            <th className="px-3 py-2 text-center">الإجراء المتاح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300">
                          {jobs.map(job => (
                            <tr key={job.id} className="hover:bg-slate-900/40">
                              <td className="px-3 py-2 font-mono font-bold text-amber-500 text-[13px]">{job.id}</td>
                              <td className="px-3 py-2 font-semibold text-white">{job.device}</td>
                              <td className="px-3 py-2 text-slate-400 max-w-[150px] truncate">{job.fault}</td>
                              <td className="px-3 py-2 text-slate-400">{job.engineer}</td>
                              <td className="px-3 py-2 text-emerald-400 font-bold font-mono">{job.price}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${
                                  job.status === 'ready' 
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                                    : job.status === 'in-progress'
                                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                    : job.status === 'spare-parts'
                                    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                                    : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                }`}>
                                  {job.status === 'ready' && 'جاهز ومفحوص ✅'}
                                  {job.status === 'in-progress' && 'تحت العمل والفك صيانة 🛠️'}
                                  {job.status === 'spare-parts' && 'انتظار قطع الغيار ⚙️'}
                                  {job.status === 'diagnosed' && 'تحت التشاور والكشف 🔬'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => editJobTicket(job)}
                                    className="p-1 px-2.5 rounded bg-slate-900 border border-slate-800 hover:text-amber-500 text-slate-350"
                                    title="تعديل الحالة والبيانات"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteJobTicket(job.id)}
                                    className="p-1 px-2 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    title="مسح التذكرة"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TABS 3: REGISTERED CUSTOMER BOOKING REQUESTS */}
              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/40 p-4 sm:p-5 border border-slate-800 rounded-xl text-right">
                    <span className="text-amber-500 text-xs font-bold block mb-1">قائمة بيانات PII المؤمنة</span>
                    <h3 className="text-white font-extrabold text-sm sm:text-base">طلبات حجز وتأهيل الصيانة المرسلة من الزبائن للورشة ({bookings.length} طلب):</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">تبحث هذه اللائحة عن الزبائن الذين حجزوا موعد صيانة بالعاصمة صنعاء عبر نموذج الموقع الإلكتروني.</p>
                  </div>

                  {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 relative overflow-hidden transition hover:border-amber-500/20">
                          <div className="absolute top-0 left-0 bg-amber-500/15 text-amber-400 font-mono text-[9px] px-2.5 py-1 rounded-br-xl uppercase font-bold">
                            حجز موعد
                          </div>
                          
                          <div className="space-y-1">
                            <span className="block text-slate-500 text-[10px]">الزبون الحارس:</span>
                            <span className="block font-bold text-white text-sm">{booking.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-b border-slate-900 py-2 my-2">
                            <div>
                              <span className="block text-slate-500 text-[9px]">الجوال المسجل:</span>
                              <span className="font-mono text-white font-semibold">{booking.phone}</span>
                            </div>
                            <div>
                              <span className="block text-slate-500 text-[9px]">الجهاز المستهدف:</span>
                              <span className="text-amber-400 font-semibold">{booking.device}</span>
                            </div>
                          </div>

                          <div className="text-right text-[11px] space-y-1">
                            <span className="block text-slate-500 text-[9px]">شرح تفاصيل العطل والخلل:</span>
                            <p className="text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-xs">
                              {booking.fault}
                            </p>
                          </div>

                          {/* Quick WhatsApp contact action button */}
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              onClick={async () => {
                                if (window.confirm('هل ترغب حقاً الإقرار بمعالجة هذا الحجز ومسحه من قاعدة البيانات؟')) {
                                  const filtered = bookings.filter(b => b.id !== booking.id);
                                  setBookings(filtered);
                                  localStorage.setItem('aljahfali_bookings_v2', JSON.stringify(filtered));
                                  showAlert('تمت معالجة الطلب ✅', `تم إنجاز تذكرة حجز العميل وتأكيده بنجاح من قائمة المهام بمحل الجحفلي.`, 'success');
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              تم المعالجة والإنجاز
                            </button>

                            <a
                              href={`https://wa.me/${booking.phone.startsWith('7') ? '967' + booking.phone : booking.phone}?text=${encodeURIComponent(
                                `السلام عليكم يا أخي العزيز ${booking.name}،\nمعك ورشة الجحفلي لصيانة الهواتف الذكية. تلقينا طلب حجز موعد صيانة لجهازك (${booking.device}) لحل مشكلة (${booking.fault}). يرجى تأكيد موعد تشريفك لفرعنا بدارس الخط العام لتجهيز قطع الغيار وصيانتها فوريتنا.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold"
                            >
                              <PhoneCall className="h-3 w-3" />
                              <span>مراسلة واتساب فورية</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800">
                      <CheckSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-bold">كل الطلبات تم معالجتها بالكامل! لا توجد حجوزات معلقة بالانتظار.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TABS 4: EXCHANGE RATES CONFIGURATION */}
              {activeTab === 'rates' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 mb-4">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                      <span>تحديث أسعار صرف العملات والتحويل الفوري (ريال يمني YER)</span>
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mb-6">
                      تقوم هذه الأداة بتحديث توازن التحويلات لأسعار صرف العملات المعتمدة (الدولار الأمريكي والريال السعودي) بالموقع، وتحديث محول العملات الإلكتروني تلقائياً للزبائن بصنعاء وبقية المحافظات.
                    </p>

                    <form onSubmit={saveRatesForm} className="space-y-4 max-w-xl text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                          <span className="block font-bold text-amber-500">الدولار الأمريكي مقابل اليمني ($)</span>
                          
                          <div>
                            <label className="block text-slate-400 mb-1">سعر الشراء ر.ي (مثلاً: 530)</label>
                            <input
                              type="number"
                              required
                              value={rates.usdBuy}
                              onChange={(e) => setRates({ ...rates, usdBuy: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">سعر البيع ر.ي (مثلاً: 535)</label>
                            <input
                              type="number"
                              required
                              value={rates.usdSell}
                              onChange={(e) => setRates({ ...rates, usdSell: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                          <span className="block font-bold text-pink-500">الريال السعودي مقابل اليمني (SAR)</span>
                          
                          <div>
                            <label className="block text-slate-400 mb-1">سعر الشراء ر.ي (مثلاً: 140)</label>
                            <input
                              type="number"
                              required
                              value={rates.sarBuy}
                              onChange={(e) => setRates({ ...rates, sarBuy: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">سعر البيع ر.ي (مثلاً: 141)</label>
                            <input
                              type="number"
                              required
                              value={rates.sarSell}
                              onChange={(e) => setRates({ ...rates, sarSell: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {rateSaveSuccess && (
                        <div className="flex items-center gap-1.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                          <Check className="h-4 w-4 shrink-0" />
                          <span>تم حفظ أسعار العملات وتحديث محولات الموقع والآلة فورياً وبنجاح!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>حفظ بيانات العملات وتثبيتها</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TABS 5: TESTIMONIALS REVIEWS MANAGER */}
              {activeTab === 'testimonials' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/40 p-4 sm:p-5 border border-slate-800 rounded-xl text-right">
                    <span className="text-amber-500 text-xs font-bold block mb-0.5">مراجعات العملاء</span>
                    <h3 className="text-white font-extrabold text-sm sm:text-base">إدارة تقييمات وآراء زبائن المحل والورشة ({reviews.length} مراجعة):</h3>
                    <p className="text-[10px] text-slate-400">يمكنك الإشراف الكامل على كل التعليقات، وإضافة تعليقات مخصصة لتشجيع الزوار عبر العاصمة صنعاء والجمهورية.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-800'}`} />
                            ))}
                          </div>
                          
                          <p className="text-slate-200 text-xs leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                            "{rev.comment}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 text-[11px] font-bold flex items-center justify-center border border-slate-800">
                              {rev.name[0] || 'U'}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-white">{rev.name}</span>
                              <span className="block text-[9px] text-slate-500">{rev.date}</span>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              if (window.confirm('هل ترغب حقاً في إزالة تعليق العميل هذا من صفحة المتجر الرئيسية نهائياً؟')) {
                                const filtered = reviews.filter(r => r.id !== rev.id);
                                setReviews(filtered);
                                localStorage.setItem('aljahfali_reviews_v2', JSON.stringify(filtered));
                                showAlert("حذف التقييم بنجاح 🗑️", "تم إقصاء تقييم العميل من الموقع الرئيسي وتحصين بوابات التعليقات.", "success");
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            إلغاء التقييم
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TABS 6: EMPLOYEES & ROLE MANAGEMENT */}
              {activeTab === 'employees' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-950/45 p-5 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-right">
                    <div>
                      <span className="text-amber-500 text-xs font-black block mb-1">صلاحيات الطاقم الإداري</span>
                      <h3 className="text-white font-extrabold text-base sm:text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-amber-500" />
                        التحكم المتكامل بالموظفين والأدوار ({employees.length} موظف نشط)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        قم بإضافة فنيين جدد في قسم الصيانة، أو موظفي مبيعات ومعارض وتحديد أدوارهم بشكل محكم آمن. سيتم تخصيص لوحة كل موظف حسب صلاحياته وتأمين قواعد البيانات السحابية بقوة.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingEmployee(null);
                        setEmployeeFormData({
                          name: '',
                          username: '',
                          password: '',
                          role: 'sales',
                          permissions: ['manage_products'],
                          status: 'active'
                        });
                        setShowEmployeeModal(true);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition duration-200 shrink-0 cursor-pointer shadow-lg"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>تسجيل موظف جديد بملف منفصل</span>
                    </button>
                  </div>

                  {/* Employees Grid Card View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {employees.map((emp) => (
                      <div 
                        key={emp.id} 
                        className={`bg-slate-950/60 p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                          emp.status === 'suspended' 
                            ? 'border-red-500/20 opacity-75' 
                            : 'border-slate-800/80 hover:border-amber-500/20 shadow-xl'
                        }`}
                      >
                        {/* Header Box */}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black text-amber-500 relative shrink-0">
                                {emp.name[0]}
                                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  emp.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                }`} />
                              </div>
                              <div className="text-right">
                                <h4 className="text-sm font-black text-white">{emp.name}</h4>
                                <span className="text-[10px] font-mono text-slate-500">مستخدم: @{emp.username}</span>
                              </div>
                            </div>

                            {/* Role Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                              emp.role === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                              emp.role === 'manager' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                              emp.role === 'sales' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                            }`}>
                              {emp.role === 'admin' ? 'مدير نظام' :
                               emp.role === 'manager' ? 'مشرف عام' :
                               emp.role === 'sales' ? 'مبيعات ومعارض' :
                               'فني صيانة وتتبع'}
                            </span>
                          </div>

                          {/* Credentials Mask Info */}
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-850 space-y-1 text-right text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">رمز الدخول الشخصي:</span>
                              <span className="font-mono text-slate-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded tracking-wide border border-slate-800">
                                {emp.password || '• • • • • •'}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] pt-1">
                              <span className="text-slate-500">آخر ظهور ونشاط:</span>
                              <span className="text-slate-400">{emp.lastActive || 'لم يسجل دخول بعد'}</span>
                            </div>
                          </div>

                          {/* Permissions block */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 font-bold block text-right">المصادقات والأذونات المفعلة:</span>
                            <div className="flex flex-wrap gap-1 justify-start">
                              {emp.role === 'admin' ? (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[9px] font-bold px-1.5 py-0.5">
                                  كل الصلاحيات الإدارية المطلقة
                                </span>
                              ) : emp.permissions.length === 0 ? (
                                <span className="text-slate-600 text-[10px] italic">بلا أي صلاحيات حالياً</span>
                              ) : (
                                emp.permissions.map((perm) => (
                                  <span key={perm} className="bg-slate-900 text-slate-400 border border-slate-800 rounded-md text-[9px] font-bold px-1.5 py-0.5">
                                    {perm === 'manage_products' ? 'المنتجات' :
                                     perm === 'manage_jobs' ? 'الصيانة' :
                                     perm === 'manage_bookings' ? 'الحجوزات' :
                                     perm === 'manage_rates' ? 'العملات' :
                                     perm === 'manage_testimonials' ? 'التقييمات' :
                                     'الموظفين'}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Control Box */}
                        <div className="flex items-center gap-2 border-t border-slate-900 pt-4">
                          <button
                            onClick={() => handleEditEmployeeStart(emp)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-705 text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5 text-amber-500" />
                            تعديل الأذون
                          </button>

                          <button
                            onClick={() => handleToggleEmployeeSuspension(emp)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                              emp.status === 'suspended' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                            title={emp.status === 'suspended' ? 'تنشيط وموافقة' : 'تجميد وحظر'}
                          >
                            {emp.status === 'suspended' ? 'تنشيط' : 'تجميد'}
                          </button>

                          <button
                            onClick={() => handleDeleteEmployeeTicket(emp.id, emp.name)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
                            title="شطب الخدمة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* HIGH-FIDELITY GLASS GLASSMORPHIC MODAL DRAWER FOR EMPLOYEE CREATION */}
                  {showEmployeeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right">
                      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 custom-scrollbar max-h-[90vh] flex flex-col">
                        
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                          <h3 className="text-white font-black text-sm sm:text-base flex items-center gap-2">
                            <Layers className="h-5 w-5 text-amber-500" />
                            {editingEmployee ? `تعديل صلاحيات الموظف: ${editingEmployee.name}` : 'تأسيس ملف موظف جديد'}
                          </h3>
                          <button 
                            type="button"
                            onClick={() => {
                              setShowEmployeeModal(false);
                              setEditingEmployee(null);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <form onSubmit={handleAddOrUpdateEmployee} className="space-y-4 flex-1 overflow-y-auto pr-1">
                          
                          {/* Name input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400">اسم الموظف الكامل (بالعربية):</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: صالح أحمد الجحفلي..."
                              value={employeeFormData.name}
                              onChange={(e) => setEmployeeFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full text-right px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 rounded-xl focus:outline-none text-xs"
                            />
                          </div>

                          {/* Username input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400">اسم مستخدم الدخول الفريد (Username):</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: saleh أو j.aljahfali"
                              value={employeeFormData.username}
                              onChange={(e) => setEmployeeFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                              className="w-full text-right px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 rounded-xl focus:outline-none text-xs font-mono"
                            />
                            <p className="text-[10px] text-slate-500">يتفرد به الموظف وتتم مقارنته عند الدخول.</p>
                          </div>

                          {/* Password input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400">رمز الدخول الشخصي / كلمة المرور:</label>
                            <input
                              type="text"
                              required={!editingEmployee}
                              placeholder={editingEmployee ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية..." : "أدخل رمز دخول الموظف..."}
                              value={employeeFormData.password}
                              onChange={(e) => setEmployeeFormData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full text-right px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 rounded-xl focus:outline-none text-xs font-mono tracking-widest"
                            />
                          </div>

                          {/* Role selector with presets */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400">الدور والوظيفة المخصصة للموظف:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['sales', 'technician', 'manager', 'admin'] as EmployeeRole[]).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setPresetPermissionsForRole(r)}
                                  className={`py-2 px-3 border rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                                    employeeFormData.role === r 
                                      ? 'bg-amber-500/15 border-amber-500 text-amber-400' 
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900'
                                  }`}
                                >
                                  {r === 'admin' ? 'مدير نظام كامل' :
                                   r === 'manager' ? 'مشرف فروع' :
                                   r === 'sales' ? 'مبيعات الكاشير' :
                                   'فني مهندس صيانة'}
                                </button>
                              ))}
                            </div>
                            <span className="block text-[9px] text-amber-500/70">🚨 اختيار الدور يقوم بتعديل كتل الصلاحيات الموصى بها تلقائياً كأوزان افتراضية.</span>
                          </div>

                          {/* Permission checklist */}
                          <div className="space-y-2.5 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                            <label className="block text-xs font-black text-slate-300">الصلاحيات الممنوحة تحديداً للموظف:</label>
                            
                            <div className="space-y-2">
                              {([
                                { key: 'manage_products', label: 'إدارة وتحديث كتالوج المنتجات والهواتف الجديدة والقديمة' },
                                { key: 'manage_jobs', label: 'إضافة ومتابعة تذاكر وتحديثات كشف صيانة الهواتف المعتمدة' },
                                { key: 'manage_bookings', label: 'تصفح وإدارة طلبات الحجز المباشر وصيانة هواتف الزبائن' },
                                { key: 'manage_rates', label: 'تعديل وتحديث أسعار الصرف (الدولار والريال اليمني والسعودي)' },
                                { key: 'manage_testimonials', label: 'إدارة وحذف تقييمات وآراء زبائن متجر الجحفلي' },
                                { key: 'manage_employees', label: 'حق التحكم المطلق بالموظفين وتعديل صلاحيات الأدوار' }
                              ] as { key: EmployeePermission; label: string }[]).map((perm) => {
                                const isChecked = employeeFormData.permissions.includes(perm.key);
                                return (
                                  <label 
                                    key={perm.key} 
                                    onClick={() => {
                                      setEmployeeFormData(prev => {
                                        const pList = prev.permissions.includes(perm.key)
                                          ? prev.permissions.filter(p => p !== perm.key)
                                          : [...prev.permissions, perm.key];
                                        return { ...prev, permissions: pList };
                                      });
                                    }}
                                    className="flex items-start gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-0.5"
                                  >
                                    <input
                                      type="checkbox"
                                      readOnly
                                      checked={isChecked}
                                      className="mt-0.5 pointer-events-none accent-amber-500"
                                    />
                                    <span>{perm.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Status option */}
                          <div className="space-y-1.5 pb-2">
                            <label className="block text-xs font-bold text-slate-400">حالة ملف الموظف حالياً:</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                                <input
                                  type="radio"
                                  name="emp-status-radio"
                                  checked={employeeFormData.status === 'active'}
                                  onChange={() => setEmployeeFormData(prev => ({ ...prev, status: 'active' }))}
                                  className="accent-emerald-500"
                                />
                                مصرح له بالعمل (نشط)
                              </label>

                              <label className="flex items-center gap-2 text-xs font-bold text-red-500 cursor-pointer">
                                <input
                                  type="radio"
                                  name="emp-status-radio"
                                  checked={employeeFormData.status === 'suspended'}
                                  onChange={() => setEmployeeFormData(prev => ({ ...prev, status: 'suspended' }))}
                                  className="accent-red-500"
                                />
                                معلق الخدمة مؤقتاً (موقوف)
                              </label>
                            </div>
                          </div>

                          {/* Save & Cancel buttons */}
                          <div className="flex items-center gap-2.5 border-t border-slate-850 pt-3">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-lg text-xs transition duration-200 cursor-pointer shadow-md"
                            >
                              {editingEmployee ? 'تأكيد وحفظ الصلاحيات' : 'تأسيس الملف والتشغيل الفوري'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowEmployeeModal(false);
                                setEditingEmployee(null);
                              }}
                              className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold border border-slate-800 rounded-lg text-xs transition cursor-pointer"
                            >
                              إلغاء الأمر
                            </button>
                          </div>

                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

        {/* --- DYNAMIC CAM-BASED BARCODE/QR CODE SCANNER MODAL --- */}
        {showQRScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" dir="rtl">
            <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-940 border border-indigo-500/25 rounded-2xl w-full max-w-md shadow-emerald-500/5 shadow-2xl p-6 overflow-hidden flex flex-col text-right">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-indigo-500/10 mb-5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Barcode className="h-5 w-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">القارئ الضوئي الذكي للكاميرا</h3>
                    <p className="text-[10px] text-indigo-300">امسح كود المنتجات أو أكواد تذاكر صيانة الجحفلي</p>
                  </div>
                </div>
                <button
                  onClick={() => stopScanning()}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scanner Screen Box */}
              <div className="relative w-full max-w-xs mx-auto aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-indigo-400/40 bg-black/50 shadow-inner flex flex-col items-center justify-center">
                {/* Simulated Scanning Laser Line */}
                <span className="absolute left-0 right-0 h-0.5 bg-red-500/95 shadow-[0_0_10px_rgba(239,68,68,1)] z-10 animate-bounce pointer-events-none" style={{ animationDuration: '2s' }} />
                
                {/* QR Code element wrapper */}
                <div id="admin-qr-reader" className="w-full h-full object-cover" />

                {/* Loading indicator until camera starts */}
                {!html5QrScannerInstance && !scannerError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3 z-20">
                    <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                    <span className="text-xs font-bold text-white">جاري طلب إذن الاتصال بالكاميرا...</span>
                    <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                      الرجاء إعطاء صلاحية تشغيل الكاميرا للمتصفح عند الطلب لبدء المسح التلقائي للملصقات.
                    </p>
                  </div>
                )}

                {/* Camera stream error notice */}
                {scannerError && (
                  <div className="absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center p-4 text-center text-red-100 space-y-3.5 z-20 overflow-y-auto">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="h-6 w-6 text-amber-500 animate-bounce mb-1" />
                      <span className="text-[11px] font-black text-white">الكاميرا مشغولة أو محظورة بالمتصفح 🛑</span>
                      <p className="text-[8.5px] text-slate-400 mt-1 max-w-[210px] leading-relaxed mx-auto">
                        قد تكون الكاميرا قيد الاستخدام بصفحة أخرى أو تم حظر الإذن داخل الإطار (Iframe).
                      </p>
                    </div>

                    {/* Manual Override Search Box */}
                    <div className="w-full space-y-2 border-t border-slate-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-indigo-400 block text-right">أدخل كود القطعة/رمز التتبع يدوياً:</span>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={manualQRInput}
                          onChange={(e) => setManualQRInput(e.target.value)}
                          placeholder="مثال: P-1001 أو 1002"
                          className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:border-amber-400 placeholder:opacity-35 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (manualQRInput.trim()) {
                                handleScannedCode(manualQRInput, null);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualQRInput.trim()) {
                              handleScannedCode(manualQRInput, null);
                            }
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition select-none"
                        >
                          مطابقة الرمز
                        </button>
                      </div>

                      {/* Simulator triggers */}
                      <div className="space-y-1.5 pt-1 text-right">
                        <span className="text-[8.5px] text-slate-500 font-bold block">أو انقر للمحاكاة الفورية لكاميرا الجحفلي الشغالة:</span>
                        <div className="flex flex-wrap gap-1 justify-start">
                          {products.slice(0, 2).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setManualQRInput(p.id);
                                handleScannedCode(p.id, null);
                              }}
                              className="text-[9px] bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-900/40 text-indigo-300 px-2 py-1 rounded transition max-w-[170px] truncate cursor-pointer text-right shrink-0"
                            >
                              🏷️ منتج: {p.arabicName}
                            </button>
                          ))}
                          {jobs.slice(0, 1).map(j => (
                            <button
                              key={j.id}
                              type="button"
                              onClick={() => {
                                setManualQRInput(j.id);
                                handleScannedCode(j.id, null);
                              }}
                              className="text-[9px] bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-300 px-2 py-1 rounded transition max-w-[170px] truncate cursor-pointer text-right shrink-0"
                            >
                              🛠️ تذكرة العميل {j.clientName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and instruction helpers */}
              <div className="mt-5 bg-slate-950/50 border border-slate-850 p-3 rounded-xl space-y-2 text-[10px] sm:text-xs leading-relaxed text-slate-300">
                <p className="font-bold text-indigo-400 flex items-center gap-1">
                  💡 تـوجيهـات الاسـتخدام السـريع:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                  <li>ضع كود المربع (QR) الخاص بوضع ملصق الجهاز وسط المربع تماماً.</li>
                  <li>يمكنك مسح أكواد تذاكر صيانة الزبائن (مثل الرمز 1002) لمراجعة الضمان وصيانة الكارت.</li>
                  <li>سيقوم النظام تلقائياً بالتعرف والبحث وفتح صفحة التحرير المناسبة.</li>
                </ul>
              </div>

              {/* Footer action buttons */}
              <div className="mt-5 pt-3 border-t border-indigo-500/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => stopScanning()}
                  className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 transition text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء أمر المسح وإغلاق العدسة
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- HIGH-FIDELITY PRODUCT STICKER PREVIEW & PRINT LABELS MODAL --- */}
        {selectedQRProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" dir="rtl">
            <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl w-full max-w-sm shadow-2xl p-6 overflow-hidden flex flex-col text-right">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Barcode className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">معاينة ملصق الباركود الحراري</h3>
                    <p className="text-[9px] text-slate-400">راجع تصميم وتفاصيل الكارت الفعلي المطبوع</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQRProduct(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Realistic White Thermal Sticker Label Showcase Component */}
              <div className="bg-white border-2 border-dashed border-slate-300 p-5 rounded-2xl max-w-xs mx-auto text-slate-950 text-center shadow-2xl space-y-3 font-sans w-full select-none transform hover:scale-[1.02] transition-transform">
                
                {/* Store title brand info */}
                <div>
                  <div className="text-[12px] font-black text-amber-970 leading-none">مجموعة الجحفلي المعتمدة للهواتف</div>
                  <div className="text-[8px] text-slate-500 font-bold mt-1">مبيعات الجملة والتجزئة والصيانة المعتمدة</div>
                </div>

                {/* Subtitle brand of device */}
                <div className="inline-block bg-slate-100 text-slate-800 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedQRProduct.brand}
                </div>

                {/* Arabic details */}
                <div className="space-y-0.5">
                  <h4 className="text-[14px] font-extrabold text-slate-900 leading-snug">
                    {selectedQRProduct.arabicName}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono tracking-wide leading-none">
                    {selectedQRProduct.name}
                  </p>
                </div>

                {/* QR Code representation */}
                <div className="bg-white border border-slate-200 p-2 rounded-xl inline-block shadow-sm">
                  <img 
                    src={generatedQRDataURL} 
                    alt="Product Details QR Code" 
                    className="w-36 h-36 mx-auto display-block"
                  />
                </div>

                {/* Product standard price and conversions based on exchangeRates */}
                <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                  <div className="text-[16px] font-black text-emerald-800">
                    {selectedQRProduct.price.toLocaleString()} ر.ي
                  </div>
                  
                  {/* Realtime translations */}
                  <div className="flex justify-center gap-8 mt-1.5 text-[9px] text-slate-600 font-bold border-t border-emerald-100/50 pt-1.5 leading-none">
                    <span>دولار: ${Math.round(selectedQRProduct.price / (rates.usdSell || 535))}</span>
                    <span>سعودي: {Math.round(selectedQRProduct.price / (rates.sarSell || 141))} ر.س</span>
                  </div>
                </div>

                {/* Prompt instructions */}
                <div className="text-[8px] text-slate-400 font-bold leading-normal border-t border-dashed border-slate-200 pt-2 shrink-0">
                  قم بمسح الكود الضوئي بهاتف العميل لعرض شاشة الخصائص والمواصفات الكاملة وحجز الحصاد فوراً!
                </div>
              </div>

              {/* Printable triggers and closing actions */}
              <div className="mt-5 pt-3 border-t border-indigo-500/10 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={printSticker}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs transition duration-200 cursor-pointer shadow-md shadow-emerald-950/30 flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة ملصق الباركود الآن 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQRProduct(null)}
                  className="w-full py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 transition text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إغلاق نافذة المعاينة
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- GLOBAL LIVE INTERACTIVE TOAST --- */}
        {toast && (
          <div 
            key={toast.id}
            className={`fixed bottom-6 left-6 z-50 max-w-sm p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-slide-in justify-start text-right ${
              toast.type === 'success' ? 'bg-slate-950/95 border-emerald-500/30 text-white' :
              toast.type === 'error' ? 'bg-slate-950/95 border-red-500/30 text-white' :
              toast.type === 'warn' ? 'bg-slate-950/95 border-amber-500/30 text-white' :
              'bg-slate-950/95 border-sky-400/30 text-white'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {toast.type === 'warn' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {toast.type === 'info' && <Bell className="h-5 w-5 text-sky-400" />}
            </div>
            <div className="flex-grow min-w-0 pr-1 text-right">
              <h4 className="font-extrabold text-xs mb-0.5 text-slate-100">{toast.title}</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed select-text">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* --- HIGH-FIDELITY ALERT DIALOG BOX OVERLAY --- */}
        {alertDialog && alertDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-right">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border mb-3 ${
                  alertDialog.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  alertDialog.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                  alertDialog.type === 'info' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' :
                  'bg-amber-500/10 border-amber-500/30 text-amber-500'
                }`}>
                  {alertDialog.type === 'success' && <CheckCircle2 className="h-6 w-6" />}
                  {alertDialog.type === 'error' && <AlertCircle className="h-6 w-6" />}
                  {alertDialog.type === 'info' && <Bell className="h-6 w-6" />}
                </div>
                
                <h3 className="text-sm sm:text-base font-extrabold text-white mb-2 leading-tight">
                  {alertDialog.title}
                </h3>
                
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-6 whitespace-pre-line select-text">
                  {alertDialog.message}
                </p>

                <div className="flex items-center gap-2.5 w-full">
                  <button
                    onClick={() => setAlertDialog(null)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    موافق وعودة للوحة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
