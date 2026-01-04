import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Menu, MapPin, ChefHat, Bike, CheckCircle, 
  Flame, X, Settings, Navigation, Clock, 
  ShieldCheck, User, Lock, ChevronRight, 
  Search, Bell, Heart, Star, Plus, Edit2, 
  Save, Trash2, ArrowLeft, ArrowRight, Receipt, FileText,
  Home, Map as MapIcon, History, CreditCard, LogOut, LayoutGrid,
  Smartphone, Mail, Camera, Maximize2, Minimize2, Loader2,
  Crosshair, ShoppingBag, Utensils, Moon, Sun, CloudSun, Zap,
  RefreshCw, Phone, Check, Send, Award, KeyRound, AlertCircle,
  Sparkles
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken, GoogleAuthProvider, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, updateDoc, 
  addDoc, deleteDoc, onSnapshot, query, where, serverTimestamp, writeBatch 
} from 'firebase/firestore';

// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCEvFlggUAT_Yt2PXL1f6EXLA0XFgI9LXY",
  authDomain: "mixit-delights.firebaseapp.com",
  projectId: "mixit-delights",
  storageBucket: "mixit-delights.firebasestorage.app",
  messagingSenderId: "458504655084",
  appId: "1:458504655084:web:3ca48cffedb847cfee55c9",
  measurementId: "G-EW5EBWGSXZ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mixit-delights-main';

// --- 2. CONSTANTS & UTILS ---
const KITCHEN_LOCATION = { lat: 10.5105, lng: 7.4165, name: "Mixit HQ" }; 

// Brand Color Palette - VIBRANT ORANGE
const BRAND_COLOR = '#FF8A00'; // Primary Orange
const BRAND_COLOR_SOFT = '#FFB703'; // Soft/Yellow-Orange
const BRAND_COLOR_DEEP = '#E76F00'; // Deep Orange

const KADUNA_LOCATIONS = [
  "Barnawa, Kaduna South", "Malali G.R.A", "Ungwan Rimi", 
  "Kaduna Polytechnic (Main)", "Kaduna State University (KASU)",
  "Ungwan Dosa", "Kawo", "Sabon Tasha", "Narayi High Cost",
  "Independence Way", "Ahmadu Bello Way", "Constitution Road"
];

const CATEGORIES = [
  { id: 'all', name: 'All Drops', icon: '🔥' },
  { id: 'smoothie', name: 'Smoothies', icon: '🥤' }, 
  { id: 'burger', name: 'Stacks', icon: '🍔' },
  { id: 'spaghetti', name: 'Pastas', icon: '🍝' },
];

const PARTNERS = [
  { name: 'Glaze', type: 'Donuts', icon: '🍩' },
  { name: 'Crunch', type: 'Chicken', icon: '🍗' },
  { name: 'Salsa', type: 'Mexican', icon: '🌮' },
  { name: 'Frost', type: 'Dessert', icon: '🍦' },
];

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- 3. MAP HOOK ---
const useLeaflet = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && window.L.map) {
      setLoaded(true);
      return;
    }

    const scriptId = 'leaflet-script';
    const cssId = 'leaflet-css';

    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      const checkL = setInterval(() => {
         if (window.L && window.L.map) {
             clearInterval(checkL);
             setLoaded(true);
         }
      }, 100);
      return () => clearInterval(checkL);
    }
  }, []);
  return loaded;
};

// --- 4. COMPONENTS ---

const BlurCard = ({ children, className = "", isDark = true, intensity = "normal" }) => {
  const bg = isDark 
    ? (className.includes('bg-') ? '' : 'bg-white/[0.03]') 
    : (className.includes('bg-') ? '' : 'bg-white/60');
  
  const border = isDark ? 'border-white/10' : 'border-black/5';
  
  return (
    <div className={`${bg} ${border} backdrop-blur-xl border rounded-[2rem] shadow-sm ${className} overflow-hidden`}>
      {children}
    </div>
  );
};

const HoloHeader = ({ isDark }) => (
  <div className="absolute top-6 left-0 w-full z-[90] flex justify-center pointer-events-none">
    <div className="relative group">
       <div className="absolute -inset-4 rounded-full blur-2xl opacity-40 animate-pulse bg-[#FF8A00]/20"></div>
       <div className={`relative px-8 py-3 backdrop-blur-md rounded-full border shadow-2xl flex items-center gap-3 pointer-events-auto cursor-default transition-all ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/5'}`}>
         <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_15px_#FF8A00] bg-[#FF8A00]"></div>
         <span className={`font-black text-xl tracking-[0.25em] ${isDark ? 'text-white' : 'text-[#1C1C1E]'}`}>MIXIT</span>
       </div>
    </div>
  </div>
);

const LiquidNav = ({ currentView, setView, hasOrder, onProfile, isDark }) => (
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex justify-center pointer-events-none">
     <div className={`pointer-events-auto flex items-center gap-6 p-2 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#1A1A1A]/90 border-white/10' : 'bg-white/90 border-black/5'}`}>
        {['menu', 'tracking', 'profile'].map((tab) => {
          const isActive = (tab === 'profile' && ['profile', 'admin'].includes(currentView)) || currentView === tab;
          return (
            <button 
              key={tab}
              onClick={() => setView(tab === 'profile' ? 'profile' : tab)} 
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${isActive ? (isDark ? 'bg-white/10' : 'bg-black/5') : 'hover:scale-110'}`}
            >
               {isActive && <div className="absolute inset-0 rounded-full blur-md bg-[#FF8A00]/20"></div>}
               <div className={`relative z-10 transition-colors ${isActive ? 'text-[#FF8A00]' : (isDark ? 'text-white/40 group-hover:text-white' : 'text-black/40 group-hover:text-black')}`}>
                 {tab === 'menu' && <Home size={24} strokeWidth={isActive ? 3 : 2.5} />}
                 {tab === 'tracking' && <MapIcon size={24} strokeWidth={isActive ? 3 : 2.5} />}
                 {tab === 'profile' && <User size={24} strokeWidth={isActive ? 3 : 2.5} />}
               </div>
               {tab === 'tracking' && hasOrder && (
                 <span className="absolute top-3 right-3 flex h-2.5 w-2.5 z-20">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#FF8A00]"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 border border-black bg-[#FF8A00]"></span>
                 </span>
               )}
            </button>
          );
        })}
     </div>
  </div>
);

// --- ROBUST MAP COMPONENT ---
const RealMap = ({ status, destination, onLocationSelect }) => {
  const loaded = useLeaflet(); 
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const riderMarker = useRef(null);
  const destMarker = useRef(null);
  const polylineRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (loaded && mapRef.current && !mapInstance.current && window.L && window.L.map) {
      const L = window.L;
      try {
        const map = L.map(mapRef.current, { 
            zoomControl: false, 
            attributionControl: false,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true
        }).setView([KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
            subdomains: 'abcd', 
            maxZoom: 19 
        }).addTo(map);

        const createIcon = (emoji, bg, size=40) => L.divIcon({
            html: `<div style="background:${bg}; width:${size}px; height:${size}px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size:${size/1.8}px;">${emoji}</div>`,
            className: 'custom-map-icon', 
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });

        if (status !== 'selecting') {
             L.marker([KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng], { 
                icon: createIcon('🍳', '#FF3D00') 
            }).addTo(map);
        }
        
        riderMarker.current = L.marker([KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng], { 
            icon: createIcon('🛵', BRAND_COLOR, 48) 
        });
        destMarker.current = L.marker([0,0], { 
            icon: createIcon('📍', '#3A86FF') 
        });
        
        mapInstance.current = map;
        
        if (status === 'selecting') {
            map.locate({setView: true, maxZoom: 14});
            map.on('moveend', () => {
                const center = map.getCenter();
                if(onLocationSelect) onLocationSelect({ lat: center.lat, lng: center.lng });
            });
        }
      } catch (err) {
        console.error("Map Init Error:", err);
      }
    }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, [loaded, status]); 

  // Update Markers & Path
  useEffect(() => {
    if (!mapInstance.current || !destination) return;
    const L = window.L;
    
    const destLat = typeof destination === 'object' ? destination.lat : null;
    const destLng = typeof destination === 'object' ? destination.lng : null;
    
    if (destLat && destLng) {
        destMarker.current.setLatLng([destLat, destLng]).addTo(mapInstance.current);
        
        if (status !== 'selecting') {
           const bounds = L.latLngBounds([[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng], [destLat, destLng]]);
           mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
           
           if (polylineRef.current) polylineRef.current.remove();
           polylineRef.current = L.polyline([[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng], [destLat, destLng]], { 
               color: '#22d3ee', 
               weight: 4, 
               opacity: 0.6, 
               dashArray: '10, 10' 
           }).addTo(mapInstance.current);
        } else {
            mapInstance.current.setView([destLat, destLng], 15);
        }
    }
  }, [destination, status]);

  // Animation Logic
  useEffect(() => {
    if (!mapInstance.current || !riderMarker.current || !destination || status === 'selecting') return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const start = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };
    if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') return;
    const end = { lat: destination.lat, lng: destination.lng };
    
    if (status === 'preparing') {
         riderMarker.current.setLatLng([start.lat, start.lng]).addTo(mapInstance.current);
         return;
    }
    if (status === 'delivered') {
         riderMarker.current.setLatLng([end.lat, end.lng]).addTo(mapInstance.current);
         return;
    }

    const duration = 30000; 
    const startTime = Date.now();

    const animate = () => {
        const now = Date.now();
        const progress = ((now - startTime) % duration) / duration; 
        let effectiveProgress = progress;
        if (status === 'arriving') effectiveProgress = Math.min(1, progress + 0.5);
        
        const currentLat = start.lat + (end.lat - start.lat) * effectiveProgress;
        const currentLng = start.lng + (end.lng - start.lng) * effectiveProgress;
        
        riderMarker.current.setLatLng([currentLat, currentLng]).addTo(mapInstance.current);
        animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [status, destination]);

  return <div ref={mapRef} className="w-full h-full bg-[#1a1a1a] z-0" />;
};

// Re-Introducing PickerMap wrapper
const PickerMap = ({ onLocationSelect }) => {
    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <RealMap status="selecting" onLocationSelect={onLocationSelect} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none pb-8">
               <MapPin size={40} className="text-[#FF8A00] drop-shadow-lg fill-black/50" strokeWidth={2.5}/>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/10">
               Move map to pin location
            </div>
         </div>
    );
}

const StackVisualizer = ({ baseItems, addOns, color, type, isDark }) => (
  <div className="flex flex-col-reverse items-center gap-[-5px] w-48 transition-all pb-8 scale-90 md:scale-125 lg:scale-150">
    <div className={`w-32 h-10 rounded-b-2xl border-b-4 ${isDark ? 'border-black/30' : 'border-black/10'} shadow-2xl bg-gradient-to-r ${color} flex items-center justify-center z-0 relative`}>
      <span className="text-white/20 text-[8px] font-black uppercase">Base</span>
    </div>
    {baseItems.map((item, idx) => (
      <div key={`base-${idx}`} className={`w-34 h-8 rounded-lg shadow-sm border-l ${isDark ? 'border-white/10 bg-[#333]' : 'border-black/5 bg-gray-300'} flex items-center justify-center backdrop-blur-sm opacity-80`}
        style={{ zIndex: idx + 1, marginTop: -8, transform: `scale(0.95)` }}>
        <span className={`${isDark ? 'text-white/50' : 'text-black/50'} font-bold text-xs`}>{item.emoji}</span>
      </div>
    ))}
    {addOns.map((item, idx) => (
      <div key={item.uid} className="w-36 h-8 rounded-lg shadow-lg border-l border-white/20 flex items-center justify-center animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md"
        style={{ backgroundColor: item.color || '#7f1d1d', zIndex: idx + 10, marginTop: -10, transform: `rotate(${Math.random() * 4 - 2}deg)` }}>
        <span className="text-white font-bold text-xs drop-shadow">{item.emoji}</span>
      </div>
    ))}
    {type !== 'smoothie' && (
      <div className={`w-36 h-12 rounded-t-full shadow-2xl z-[100] bg-gradient-to-r ${color} mt-[-5px] flex items-end justify-center pb-2 border-t border-white/10`}>
        <div className="w-8 h-1 bg-white/20 rounded-full"></div>
      </div>
    )}
  </div>
);

// --- 5. MAIN APP ---

export default function VividAppV2() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [userHistory, setUserHistory] = useState([]); 
  const [view, setView] = useState('menu'); 
  const [adminMode, setAdminMode] = useState(false);
  const [theme, setTheme] = useState('dark'); 
  const [isLoading, setIsLoading] = useState(false); 
  const [authSuccess, setAuthSuccess] = useState(false); 
  const [profileLoading, setProfileLoading] = useState(true); 
  
  // Auth State
  const [authMode, setAuthMode] = useState('login'); 
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminTab, setAdminTab] = useState('orders'); 
  const [editingMenuItem, setEditingMenuItem] = useState(null); 
  const [showWelcomeToast, setShowWelcomeToast] = useState(false); // New Toast State
  const [profileTab, setProfileTab] = useState('stats'); 

  // Admin Dispatch State
  const [dispatchForm, setDispatchForm] = useState({ riderName: '', eta: '', riderPhone: '' });
  const [dispatchingOrderId, setDispatchingOrderId] = useState(null); // Track which order is being dispatched

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [activeOrder, setActiveOrder] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]); 
  
  // LOCATION STATE
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); 
  const [manualAddress, setManualAddress] = useState('');
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [category, setCategory] = useState('all');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [forceProfileSetup, setForceProfileSetup] = useState(false); 

  const debouncedSearchTerm = useDebounce(locationQuery, 800);
  const isDark = theme === 'dark';

  const themeClasses = {
    bg: isDark ? 'bg-[#0B0B0D]' : 'bg-[#F2F2F7]',
    text: isDark ? 'text-[#F5F5F5]' : 'text-[#1C1C1E]',
    textMuted: isDark ? 'text-white/40' : 'text-black/40',
    inputBg: isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black',
    accentText: 'text-[#FF8A00]',
    cardHover: isDark ? 'hover:bg-white/10' : 'hover:bg-black/5',
  };

  // Reward Calculation Logic
  const weeklyOrderCount = useMemo(() => {
    if (!userHistory.length) return 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return userHistory.filter(order => {
      const orderDate = new Date(order.createdAt?.seconds * 1000);
      return orderDate >= sevenDaysAgo;
    }).length;
  }, [userHistory]);

  const hasReward = weeklyOrderCount >= 10;

  // --- BRANDING ---
  // Set Dynamic Favicon
  useEffect(() => {
    document.title = "Mixit Delights";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>`;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!auth.currentUser) {
         try {
           if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
             await signInWithCustomToken(auth, __initial_auth_token);
           } else {
             await signInAnonymously(auth);
           }
         } catch(e) {
           try { await signInAnonymously(auth); } catch(err) { console.error(err); }
         }
      }
    };
    init();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setProfileLoading(true); 
      
      if (u) {
        const profileRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info');
        onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
             const data = docSnap.data();
             setUserProfile(data);
             setProfileForm({ name: data.name || '', email: data.email || '', phone: data.phone || '', password: '' });
          } else {
             if (u.displayName || u.email) {
                const startData = { name: u.displayName || '', email: u.email || '' };
                setProfileForm(prev => ({ ...prev, ...startData }));
                setDoc(profileRef, startData, { merge: true });
             }
             setUserProfile(null);
          }
          setProfileLoading(false);
        });

        const historyQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_orders'), where('userId', '==', u.uid));
        onSnapshot(historyQuery, (snap) => {
           const myOrders = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
           setUserHistory(myOrders);
           const active = myOrders.find(o => o.status !== 'delivered');
           if (active) setActiveOrder(active); else setActiveOrder(null);
        });
        
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_menu'), (snap) => {
          const items = snap.docs.map(d => ({id: d.id, ...d.data()}));
          if (items.length === 0) { setTimeout(() => { if(items.length === 0) seedDB(); }, 2000); }
          else setMenuItems(items);
        });
        
        onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_orders')), (snap) => {
          const allOrders = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setOrders(allOrders);
        });
      } else {
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { if (debouncedSearchTerm) searchPlaces(debouncedSearchTerm); else setSearchResults([]); }, [debouncedSearchTerm]);
  const searchPlaces = async (query) => { if (!query) return; setIsSearching(true); try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`); const data = await response.json(); setSearchResults(data); } catch (error) { console.error(error); } finally { setIsSearching(false); } };
  
  const getMyLocation = () => { 
    if (navigator.geolocation) { 
        setIsSearching(true); 
        navigator.geolocation.getCurrentPosition(async (position) => { 
            const { latitude, longitude } = position.coords; 
            try { 
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`); 
                const data = await response.json(); 
                const locationObj = { name: data.display_name?.split(',')[0] || "My Current Location", display_name: data.display_name, lat: latitude, lng: longitude }; 
                setSelectedLocation(locationObj); 
                setLocationQuery(locationObj.name); 
                setManualAddress(data.display_name); 
            } catch(e) { 
                const locationObj = { name: "Current GPS Location", lat: latitude, lng: longitude }; 
                setSelectedLocation(locationObj); 
                setLocationQuery("Current GPS Location"); 
            } 
            setIsSearching(false); 
        }, () => { alert("Could not access location."); setIsSearching(false); }); 
    } 
  };
  
  const seedDB = async () => { 
    const defaultMenu = [ { name: 'Cyber Berry', type: 'smoothie', price: 2500, desc: 'Antioxidant power blend.', color: 'from-fuchsia-600 to-purple-600', image: 'https://images.unsplash.com/photo-1623595619137-b44f248bb829?auto=format&fit=crop&w=800&q=80', baseIngredients: [{name: 'Almond Milk', emoji: '🥛'}, {name: 'Blueberries', emoji: '🫐'}], addOns: [{ name: 'Protein', price: 1000, color: '#e5e7eb', emoji: '💪' }] }, { name: 'Titan Stack', type: 'burger', price: 3500, desc: 'Heavyweight champion.', color: 'from-orange-500 to-red-600', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', baseIngredients: [{name: 'Angus Patty', emoji: '🥩'}, {name: 'Lettuce', emoji: '🥬'}], addOns: [{ name: 'Extra Beef', price: 1000, color: '#7f1d1d', emoji: '🥩' }, { name: 'Cheese', price: 500, color: '#fbbf24', emoji: '🧀' }] }, { name: 'JoJo Pasta', type: 'spaghetti', price: 3000, desc: 'Italian classic with a spicy kick.', color: 'from-red-600 to-rose-700', image: 'https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&w=800&q=80', baseIngredients: [{name: 'Spaghetti', emoji: '🍝'}, {name: 'Tomato Sauce', emoji: '🍅'}], addOns: [{ name: 'Meatballs', price: 1200, color: '#7f1d1d', emoji: '🧆' }] } ];
    const batch = writeBatch(db); for (const item of defaultMenu) { const docRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_menu')); batch.set(docRef, { ...item, inStock: true }); } await batch.commit();
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthSuccess(true);
      setTimeout(() => {
          setAuthSuccess(false);
          setForceProfileSetup(false);
          setView('profile'); 
      }, 2000);
    } catch (error) { 
      console.warn("Google Auth Popup failed", error); 
      alert("Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!profileForm.email) return alert("Please enter your email address first.");
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, profileForm.email);
        alert(`Password reset link sent to ${profileForm.email}`);
    } catch (e) {
        alert(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!profileForm.email || !profileForm.password) return alert("Please enter email and password");
    setIsLoading(true);
    try {
      if (authMode === 'signup') {
         // Create Account
         const cred = await createUserWithEmailAndPassword(auth, profileForm.email, profileForm.password);
         
         // Update Auth Profile
         if (profileForm.name) {
            await updateProfile(cred.user, { displayName: profileForm.name });
         }

         // Create Firestore Profile
         // OPTIMISTICALLY SET PROFILE so we don't wait for snapshot
         const newProfile = { 
            name: profileForm.name, 
            email: profileForm.email, 
            phone: profileForm.phone || '',
            joinedAt: serverTimestamp()
         };
         setUserProfile(newProfile); // <--- KEY FIX

         try {
            const ref = doc(db, 'artifacts', appId, 'users', cred.user.uid, 'profile', 'info');
            await setDoc(ref, newProfile, { merge: true });
         } catch (dbError) {
             console.error("Firestore Error:", dbError);
         }

         // SHOW SUCCESS STATE
         setAuthSuccess(true);
         
         // Redirect logic inside timeout
         setTimeout(() => {
           setAuthSuccess(false);
           setForceProfileSetup(false);
           setView('profile'); // <--- User requested Profile Dashboard
         }, 2000); 
      } else {
         // Login
         await signInWithEmailAndPassword(auth, profileForm.email, profileForm.password);
         setForceProfileSetup(false);
         setView('profile'); // DIRECT TO PROFILE
      }
    } catch (e) {
      // Improved Error Handling
      let msg = e.message;
      if (msg.includes("weak-password")) msg = "Password should be at least 6 characters.";
      if (msg.includes("email-already-in-use")) {
          msg = "This email is already registered. Switching to Login...";
          setAuthMode('login'); // AUTO-SWITCH
      }
      if (msg.includes("invalid-email")) msg = "Please enter a valid email address.";
      if (msg.includes("wrong-password")) msg = "Incorrect password.";
      if (msg.includes("user-not-found")) msg = "No account found with this email.";
      
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => { 
    await signOut(auth); 
    setProfileForm({ name: '', email: '', phone: '', password: '' }); 
    setUserProfile(null); 
    setView('menu'); // Back to menu
  };

  const handlePlaceOrder = async () => {
    if (!selectedLocation) { alert('Please select a delivery location'); return; }
    
    // NEW GATEKEEPER logic
    if (!user || user.isAnonymous || !userProfile?.name) { 
        setForceProfileSetup(true); 
        setView('profile'); 
        return; 
    }
    
    let total = cart.reduce((acc, i) => acc + i.price, selectedItem.price);
    // APPLY DISCOUNT if eligible
    if (hasReward) {
      total = Math.max(0, total - 2000); 
    }

    const newOrder = { userId: user.uid, customerName: userProfile.name, items: cart, itemName: selectedItem.name, location: selectedLocation, manualAddress: manualAddress, total, status: 'received', createdAt: serverTimestamp() };
    
    const isAlreadySaved = userProfile?.savedLocations?.some(l => l.name === selectedLocation.name);
    if (userProfile && !isAlreadySaved) {
       const newLocs = [...(userProfile.savedLocations || []), selectedLocation];
       await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info'), { savedLocations: newLocs });
    }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_orders'), newOrder);
    setView('tracking'); setCart([]); setSelectedLocation(null); setLocationQuery(''); setManualAddress('');
  };

  const formatPhoneNumber = (number) => { let clean = number.replace(/\D/g, ''); if (clean.startsWith('0')) clean = '+234' + clean.substring(1); if (!clean.startsWith('+') && clean.length === 13 && clean.startsWith('234')) clean = '+' + clean; return clean; };
  
  const handleSaveProfile = async () => { 
     if(!profileForm.name) return;
     setIsLoading(true);
     try {
       const formattedPhone = formatPhoneNumber(profileForm.phone);
       const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
       await setDoc(ref, { ...profileForm, phone: formattedPhone, photo: user.photoURL || null, savedLocations: userProfile?.savedLocations || [] }, { merge: true });
       setIsEditingProfile(false); 
       setForceProfileSetup(false); 
       setAuthSuccess(true); // SHOW SUCCESS
       setTimeout(() => {
          setAuthSuccess(false);
          if (cart.length > 0) setView('location'); 
          else setView('menu');
       }, 2000);
     } catch (e) {
       console.error("Error saving profile", e);
       alert("Failed to save profile.");
     } finally {
       setIsLoading(false);
     }
  };

  const handleMapLocationSelect = async (coords) => {
    setSelectedLocation({ ...coords, name: "Loading..." });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
      const data = await response.json();
      const name = data.display_name?.split(',')[0] || "Pinned Location";
      setSelectedLocation({ ...coords, name, display_name: data.display_name });
      setLocationQuery(name);
      setManualAddress(data.display_name || ""); // AUTO-FILL on map drag end
    } catch (e) {
      setSelectedLocation({ ...coords, name: "Pinned Location" });
    }
  };

  // ADMIN - CONFIRM DISPATCH LOGIC
  const handleConfirmDispatch = async () => {
    if(!dispatchForm.riderName || !dispatchForm.eta) return alert("Please fill in Rider Name and ETA");
    if(!dispatchingOrderId) return;
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_orders', dispatchingOrderId), { 
        status: 'dispatch', 
        riderName: dispatchForm.riderName, 
        riderPhone: dispatchForm.riderPhone, 
        eta: dispatchForm.eta 
    });
    setDispatchingOrderId(null); // Close form
    setDispatchForm({ riderName: '', eta: '', riderPhone: '' }); // Reset form
  };

  const updateStatus = async (oid, status) => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_orders', oid), { status }); };
  const deleteMenuItem = async (id) => { if(confirm("Delete item?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_menu', id)); setEditingMenuItem(null); } };
  const saveMenuItem = async (item) => { try { const data = { name: item.name, price: parseInt(item.price), desc: item.desc, type: item.type, color: item.color, image: item.image || null, inStock: item.inStock !== false, baseIngredients: item.baseIngredients || [{name: 'Base', emoji: '📦'}], addOns: item.addOns || [] }; if (item.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_menu', item.id), data); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vivid_v2_menu'), data); setEditingMenuItem(null); } catch (e) { console.error(e); } };

  // --- RENDERERS ---
  const renderMenu = () => {
    let displayItems = [];
    if (category === 'all') {
      const smoothies = menuItems.filter(i => i.type === 'smoothie');
      const burgers = menuItems.filter(i => i.type === 'burger');
      const others = menuItems.filter(i => i.type !== 'smoothie' && i.type !== 'burger');
      displayItems = [ { title: 'Elixirs', items: smoothies, isHero: true }, { title: 'Stacks', items: burgers }, { title: 'More', items: others } ];
    } else { displayItems = [{ title: 'Drops', items: menuItems.filter(i => i.type === category) }]; }

    return (
      <div className={`p-6 pt-32 pb-32 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full no-scrollbar max-w-7xl mx-auto w-full`}>
        {/* HERO: Orange -> Gold -> Black (Deep Sunset) */}
        <div className={`rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl group`}>
            {/* Dynamic Background with Noise/Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br from-[#FF8A00] via-[#E76F00] to-black z-0`}></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 mix-blend-overlay"></div>

            {/* Abstract Shapes */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-black/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                  <div>
                      <div className={`flex items-center gap-2 mb-1 text-white/90 text-xs font-bold uppercase tracking-[0.2em]`}><CloudSun size={14} className="text-yellow-300"/> Kaduna • 32°C</div>
                      <h2 className={`text-4xl md:text-5xl font-black leading-none text-white tracking-tight drop-shadow-sm`}>
                        TIME TO <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">FEAST, {userProfile?.name?.split(' ')[0] || 'Friend.'}</span>
                      </h2>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg animate-pulse">
                      <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                  </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center gap-4">
                <div className={`px-5 py-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  OPEN UNTIL 10PM
                </div>
            </div>
        </div>

        {/* Categories Rail */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           {CATEGORIES.map(cat => (
             <button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${category === cat.id ? `bg-[#FF8A00] text-white shadow-lg shadow-[#FF8A00]/30` : (isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white text-black/50 border border-black/5 hover:bg-gray-50')}`}>
                <span>{cat.icon}</span>{cat.name}
             </button>
           ))}
        </div>
        {menuItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50"><Loader2 size={40} className={`animate-spin text-[#FF8A00] mb-4`} /><p className={`${themeClasses.textMuted} text-sm mb-4`}>Mixing up the menu...</p><button onClick={seedDB} className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-[#FF8A00] hover:bg-white/20 transition-colors">Force Menu Refresh</button></div>
        ) : (
          displayItems.map((section, secIdx) => (
            section.items.length > 0 && (
              <div key={secIdx}>
                <h3 className={`text-xl font-black mb-4 pl-2 ${themeClasses.text}`}>{section.title}</h3>
                <div className={`grid ${section.isHero ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
                  {section.items.map((item) => (
                    <BlurCard key={item.id} isDark={isDark} className={`relative overflow-hidden group active:scale-95 hover:scale-[1.02] transition-all duration-300 min-h-[260px] flex flex-col justify-between p-5 ${!item.inStock ? 'opacity-50 grayscale' : ''}`}>
                      <button onClick={() => { if(item.inStock !== false){ setSelectedItem(item); setCart([]); setView('builder'); } }} className="w-full text-left h-full flex flex-col justify-between">
                        {item.image && (
                          <div className="absolute inset-0 z-0">
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 blur-sm" />
                             <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#0B0B0D] via-[#0B0B0D]/50 to-transparent' : 'from-[#F2F2F7] via-[#F2F2F7]/50 to-transparent'}`} />
                          </div>
                        )}
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-lg group-hover:rotate-12 transition-transform`}>
                              {item.type === 'smoothie' ? '🥤' : '🍔'}
                            </div>
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'}`}><ArrowRight size={14} className={isDark ? 'text-white' : 'text-black'}/></div>
                          </div>
                          <h4 className={`${themeClasses.text} font-bold text-xl leading-tight mb-2 drop-shadow-md`}>{item.name}</h4>
                          <p className={`${themeClasses.textMuted} text-xs line-clamp-2`}>{item.desc}</p>
                        </div>
                        <div className="relative z-10 flex justify-between items-center pt-4 border-t border-dashed border-white/10">
                          <span className={`text-[#FF8A00] font-bold text-lg`}>₦{item.price}</span>
                          {item.inStock !== false ? <span className={`text-[10px] font-bold px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/60'}`}>ADD +</span> : <span className="text-[10px] text-[#FF3D00] font-bold uppercase">Sold Out</span>}
                        </div>
                      </button>
                    </BlurCard>
                  ))}
                </div>
              </div>
            )
          ))
        )}
        <div className="mt-8 mb-2"><h3 className={`${themeClasses.textMuted} text-xs font-bold uppercase mb-4 tracking-widest pl-2`}>Mixit Fam</h3><div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">{PARTNERS.map((partner, idx) => (<div key={idx} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-transform hover:scale-105 cursor-pointer min-w-[140px] opacity-70 hover:opacity-100 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}><div className="text-2xl">{partner.icon}</div><div><div className={`text-sm font-bold ${themeClasses.text}`}>{partner.name}</div><div className={`text-[10px] uppercase font-bold tracking-wider ${themeClasses.textMuted}`}>{partner.type}</div></div></div>))}</div></div>
        
        {/* WEEKLY DROP: Massive Typography */}
        {category === 'all' && (
           <div className="mt-8 mb-24 relative group cursor-pointer" onClick={() => { 
                 const item = menuItems.find(i => i.name === 'Cyber Berry');
                 if(item) { setSelectedItem(item); setCart([]); setView('builder'); }
             }}>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#FF8A00] rounded-[2.5rem] rotate-1 group-hover:rotate-2 transition-transform opacity-40 blur-xl"></div> 
              <div className={`relative w-full h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-black`}>
                  <img 
                    src="https://images.unsplash.com/photo-1623595619137-b44f248bb829?auto=format&fit=crop&w=800&q=80" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                    alt="Cyber Berry"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 w-full p-8">
                     <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF8A00] text-white text-[10px] font-black uppercase tracking-widest border border-orange-400/50 shadow-[0_0_20px_rgba(255,138,0,0.6)]">
                        <Star size={12} className="fill-white" /> Limited Drop
                     </div>
                     <h3 className="text-6xl font-black text-white leading-[0.85] tracking-tighter mb-4 italic">
                        CYBER<br/>BERRY
                     </h3>
                     <div className="flex justify-between items-end">
                        <p className="text-white/70 text-sm max-w-[200px] leading-relaxed">The ultimate antioxidant power blend. Mixed with neon dreams.</p>
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowRight size={28} className="text-black -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        )}
      </div>
    );
  };
  const renderBuilder = () => { if (!selectedItem) return null; const total = cart.reduce((acc, i) => acc + i.price, selectedItem.price); return ( <div className={`h-full flex flex-col md:flex-row ${isDark ? 'bg-[#0B0B0D]' : 'bg-[#F2F2F7]'}`}> <div className={`flex-1 relative flex items-center justify-center overflow-hidden h-[50%] md:h-full bg-gradient-to-b ${isDark ? 'from-[#0B0B0D] to-black' : 'from-[#F2F2F7] to-white'}`}> <div className="absolute top-6 left-6 z-50 flex items-center gap-4"> <button onClick={() => setView('menu')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white text-black hover:bg-gray-50'}`}><X size={20} /></button> </div> {selectedItem.image ? ( <img src={selectedItem.image} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 z-0" /> ) : ( <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tr ${selectedItem.color} blur-[120px] opacity-30 z-0`}></div> )} <div className="scale-125 z-10 transition-all"><StackVisualizer baseItems={selectedItem.baseIngredients || []} addOns={cart} color={selectedItem.color} type={selectedItem.type} isDark={isDark} /></div> </div> <BlurCard isDark={isDark} className={`h-[50%] md:h-full md:w-[450px] rounded-t-[3rem] md:rounded-none md:rounded-l-[3rem] p-10 border-b-0 md:border-l flex flex-col z-20 shadow-2xl`}> <div className="mb-6"> <div className="flex justify-between items-start mb-2"> <h3 className={`${themeClasses.text} font-black text-3xl md:text-4xl`}>{selectedItem.name}</h3> <div className={`px-5 py-2 rounded-xl border backdrop-blur ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}><span className={`text-[#FF8A00] font-black text-xl`}>₦{total}</span></div> </div> <p className={`${themeClasses.textMuted} text-sm mb-4`}>{selectedItem.desc}</p> <div className={`flex gap-2 text-xs p-4 rounded-2xl inline-flex w-full ${isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'}`}><span className={`font-bold opacity-100 mr-2 text-[#FF8A00]`}>Base:</span>{selectedItem.baseIngredients?.map(b => b.name).join(', ')}</div> </div> <div className="flex-1 overflow-y-auto no-scrollbar"> <h4 className={`${themeClasses.textMuted} text-xs uppercase font-bold mb-4 tracking-widest`}>Add-ons</h4> <div className="grid grid-cols-3 gap-3 pb-6"> {selectedItem.addOns?.map((ing, i) => ( <button key={i} onClick={() => setCart([...cart, {...ing, uid: Math.random()}])} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all group active:scale-95 ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-black/5 hover:bg-gray-50 shadow-sm'}`}> <div className="text-3xl group-hover:scale-110 transition-transform">{ing.emoji}</div> <div className="text-center"><div className={`${themeClasses.text} text-xs font-bold leading-tight px-1`}>{ing.name}</div><div className={`text-[#FF8A00] text-[10px] font-mono mt-1`}>+₦{ing.price}</div></div> </button> ))} </div> </div> <button onClick={() => setView('location')} className={`w-full mt-4 bg-[#FF8A00] text-white font-bold py-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(255,138,0,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(255,138,0,0.6)] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 text-lg`}>Find Location <ArrowRight size={22} strokeWidth={3} /></button> </BlurCard> </div> ); };
  const renderLocation = () => { return ( <div className={`h-full p-6 flex flex-col max-w-4xl mx-auto w-full ${themeClasses.bg}`}> <div className="flex items-center gap-4 mb-8 pt-8 md:pt-16"> <button onClick={() => setView('builder')} className={`p-3 rounded-2xl ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white text-black hover:bg-gray-50 border border-black/5'}`}><ArrowLeft size={20}/></button> <h2 className={`text-2xl md:text-3xl font-black ${themeClasses.text}`}>Where to?</h2> </div> <div className="h-[400px] mb-6"> <PickerMap onLocationSelect={handleMapLocationSelect} /> </div> <div className="relative mb-6"> <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-40" size={20} color={isDark ? 'white' : 'black'} /> <input autoFocus type="text" placeholder="Search streets, areas..." value={locationQuery} onChange={e => { setLocationQuery(e.target.value); if(selectedLocation && selectedLocation.name !== e.target.value) setSelectedLocation(null); }} className={`w-full rounded-2xl py-5 pl-14 pr-14 text-lg font-medium outline-none transition-all border-2 ${isDark ? `bg-white/5 border-transparent focus:border-[#FF8A00] text-white placeholder-white/30` : `bg-white border-transparent focus:border-[#FF8A00] text-black shadow-sm`}`}/> <button onClick={getMyLocation} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#3A86FF] hover:bg-[#3A86FF]/10 transition-colors" title="Use my current location"><Crosshair size={22} /></button> </div> <div className="mb-4"> <label className={`text-xs ml-4 mb-2 block uppercase font-bold tracking-widest ${themeClasses.textMuted}`}>Address Details</label> <textarea value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="Apartment No, Bus Stop, Instructions..." className={`w-full rounded-2xl p-5 text-sm font-medium outline-none transition-all border-2 resize-none h-24 ${isDark ? `bg-white/5 border-transparent focus:border-[#FF8A00] text-white placeholder-white/30` : `bg-white border-transparent focus:border-[#FF8A00] text-black shadow-sm`}`}/> </div> <div className="pt-4 mt-auto"> <button disabled={!selectedLocation} onClick={handlePlaceOrder} className={`w-full py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${selectedLocation ? `bg-[#FF8A00] text-white shadow-[0_10px_30px_-5px_rgba(255,138,0,0.5)] hover:scale-[1.02]` : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'}`}>Confirm Order <CheckCircle size={24} /></button> </div> </div> ); };
  const renderTracking = () => { /* Same as before */
    const status = activeOrder?.status || 'received';
    const hasActiveOrder = activeOrder && activeOrder.status !== 'delivered';
    return (
      <div className={`h-full flex flex-col relative overflow-hidden ${themeClasses.bg}`}>
         <div className="absolute inset-0 z-0 h-full w-full"><RealMap status={status} destination={activeOrder?.location} /></div>
         {!hasActiveOrder && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 bg-[#0B0B0D] rounded-[3rem] border border-white/10 shadow-2xl max-w-xs">
                <div className={`w-20 h-20 bg-[#FF8A00]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#FF8A00]`}><Bike size={40} /></div>
                <h3 className="text-white font-black text-2xl mb-2">No Active Drops</h3>
                <p className="text-white/40 text-sm">Your order history is empty right now. Head to the menu to cop something.</p>
                <button onClick={() => setView('menu')} className="mt-6 bg-white text-black font-bold py-3 px-8 rounded-full pointer-events-auto hover:bg-gray-200 transition-colors">Go to Menu</button>
              </div>
            </div>
         )}
         {hasActiveOrder && (
             <div className="absolute bottom-32 left-[5%] md:left-1/2 md:-translate-x-1/2 w-[90%] md:max-w-md p-6 z-20">
                 {/* TRACKING CARD */}
                 <BlurCard isDark={true} className="p-6 bg-[#111]/90 border-white/10 animate-in slide-in-from-bottom-10 shadow-2xl">
                     <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8A00] to-[#E76F00] p-[2px] shadow-lg`}><div className="w-full h-full rounded-2xl bg-black flex items-center justify-center text-2xl">{status === 'preparing' ? '🍳' : '🛵'}</div></div>
                        <div>
                            {status === 'preparing' ? (
                                <>
                                    <h3 className="text-white font-bold text-lg">Chef is cooking...</h3>
                                    <p className="text-white/40 text-xs">Your meal is being prepared with love.</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-white font-bold text-lg">{activeOrder.riderName || 'Assigning Rider...'}</h3>
                                    <p className="text-white/40 text-xs">Mixit Dispatch • {activeOrder.eta ? `${activeOrder.eta} mins away` : 'Calculating...'}</p>
                                </>
                            )}
                        </div>
                        {status === 'dispatch' && activeOrder.riderPhone && (
                            <div className="ml-auto flex gap-2">
                                <a href={`tel:${activeOrder.riderPhone}`} className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shadow-green-500/30"><Phone size={18} /></a>
                            </div>
                        )}
                     </div>
                     
                     <div className="space-y-2">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                             <span className={`text-[#FF8A00]`}>{status === 'preparing' ? 'Cooking' : status === 'dispatch' ? 'On The Way' : 'Received'}</span>
                             <span className="text-white/30">{status === 'dispatch' && activeOrder.eta ? `${activeOrder.eta} MINS` : '...'}</span>
                         </div>
                         <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                             <div className={`h-full bg-[#FF8A00] transition-all duration-1000 shadow-[0_0_10px_${BRAND_COLOR}]`} style={{ width: status === 'received' ? '20%' : status === 'preparing' ? '50%' : status === 'dispatch' ? '80%' : '100%' }}></div>
                         </div>
                     </div>
                 </BlurCard>
             </div>
         )}
      </div>
    );
  };
  const renderAdmin = () => { /* Same as before */
    if (editingMenuItem) {
      return (
        <div className={`h-full p-6 pt-24 pb-32 flex flex-col items-center animate-in fade-in ${themeClasses.bg}`}>
           {/* ... Admin Edit Form (Same logic) ... */}
           {/* Simplified for response length, fully functional in prev version */}
           <div className="max-w-lg w-full">
             <button onClick={() => setEditingMenuItem(null)} className="mb-4 text-sm font-bold">← Back</button>
             <h2 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>Edit Item</h2>
             <div className="space-y-4">
                <input type="text" value={editingMenuItem.name} onChange={e => setEditingMenuItem({...editingMenuItem, name: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] border ${themeClasses.inputBg}`} placeholder="Name"/>
                <input type="number" value={editingMenuItem.price} onChange={e => setEditingMenuItem({...editingMenuItem, price: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] border ${themeClasses.inputBg}`} placeholder="Price"/>
                <textarea value={editingMenuItem.desc} onChange={e => setEditingMenuItem({...editingMenuItem, desc: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] h-24 border ${themeClasses.inputBg}`} placeholder="Desc"/>
                
                {/* NEW: IMAGE URL INPUT */}
                <div><label className={`text-xs ml-2 ${themeClasses.textMuted}`}>Image URL</label><input type="text" value={editingMenuItem.image || ''} onChange={e => setEditingMenuItem({...editingMenuItem, image: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] border ${themeClasses.inputBg}`} placeholder="https://..."/></div>

                <div className="grid grid-cols-2 gap-4">
                   <div><label className={`text-xs ml-2 ${themeClasses.textMuted}`}>Type</label><select value={editingMenuItem.type} onChange={e => setEditingMenuItem({...editingMenuItem, type: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] appearance-none border ${themeClasses.inputBg}`}><option value="burger">Burger</option><option value="smoothie">Smoothie</option><option value="spaghetti">Spaghetti</option><option value="other">Other</option></select></div>
                   <div><label className={`text-xs ml-2 ${themeClasses.textMuted}`}>Color Gradient</label><select value={editingMenuItem.color} onChange={e => setEditingMenuItem({...editingMenuItem, color: e.target.value})} className={`w-full rounded-xl p-4 outline-none focus:border-[${BRAND_COLOR}] appearance-none border ${themeClasses.inputBg}`}><option value="from-orange-500 to-red-600">Orange/Red</option><option value="from-fuchsia-600 to-purple-600">Fuchsia/Purple</option><option value="from-red-600 to-rose-700">Red/Rose</option><option value="from-blue-500 to-cyan-400">Blue/Cyan</option><option value="from-emerald-500 to-green-600">Emerald/Green</option></select></div>
                </div>

                {/* ADD-ONS EDITOR */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5'}`}>
                   <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold uppercase ${themeClasses.textMuted}`}>Add-ons</span>
                      <button onClick={() => setEditingMenuItem({...editingMenuItem, addOns: [...(editingMenuItem.addOns || []), {name: 'New', price: 0, emoji: '➕'}]})} className={`text-xs text-[${BRAND_COLOR}] font-bold`}>+ Add</button>
                   </div>
                   <div className="space-y-2">
                      {editingMenuItem.addOns?.map((addon, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                           <input type="text" value={addon.emoji} onChange={e => { const newAddons = [...editingMenuItem.addOns]; newAddons[idx].emoji = e.target.value; setEditingMenuItem({...editingMenuItem, addOns: newAddons}); }} className={`w-10 rounded-lg p-2 text-center border ${themeClasses.inputBg}`}/>
                           <input type="text" value={addon.name} onChange={e => { const newAddons = [...editingMenuItem.addOns]; newAddons[idx].name = e.target.value; setEditingMenuItem({...editingMenuItem, addOns: newAddons}); }} className={`flex-1 rounded-lg p-2 border ${themeClasses.inputBg}`}/>
                           <input type="number" value={addon.price} onChange={e => { const newAddons = [...editingMenuItem.addOns]; newAddons[idx].price = parseInt(e.target.value); setEditingMenuItem({...editingMenuItem, addOns: newAddons}); }} className={`w-20 rounded-lg p-2 border ${themeClasses.inputBg}`}/>
                           <button onClick={() => { const newAddons = editingMenuItem.addOns.filter((_, i) => i !== idx); setEditingMenuItem({...editingMenuItem, addOns: newAddons}); }} className="text-red-500"><X size={16}/></button>
                        </div>
                      ))}
                   </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                   <span className={themeClasses.text}>In Stock?</span>
                   <button onClick={() => setEditingMenuItem({...editingMenuItem, inStock: !editingMenuItem.inStock})} className={`w-12 h-6 rounded-full relative transition-colors ${editingMenuItem.inStock !== false ? 'bg-[#2ECC71]' : 'bg-[#FF3D00]/50'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingMenuItem.inStock !== false ? 'right-1' : 'left-1'}`}></div></button>
                </div>
             </div>

             <div className="mt-8 flex gap-4">
                {editingMenuItem.id && (
                  <button onClick={() => deleteMenuItem(editingMenuItem.id)} className="flex-1 bg-[#FF3D00]/20 text-[#FF3D00] font-bold py-4 rounded-xl hover:bg-[#FF3D00]/40">Delete</button>
                )}
                <button onClick={() => saveMenuItem(editingMenuItem)} className="flex-[2] bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200">Save Changes</button>
             </div>
           </div>
        </div>
      );
    }
    return (
      <div className={`h-full p-6 pt-24 pb-32 flex flex-col items-center ${themeClasses.bg}`}>
         <div className="w-full max-w-4xl flex justify-between items-center mb-8">
            <div><h2 className={`text-2xl font-bold ${themeClasses.text}`}>Admin OS</h2><p className="text-[#2ECC71] text-xs font-mono">● ONLINE</p></div>
            <div className={`flex rounded-lg p-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
               <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${adminTab === 'orders' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Orders</button>
               <button onClick={() => setAdminTab('menu')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${adminTab === 'menu' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Menu</button>
            </div>
            <div className="flex gap-2">
               <button onClick={seedDB} className={`p-2 rounded-lg text-xs transition-colors bg-transparent border border-transparent ${isDark ? 'hover:bg-white/10 text-[#3A86FF]' : 'hover:bg-black/5 text-[#3A86FF]'}`} title="Reset/Seed Menu"><RefreshCw size={14}/></button>
               <button onClick={() => { setAdminMode(false); setView('profile'); }} className="p-2 rounded-lg text-xs hover:bg-[#FF3D00]/20 hover:text-[#FF3D00] transition-colors ml-4 bg-transparent border border-transparent">EXIT</button>
            </div>
         </div>
         {adminTab === 'orders' ? (
           <div className="w-full max-w-4xl flex-1 overflow-y-auto space-y-4 no-scrollbar">
             {orders.map(order => (
                <div key={order.id} className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5'}`}>
                   <div>
                     <div className="flex justify-between mb-2"><span className={`text-[${BRAND_COLOR}] font-mono`}>#{order.id.slice(0,4)}</span><span className="text-xs uppercase font-bold text-gray-500">{order.status}</span></div>
                     <div className={`font-bold text-sm mb-1 ${themeClasses.text}`}>{order.itemName} + {order.items.length} addons</div>
                     <div className={`text-xs mb-1 flex items-center gap-1 ${themeClasses.textMuted}`}><MapPin size={10}/> {typeof order.location === 'string' ? order.location : order.location?.name}</div>
                     {order.manualAddress && <div className={`text-xs mb-3 italic ${themeClasses.textMuted}`}>Note: {order.manualAddress}</div>}
                   </div>
                   {/* ADMIN DISPATCH FORM LOGIC */}
                   {order.status === 'preparing' && (
                     <div className="mt-3 bg-white/5 p-3 rounded-lg border border-white/5 animate-in slide-in-from-top-2">
                        <div className="text-xs uppercase font-bold text-white/40 mb-2">Assign Dispatch Rider</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                           <input 
                              type="text" 
                              placeholder="Rider Name" 
                              className="bg-black/20 text-white text-xs p-2 rounded flex-1 outline-none border border-white/10"
                              value={dispatchingOrderId === order.id ? dispatchForm.riderName : ''}
                              onChange={(e) => { 
                                  if(dispatchingOrderId !== order.id) {
                                      setDispatchingOrderId(order.id);
                                      setDispatchForm({...dispatchForm, riderName: e.target.value});
                                  } else {
                                      setDispatchForm({...dispatchForm, riderName: e.target.value});
                                  }
                              }}
                           />
                           <input 
                              type="number" 
                              placeholder="ETA (mins)" 
                              className="bg-black/20 text-white text-xs p-2 rounded flex-1 outline-none border border-white/10"
                              value={dispatchingOrderId === order.id ? dispatchForm.eta : ''}
                              onChange={(e) => {
                                  if(dispatchingOrderId !== order.id) {
                                      setDispatchingOrderId(order.id);
                                      setDispatchForm({...dispatchForm, eta: e.target.value});
                                  } else {
                                      setDispatchForm({...dispatchForm, eta: e.target.value});
                                  }
                              }}
                           />
                           <input 
                              type="tel" 
                              placeholder="Rider Phone" 
                              className="bg-black/20 text-white text-xs p-2 rounded col-span-2 outline-none border border-white/10"
                              value={dispatchingOrderId === order.id ? dispatchForm.riderPhone : ''}
                              onChange={(e) => {
                                  if(dispatchingOrderId !== order.id) {
                                      setDispatchingOrderId(order.id);
                                      setDispatchForm({...dispatchForm, riderPhone: e.target.value});
                                  } else {
                                      setDispatchForm({...dispatchForm, riderPhone: e.target.value});
                                  }
                              }}
                           />
                        </div>
                        <button 
                           onClick={handleConfirmDispatch} 
                           className={`w-full ${dispatchForm.riderName && dispatchForm.eta ? `bg-[${BRAND_COLOR}] hover:bg-[#E76F00]` : 'bg-gray-700 cursor-not-allowed'} text-white text-xs font-bold py-2 rounded transition-colors`}
                        >
                           CONFIRM & DISPATCH
                        </button>
                     </div>
                   )}
                   
                   {/* Normal Action Buttons */}
                   {order.status !== 'preparing' && (
                       <div className="flex gap-2 mt-2">
                          <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-[#FF3D00] hover:bg-orange-600 px-3 py-2 rounded text-xs font-bold flex-1 transition-colors text-white">Cook</button>
                          {/* Dispatch is handled by form above for 'preparing' state, but we keep this for 'received' state direct jump or 'dispatch' state management */}
                          {order.status === 'dispatch' && (
                             <button disabled className="bg-gray-600 px-3 py-2 rounded text-xs font-bold flex-1 text-white opacity-50">Dispatched</button>
                          )}
                          <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-[#2ECC71] hover:bg-green-500 px-3 py-2 rounded text-xs font-bold flex-1 transition-colors text-black">Done</button>
                       </div>
                   )}
                </div>
             ))}
           </div>
         ) : (
           <div className="w-full max-w-4xl flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
                 <button onClick={() => setEditingMenuItem({ name: '', price: '', desc: '', type: 'burger', color: 'from-orange-500 to-red-600', inStock: true })} className={`border border-dashed rounded-xl flex flex-col items-center justify-center min-h-[150px] transition-colors ${isDark ? 'border-white/20 hover:bg-white/5' : 'border-black/20 hover:bg-black/5'}`}>
                    <Plus size={32} className="opacity-30 mb-2"/>
                    <span className="opacity-50 text-xs font-bold uppercase">Add Item</span>
                 </button>
                 {menuItems.map(item => (
                   <button key={item.id} onClick={() => setEditingMenuItem(item)} className={`p-4 rounded-xl text-left border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-black/5 hover:bg-gray-50'}`}>
                      {item.image && <img src={item.image} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />}
                      <div className="relative z-10">
                        <div className={`font-bold text-sm ${themeClasses.text}`}>{item.name}</div>
                        <div className={`text-[${BRAND_COLOR}] text-xs`}>₦{item.price}</div>
                        {item.inStock === false && <span className="text-[10px] text-[#FF3D00] border border-[#FF3D00]/30 px-1 rounded mt-2 inline-block bg-black/50">OUT OF STOCK</span>}
                      </div>
                   </button>
                 ))}
              </div>
           </div>
         )}
      </div>
    );
  };

  const renderProfile = () => {
    // Only show profile content if user is logged in AND has profile data set up (and not forced to setup)
    const showProfileContent = user && userProfile?.name && !forceProfileSetup && !user.isAnonymous;

    if (!showProfileContent) {
      if (authSuccess) {
        return (
          <div className={`h-full p-6 pt-24 flex flex-col justify-center items-center animate-in fade-in zoom-in ${themeClasses.bg}`}>
             <div className="w-24 h-24 rounded-full bg-[#2ECC71] flex items-center justify-center mb-6 shadow-2xl shadow-green-500/50">
               <Check size={48} className="text-black" strokeWidth={4} />
             </div>
             <h2 className={`text-3xl font-black ${themeClasses.text} text-center`}>Success!</h2>
             <p className={`${themeClasses.textMuted} text-center mt-2`}>Your Mixit account is ready.</p>
          </div>
        );
      }

      return (
        <div className={`h-full p-6 pt-24 flex flex-col animate-in fade-in items-center ${themeClasses.bg}`}>
           {showWelcomeToast && (
             <div className="absolute top-24 z-50 bg-[#2ECC71] text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10">
               <Check size={20} className="text-black"/> 
               <span>Welcome to the Mixit Family! 💜</span>
             </div>
           )}

           <div className="max-w-md w-full">
             <div className="text-center mb-10">
               <div className={`w-20 h-20 bg-gradient-to-tr from-[#FF8A00] to-[#E76F00] rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl`}><User size={40} className="text-white"/></div>
               <h2 className={`text-3xl font-black ${themeClasses.text}`}>Welcome to Mixit</h2>
               <p className={`${themeClasses.textMuted}`}>{forceProfileSetup ? "Finish setup to get your food!" : "Create your creative profile."}</p>
             </div>
             
             {/* Toggle Auth Mode */}
             <div className="flex bg-white/10 p-1 rounded-xl mb-6">
                <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white text-black' : 'text-white/50'}`}>Login</button>
                <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-white text-black' : 'text-white/50'}`}>Sign Up</button>
             </div>
             
             <div className="space-y-4">
               {authMode === 'signup' && (
                   <div className={`rounded-2xl p-1 border focus-within:border-[#FF8A00] transition-colors ${themeClasses.inputBg} ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <div className="px-4 py-1 text-[10px] opacity-50 uppercase font-bold tracking-wider mt-1">Full Name</div>
                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="bg-transparent w-full outline-none px-4 pb-3 font-medium" />
                   </div>
               )}
               <div className={`rounded-2xl p-1 border focus-within:border-[#FF8A00] transition-colors ${themeClasses.inputBg} ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="px-4 py-1 text-[10px] opacity-50 uppercase font-bold tracking-wider mt-1">Email Address</div>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="bg-transparent w-full outline-none px-4 pb-3 font-medium" />
               </div>
               <div className={`rounded-2xl p-1 border focus-within:border-[#FF8A00] transition-colors ${themeClasses.inputBg} ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="px-4 py-1 text-[10px] opacity-50 uppercase font-bold tracking-wider mt-1">Password</div>
                    <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} className="bg-transparent w-full outline-none px-4 pb-3 font-medium" />
               </div>
               {authMode === 'signup' && (
                  <div className={`rounded-2xl p-1 border focus-within:border-[#FF8A00] transition-colors ${themeClasses.inputBg} ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <div className="px-4 py-1 text-[10px] opacity-50 uppercase font-bold tracking-wider mt-1">Phone (Optional)</div>
                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="bg-transparent w-full outline-none px-4 pb-3 font-medium" />
                  </div>
               )}
             </div>
             
             {/* FORGOT PASSWORD LINK - Only in Login mode */}
             {authMode === 'login' && (
                <div className="flex justify-end mt-2">
                   <button onClick={handleForgotPassword} className={`text-xs ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>Forgot Password?</button>
                </div>
             )}
             
             <div className="mt-8">
               <button 
                 onClick={handleEmailAuth} 
                 disabled={isLoading}
                 className={`w-full bg-[#FF8A00] text-white font-bold py-5 rounded-2xl hover:bg-[#E76F00] transition-all shadow-lg shadow-[#FF8A00]/20 flex justify-center items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {isLoading ? (
                   <> <Loader2 className="animate-spin" /> {authMode === 'signup' ? 'Creating Account...' : 'Signing In...'} </>
                 ) : (
                   <> {authMode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight size={20} /> </>
                 )}
               </button>
             </div>

             <div className="mt-6 flex justify-center flex-col items-center">
                <div className="flex items-center gap-4 w-full mb-4"><div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div><span className={`${themeClasses.textMuted} text-xs uppercase tracking-widest`}>Or Google</span><div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div></div>
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={isLoading}
                  className={`w-full py-3 rounded-full flex items-center justify-center gap-3 font-medium transition-all bg-white text-gray-700 hover:bg-gray-100 shadow-md border border-gray-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                   {isLoading ? <Loader2 className="animate-spin text-gray-500" size={20}/> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5"/>}
                   <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
             </div>
             
             {/* If user is "Guest" but forcing profile setup (e.g. they clicked "Order"), allow them to go back to browsing */}
             {forceProfileSetup && (
               <button onClick={() => { setForceProfileSetup(false); setView('builder'); }} className={`w-full mt-6 text-sm ${themeClasses.textMuted} hover:text-[#FF8A00]`}>
                 ← Back to Order
               </button>
             )}
           </div>
        </div>
      );
    }
    // LOGGED IN VIEW
    return (
      <div className={`h-full p-6 pt-24 pb-32 flex flex-col animate-in fade-in overflow-y-auto no-scrollbar items-center ${themeClasses.bg}`}>
         <div className="w-full max-w-5xl">
             <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-[#FF8A00] to-[#E76F00] p-1 shadow-2xl shadow-[#FF8A00]/30 rotate-3`}>
                    {userProfile?.photo ? <img src={userProfile.photo} alt="Profile" className="w-full h-full rounded-[1.8rem] object-cover bg-black" /> : <div className="w-full h-full rounded-[1.8rem] bg-black flex items-center justify-center text-5xl font-black text-white">{userProfile?.name?.charAt(0) || 'U'}</div>}
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className={`text-4xl font-black mb-1 ${themeClasses.text}`}>{userProfile?.name || 'Guest User'}</h2>
                  <p className={`${themeClasses.textMuted} mb-4`}>{userProfile?.email}</p>
                  <div className="flex justify-center md:justify-start gap-3">
                    <button onClick={() => setForceProfileSetup(true)} className={`px-6 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-black/10 hover:bg-gray-50 shadow-sm'}`}><Edit2 size={16}/> Edit</button>
                    <button onClick={handleLogout} className={`px-6 py-3 rounded-xl border text-[#FF3D00] text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#FF3D00]/10' : 'bg-white border-black/10 hover:bg-[#FF3D00]/5 shadow-sm'}`}><LogOut size={16}/> Logout</button>
                  </div>
                </div>
             </div>

             {/* VIVID REWARDS CARD */}
             <div className={`mb-8 p-6 rounded-[2rem] border relative overflow-hidden ${hasReward ? 'bg-gradient-to-r from-[#2ECC71]/20 to-[#2ECC71]/5 border-[#2ECC71]/30' : (isDark ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm')}`}>
                 <div className="flex justify-between items-center relative z-10">
                    <div>
                       <div className="text-xs font-bold uppercase tracking-widest text-[#FF8A00] mb-1">Vivid Rewards Club</div>
                       <h3 className={`text-2xl font-black ${themeClasses.text}`}>{weeklyOrderCount}/10 Orders this week</h3>
                       <p className={`${themeClasses.textMuted} text-sm mt-1`}>{hasReward ? "You've unlocked a ₦2,000 discount!" : "Order more to unlock rewards."}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${hasReward ? 'bg-[#2ECC71] text-black shadow-lg shadow-green-500/50' : 'bg-white/10 text-white/20'}`}>
                       <Award size={32} />
                    </div>
                 </div>
                 {/* Progress Bar */}
                 <div className="mt-6 h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF8A00] transition-all duration-1000" style={{ width: `${Math.min(100, (weeklyOrderCount/10)*100)}%` }}></div>
                 </div>
             </div>
             
             {/* TABS */}
             <div className="flex gap-4 mb-6">
                <button onClick={() => setProfileTab('stats')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${profileTab === 'stats' ? `bg-[#FF8A00] text-white shadow-lg` : (isDark ? 'bg-white/5 text-white/50' : 'bg-white text-black/50 border border-black/5')}`}>Stats</button>
                <button onClick={() => setProfileTab('receipts')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${profileTab === 'receipts' ? `bg-[#FF8A00] text-white shadow-lg` : (isDark ? 'bg-white/5 text-white/50' : 'bg-white text-black/50 border border-black/5')}`}>Transactions</button>
             </div>

             {/* CONTENT based on Tab */}
             {profileTab === 'stats' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-6 rounded-[2rem] border flex flex-col justify-center ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                     <div className="text-4xl font-black mb-1 text-[#FF8A00]">{userHistory.length}</div>
                     <div className={`${themeClasses.textMuted} text-xs uppercase font-bold tracking-wider`}>Total Orders</div>
                  </div>
                  <div className={`p-6 rounded-[2rem] border flex flex-col justify-center ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                     <div className={`text-4xl font-black mb-1 ${themeClasses.text}`}>₦{userHistory.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</div>
                     <div className={`${themeClasses.textMuted} text-xs uppercase font-bold tracking-wider`}>Total Spent</div>
                  </div>
                </div>
             ) : (
                <div className={`rounded-[2.5rem] p-6 min-h-[300px] ${isDark ? 'bg-[#1A1A1A]' : 'bg-white shadow-xl'}`}>
                   <div className="space-y-4">
                      {userHistory.map(order => (
                        <div key={order.id} className={`flex items-center justify-between p-4 rounded-2xl transition-colors border ${isDark ? 'bg-black/40 border-white/5 hover:bg-black/60' : 'bg-gray-50 border-black/5 hover:bg-gray-100'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#FF8A00]/10 text-[#FF8A00]`}><Receipt size={18}/></div>
                              <div><div className={`${themeClasses.text} font-bold text-sm`}>{order.itemName}</div><div className={`${themeClasses.textMuted} text-xs`}>{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</div></div>
                           </div>
                           <div className={`${themeClasses.text} font-mono font-bold`}>₦{order.total}</div>
                        </div>
                      ))}
                      {userHistory.length === 0 && <div className="text-center py-10 opacity-30">No transactions found.</div>}
                   </div>
                </div>
             )}
             
             <div className="mt-16 mb-8 text-center">
                <button onClick={() => setShowAdminPin(!showAdminPin)} className="text-xs font-bold opacity-30 hover:opacity-100 tracking-[0.3em]">STAFF ACCESS</button>
                {showAdminPin && (
                  <div className="flex justify-center gap-2 mt-4 animate-in slide-in-from-bottom-2">
                    <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="••••" className={`rounded-xl px-4 py-2 outline-none w-32 text-center text-lg tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`} maxLength={4} />
                    <button onClick={() => { if(adminPin === '2001') { setAdminMode(true); setView('admin'); setAdminPin(''); setShowAdminPin(false); } }} className={`bg-[#FF8A00] rounded-xl px-6 font-bold text-white shadow-lg`}>GO</button>
                  </div>
                )}
             </div>
         </div>
      </div>
    );
  };

  // Persistent Elements Logic
  const hasActiveOrder = activeOrder && activeOrder.status !== 'delivered';
  const showNav = ['menu', 'tracking', 'profile', 'admin'].includes(view) && !editingMenuItem;
  const showHeader = ['menu', 'tracking', 'profile', 'admin'].includes(view) && !editingMenuItem;

  return (
    <div className={`${themeClasses.bg} font-sans ${themeClasses.text} min-h-[100dvh] w-full flex justify-center transition-colors duration-500`}>
      <div className={`w-full h-[100dvh] relative ${themeClasses.bg} shadow-2xl flex flex-col overflow-hidden transition-colors duration-500`}>
        
        {/* Persistent Toggle */}
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className={`absolute top-6 right-6 z-[100] p-2 rounded-full backdrop-blur-md border transition-all ${isDark ? 'bg-white/10 border-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/5 border-black/10 text-orange-500 hover:bg-black/10'}`}>
           <IsDarkToggleIcon isDark={isDark} />
        </button>

        <div className={`absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b ${isDark ? `from-[${BRAND_COLOR}]/5 via-[#0B0B0D] to-[#0B0B0D]` : `from-[${BRAND_COLOR}]/10 via-[#F2F2F7] to-[#F2F2F7]`} pointer-events-none z-0`}></div>
        {showHeader && <HoloHeader isDark={isDark} />}
        
        <div className="relative z-10 flex-1 h-full flex flex-col">
           {view === 'menu' && renderMenu()}
           {view === 'builder' && renderBuilder()}
           {view === 'location' && renderLocation()}
           {view === 'tracking' && renderTracking()}
           {view === 'profile' && renderProfile()}
           {view === 'admin' && renderAdmin()}
        </div>

        {showNav && <LiquidNav currentView={view} setView={setView} hasOrder={hasActiveOrder} onProfile={() => setView('profile')} isDark={isDark} />}
      </div>
    </div>
  );
}

const IsDarkToggleIcon = ({isDark}) => isDark ? <Sun size={20} /> : <Moon size={20} />;