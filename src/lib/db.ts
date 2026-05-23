import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, getDocFromServer, getDocs, setDoc, deleteDoc, collection 
} from 'firebase/firestore';
import { Product, Testimonial, Employee } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TESTIMONIALS } from '../data';
import firebaseConfig from '../../firebase-applet-config.json';

// Define Firebase Error types as requested in the Firebase skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Check if Firebase is configured with real credentials or if it is still on placeholders
const isFirebaseReal = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('your-api-key') &&
  !firebaseConfig.projectId.includes('your-project-id');

let app;
let db: any = null;
let auth: any = null;

// Track firestore offline mode to provide beautiful UI statuses rather than harsh crashes
export let isFirestoreOffline = false;

if (isFirebaseReal) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("Firebase initialized successfully with real project:", firebaseConfig.projectId);
  } catch (error) {
    isFirestoreOffline = true;
    console.error("Firebase initialization failed; falling back to LocalStorage:", error);
  }
} else {
  isFirestoreOffline = true;
  console.log("Firebase is in placeholder mode; using LocalStorage fallback. Fill in firebase-applet-config.json to connect a live database.");
}

// Error Handler conformant with critical instructions
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to determine if a Firestore error is related to rules/permissions (which we must throw)
// or connection issues (which we bypass and fall back to cache gracefully)
export const isPermissionError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || String(error)).toLowerCase();
  const code = error.code || '';
  return code === 'permission-denied' || msg.includes('permission') || msg.includes('insufficient');
};

// Test Connection on boot if live as required by instruction: Connect validation with getFromServer
if (isFirebaseReal && db) {
  async function testConnection() {
    try {
      // Set a short timeout for diagnostic test
      await Promise.race([
        getDocFromServer(doc(db, 'test', 'connection')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      console.log("Firestore live connection confirmed");
      isFirestoreOffline = false;
    } catch (error) {
      isFirestoreOffline = true;
      if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('timeout') || error.message.includes('unavailable'))) {
        console.warn("Please check your Firebase configuration: Client is offline/timeout. App is running beautifully in offline LocalStorage fallback mode.");
      } else {
        console.warn("Firestore diagnostic check (can ignore if DB is uninitialized):", error);
      }
    }
  }
  // Run after a short delay to allow stable initial paint
  setTimeout(() => {
    testConnection();
  }, 1000);
}

// --- Dynamic Database Abstraction Layer supporting Local + Remote sync ---

// 1. PRODUCTS COLLECTION
export async function dbGetProducts(): Promise<Product[]> {
  const collectionName = 'products';
  if (isFirebaseReal && db) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const loaded: Product[] = [];
      snap.forEach((doc) => {
        loaded.push(doc.data() as Product);
      });
      if (loaded.length > 0) {
        // Cache to localStorage
        localStorage.setItem('aljahfali_products_v2', JSON.stringify(loaded));
        return loaded;
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore collection "${collectionName}" read failed (offline fallback active):`, error);
      }
    }
  }
  
  // Local storage fallback
  const local = localStorage.getItem('aljahfali_products_v2');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }
  return INITIAL_PRODUCTS;
}

export async function dbSaveProduct(product: Product): Promise<void> {
  const collectionName = 'products';
  // Always update local cache
  const products = await dbGetProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) {
    products[index] = product;
  } else {
    products.unshift(product);
  }
  localStorage.setItem('aljahfali_products_v2', JSON.stringify(products));

  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      await setDoc(doc(db, collectionName, product.id), product);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${product.id}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/${product.id}" (offline mode active):`, error);
      }
    }
  }
}

export async function dbDeleteProduct(productId: string): Promise<void> {
  const collectionName = 'products';
  // Update local cache
  const products = await dbGetProducts();
  const filtered = products.filter(p => p.id !== productId);
  localStorage.setItem('aljahfali_products_v2', JSON.stringify(filtered));

  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      await deleteDoc(doc(db, collectionName, productId));
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${productId}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore deleteDoc failed for "${collectionName}/${productId}" (offline mode active):`, error);
      }
    }
  }
}

// 2. TESTIMONIALS / REVIEWS COLLECTION
export async function dbGetTestimonials(): Promise<Testimonial[]> {
  const collectionName = 'testimonials';
  if (isFirebaseReal && db) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const loaded: Testimonial[] = [];
      snap.forEach((doc) => {
        loaded.push(doc.data() as Testimonial);
      });
      if (loaded.length > 0) {
        localStorage.setItem('aljahfali_reviews_v2', JSON.stringify(loaded));
        return loaded;
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore collection "${collectionName}" read failed (offline fallback active):`, error);
      }
    }
  }

  const local = localStorage.getItem('aljahfali_reviews_v2');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return INITIAL_TESTIMONIALS;
    }
  }
  return INITIAL_TESTIMONIALS;
}

export async function dbSaveTestimonial(testimonial: Testimonial): Promise<void> {
  const collectionName = 'testimonials';
  const reviews = await dbGetTestimonials();
  reviews.push(testimonial);
  localStorage.setItem('aljahfali_reviews_v2', JSON.stringify(reviews));

  if (isFirebaseReal && db) {
    try {
      await setDoc(doc(db, collectionName, testimonial.id), testimonial);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${testimonial.id}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/${testimonial.id}" (offline mode active):`, error);
      }
    }
  }
}

// 3. BOOKINGS COLLECTION
export async function dbGetBookings(): Promise<any[]> {
  const collectionName = 'bookings';
  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const loaded: any[] = [];
      snap.forEach((doc) => {
        loaded.push(doc.data());
      });
      localStorage.setItem('aljahfali_bookings_v2', JSON.stringify(loaded));
      return loaded;
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore collection "${collectionName}" read failed (offline fallback active):`, error);
      }
    }
  }
  
  const local = localStorage.getItem('aljahfali_bookings_v2');
  return local ? JSON.parse(local) : [];
}

export async function dbSaveBooking(booking: any): Promise<void> {
  const collectionName = 'bookings';
  const bookings = await dbGetBookings();
  bookings.push(booking);
  localStorage.setItem('aljahfali_bookings_v2', JSON.stringify(bookings));

  if (isFirebaseReal && db) {
    try {
      await setDoc(doc(db, collectionName, booking.id), booking);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${booking.id}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/${booking.id}" (offline mode active):`, error);
      }
    }
  }
}

// 4. MAINTENANCE REPAIR JOBS (For Customer Track Codes)
export async function dbGetJobs(): Promise<any[]> {
  const collectionName = 'jobs';
  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const loaded: any[] = [];
      snap.forEach((doc) => {
        loaded.push(doc.data());
      });
      localStorage.setItem('aljahfali_jobs_v2', JSON.stringify(loaded));
      return loaded;
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore collection "${collectionName}" read failed (offline fallback active):`, error);
      }
    }
  }

  // Pre-fill with default track codes so search actually works out-of-the-box
  const defaultJobs = [
    {
      id: '7818',
      device: 'Samsung Galaxy S23 Ultra (تيتانيوم)',
      fault: 'تبديل شاشة أصلية كاملة مع فريم وكالة',
      price: '55,000 ريال يمني',
      status: 'ready',
      engineer: 'م/ عادل الجحفلي',
      receivedDate: '2026-05-21',
      readyDate: 'اليوم (جاهز فوراً)',
    },
    {
      id: '1234',
      device: 'iPhone 14 Pro Max 256GB',
      fault: 'استبدال خلية بطارية أصلية مع برمجة النسبة لتصبح 100%',
      price: '18,500 ريال يمني',
      status: 'in-progress',
      engineer: 'م/ وضاح لبرمجيات آبل',
      receivedDate: '2026-05-22',
      readyDate: 'غداً مساءً 6:00 م',
    },
    {
      id: '5678',
      device: 'Xiaomi Note 13 Pro 5G',
      fault: 'صيانة وتأهيل بيت الشاحن وإصلاح عطل الشحن السريع',
      price: '9,000 ريال يمني',
      status: 'spare-parts',
      engineer: 'م/ فايز الصنعاني',
      receivedDate: '2026-05-20',
      readyDate: 'خلال 3 أيام (انتظار القطعة)',
    }
  ];

  const local = localStorage.getItem('aljahfali_jobs_v2');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return defaultJobs;
    }
  } else {
    localStorage.setItem('aljahfali_jobs_v2', JSON.stringify(defaultJobs));
    return defaultJobs;
  }
}

export async function dbGetJob(jobId: string): Promise<any | null> {
  const collectionName = 'jobs';
  if (isFirebaseReal && db) {
    try {
      const docRef = doc(db, collectionName, jobId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/${jobId}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore getDoc failed for "${collectionName}/${jobId}" (offline mode active):`, error);
      }
    }
  }

  // Fallback to local storage or defaults
  const jobs = await dbGetJobs();
  return jobs.find(j => String(j.id) === jobId) || null;
}

export async function dbSaveJob(job: any): Promise<void> {
  const collectionName = 'jobs';
  const jobs = await dbGetJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  if (index > -1) {
    jobs[index] = job;
  } else {
    jobs.push(job);
  }
  localStorage.setItem('aljahfali_jobs_v2', JSON.stringify(jobs));

  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      await setDoc(doc(db, collectionName, job.id), job);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${job.id}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/${job.id}" (offline mode active):`, error);
      }
    }
  }
}

export async function dbDeleteJob(jobId: string): Promise<void> {
  const collectionName = 'jobs';
  const jobs = await dbGetJobs();
  const filtered = jobs.filter(j => j.id !== jobId);
  localStorage.setItem('aljahfali_jobs_v2', JSON.stringify(filtered));

  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      await deleteDoc(doc(db, collectionName, jobId));
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${jobId}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore deleteDoc failed for "${collectionName}/${jobId}" (offline mode active):`, error);
      }
    }
  }
}

// 5. EXCHANGE RATES (YEMENI RIAL EXCHANGE CONVERSIONS - USD/SAR)
export async function dbGetExchangeRates(): Promise<{ usdBuy: number, sarBuy: number, usdSell: number, sarSell: number }> {
  const collectionName = 'settings';
  const defaultRates = { usdBuy: 530, sarBuy: 140, usdSell: 535, sarSell: 141 };
  
  if (isFirebaseReal && db) {
    try {
      const docSnap = await getDoc(doc(db, collectionName, 'exchange_rates'));
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        localStorage.setItem('aljahfali_rates_v2', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/exchange_rates`);
      } else {
        isFirestoreOffline = true;
        console.warn("Could not load exchange rates from Firestore (offline mode active):", error);
      }
    }
  }

  const local = localStorage.getItem('aljahfali_rates_v2');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return defaultRates;
    }
  }
  return defaultRates;
}

export async function dbSaveExchangeRates(rates: { usdBuy: number, sarBuy: number, usdSell: number, sarSell: number }): Promise<void> {
  const collectionName = 'settings';
  localStorage.setItem('aljahfali_rates_v2', JSON.stringify(rates));

  if (isFirebaseReal && db && auth?.currentUser) {
    try {
      await setDoc(doc(db, collectionName, 'exchange_rates'), rates);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/exchange_rates`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/exchange_rates" (offline mode active):`, error);
      }
    }
  }
}

// Export auth and db directly for advanced standard usage
export { db, auth, isFirebaseReal };

// --- 7. EMPLOYEES COLLECTION ---
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-jamal',
    name: 'جمال الجحفلي',
    username: 'admin',
    password: '781831833',
    role: 'admin',
    permissions: [
      'manage_products',
      'manage_jobs',
      'manage_bookings',
      'manage_rates',
      'manage_employees',
      'manage_testimonials'
    ],
    status: 'active'
  }
];

export async function dbGetEmployees(): Promise<Employee[]> {
  const collectionName = 'employees';
  if (isFirebaseReal && db) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const loaded: Employee[] = [];
      snap.forEach((doc) => {
        loaded.push(doc.data() as Employee);
      });
      if (loaded.length > 0) {
        localStorage.setItem('aljahfali_employees_v2', JSON.stringify(loaded));
        return loaded;
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore collection "${collectionName}" read failed (offline fallback active):`, error);
      }
    }
  }

  const local = localStorage.getItem('aljahfali_employees_v2');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return INITIAL_EMPLOYEES;
    }
  }
  return INITIAL_EMPLOYEES;
}

export async function dbSaveEmployee(employee: Employee): Promise<void> {
  const collectionName = 'employees';
  const employees = await dbGetEmployees();
  const existingIndex = employees.findIndex(e => e.id === employee.id);
  if (existingIndex > -1) {
    employees[existingIndex] = employee;
  } else {
    employees.push(employee);
  }
  localStorage.setItem('aljahfali_employees_v2', JSON.stringify(employees));

  if (isFirebaseReal && db) {
    try {
      await setDoc(doc(db, collectionName, employee.id), employee);
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${employee.id}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore setDoc failed for "${collectionName}/${employee.id}" (offline mode active):`, error);
      }
    }
  }
}

export async function dbDeleteEmployee(employeeId: string): Promise<void> {
  const collectionName = 'employees';
  const employees = await dbGetEmployees();
  const filtered = employees.filter(e => e.id !== employeeId);
  localStorage.setItem('aljahfali_employees_v2', JSON.stringify(filtered));

  if (isFirebaseReal && db) {
    try {
      await deleteDoc(doc(db, collectionName, employeeId));
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${employeeId}`);
      } else {
        isFirestoreOffline = true;
        console.warn(`Firestore deleteDoc failed for "${collectionName}/${employeeId}" (offline mode active):`, error);
      }
    }
  }
}
