import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { MapPin, Phone, Navigation, Plus, Activity, Clock, Trash2, Edit2, Search, Filter, Pill, CalendarClock, AlertTriangle, CloudCheck, X, ShieldCheck, LayoutDashboard, Map, Settings, Users, LogOut, FileText } from 'lucide-react';

// FİREBASE YAPILANDIRMASI
const firebaseConfig = {
  apiKey: "AIzaSyCqUSoowo2EbKKhG0SBcIzBYddwYOzHKRo",
  authDomain: "egitim-yonetim-platformu.firebaseapp.com",
  projectId: "egitim-yonetim-platformu",
  storageBucket: "egitim-yonetim-platformu.firebasestorage.app",
  messagingSenderId: "548967060709",
  appId: "1:548967060709:web:18d27afcb6ec387734700c",
  measurementId: "G-JSYQ1QPZ2Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const gaziantepIlceleri = ["Şahinbey", "Şehitkamil", "Oğuzeli", "Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Yavuzeli"];

export default function App() {
  const [user, setUser] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin'); 

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error(e));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'eczaneler'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPharmacies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Activity className="w-12 h-12 animate-spin text-teal-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {activeTab === 'citizen' ? (
        <div className="w-full">
           {/* Üst Bilgi Barı */}
          <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
             <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white p-2 rounded-lg"><Activity className="w-6 h-6" /></div>
                <h1 className="font-bold text-xl">E-90 <span className="text-red-600">Nöbetçi</span></h1>
             </div>
             <button onClick={() => setActiveTab('admin')} className="text-sm font-bold flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg">
               <ShieldCheck className="w-4 h-4" /> Yönetici Girişi
             </button>
          </div>
          <div className="p-8 max-w-6xl mx-auto"><CitizenView pharmacies={pharmacies} /></div>
        </div>
      ) : (
        <AdminLayout pharmacies={pharmacies} db={db} setTab={setActiveTab} />
      )}
    </div>
  );
}

// ==========================================
// YÖNETİM PANELİ (Profesyonel OdaPanel Görünümü)
// ==========================================
function AdminLayout({ pharmacies, db, setTab }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-100">
      
      {/* SOL KARANLIK SIDEBAR */}
      <div className="w-72 bg-[#0f172a] text-slate-300 flex flex-col justify-between shadow-2xl z-20">
        <div>
          {/* Logo Alanı */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-teal-500 text-white p-2 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">OdaPanel</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Gaziantep Eczacı Odası</p>
            </div>
          </div>

          {/* Menü Linkleri */}
          <nav className="p-4 space-y-1">
            <SidebarItem icon={Map} text="Nöbet Planlama" active={activeMenu === 'map'} onClick={() => setActiveMenu('map')} />
            <SidebarItem icon={LayoutDashboard} text="Eczane Listesi" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} />
            <SidebarItem icon={FileText} text="Raporlar / İstatistik" active={activeMenu === 'reports'} onClick={() => setActiveMenu('reports')} />
            <SidebarItem icon={Settings} text="Sistem Ayarları" active={activeMenu === 'settings'} onClick={() => setActiveMenu('settings')} />
          </nav>
        </div>

        {/* Alt Kullanıcı Alanı */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">Y</div>
            <div>
              <p className="text-white font-semibold text-sm">Yönetici Hesabı</p>
              <p className="text-xs text-slate-400">Oda Sekreteryası</p>
            </div>
          </div>
          <button onClick={() => setTab('citizen')} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition text-sm">
            <LogOut className="w-4 h-4" /> Vatandaş Ekranına Dön
          </button>
        </div>
      </div>

      {/* SAĞ ANA İÇERİK ALANI */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Üst Bar */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {activeMenu === 'dashboard' ? 'Eczane Yönetimi' : activeMenu === 'map' ? 'Haritalı Nöbet Planlama' : 'Sistem'}
          </h2>
          <div className="flex items-center gap-4">
             <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
             </span>
             <span className="text-sm font-semibold text-slate-600">Sistem Çevrimiçi</span>
          </div>
        </header>

        {/* İçerik Değişimi */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeMenu === 'dashboard' && <AdminDashboard pharmacies={pharmacies} db={db} />}
          {activeMenu === 'map' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Map className="w-24 h-24 mb-4 opacity-20" />
              <h3 className="text-2xl font-bold text-slate-700">Harita Modülü Hazırlanıyor</h3>
              <p>Google Maps / Leaflet entegrasyonu buraya gelecek.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sidebar Buton Bileşeni
function SidebarItem({ icon: Icon, text, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      <span className="font-medium text-sm">{text}</span>
    </button>
  );
}


// (ÖNCEKİ MESAJDAKİ TABLO VE ANALİZ KARTLARI BURADA AYNEN DURUYOR - SADELEŞTİRİLMİŞ ÇAĞRI)
function AdminDashboard({ pharmacies, db }) {
  // Özet İstatistikler
  const stats = useMemo(() => ({ total: pharmacies.length, duty: pharmacies.filter(p => p.isDuty).length }), [pharmacies]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <Pill className="w-12 h-12 text-slate-400 bg-slate-50 p-2 rounded-xl" />
           <div><p className="text-sm text-slate-500 font-bold">TOPLAM ECZANE</p><p className="text-3xl font-black">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <CalendarClock className="w-12 h-12 text-teal-600 bg-teal-50 p-2 rounded-xl" />
           <div><p className="text-sm text-slate-500 font-bold">BUGÜNKÜ NÖBETÇİ</p><p className="text-3xl font-black">{stats.duty}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4">Kayıtlı Eczaneler</h3>
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="p-3">Adı</th><th className="p-3">İlçe</th><th className="p-3">Durum</th><th className="p-3">Telefon</th></tr>
          </thead>
          <tbody className="divide-y">
             {pharmacies.map(p => (
               <tr key={p.id} className="hover:bg-slate-50">
                 <td className="p-3 font-bold">{p.ad}</td>
                 <td className="p-3 text-sm">{p.ilce}</td>
                 <td className="p-3"><span className={`px-2 py-1 text-[10px] font-bold rounded ${p.isDuty ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>{p.isDuty ? 'NÖBETÇİ' : 'KAPALI'}</span></td>
                 <td className="p-3 text-sm">{p.telefon}</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Basit Vatandaş Görünümü
function CitizenView({ pharmacies }) {
  const dutyPharmacies = pharmacies.filter(p => p.isDuty);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {dutyPharmacies.map((pharmacy) => (
        <div key={pharmacy.id} className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-2">{pharmacy.ad}</h2>
          <p className="text-slate-500 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4"/> {pharmacy.ilce}</p>
          <a href={`tel:${pharmacy.telefon}`} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
            <Phone className="w-5 h-5"/> Ara: {pharmacy.telefon}
          </a>
        </div>
      ))}
    </div>
  );
}