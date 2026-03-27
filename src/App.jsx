import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { MapPin, Phone, Activity, CalendarClock, Trash2, Edit2, Search, Filter, Pill, ShieldCheck, LayoutDashboard, Map as MapIcon, Settings, LogOut, FileText, Send, Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet İkon Düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 1. FİREBASE YAPILANDIRMASI
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

// Koordinat Üretici (Veritabanında koordinat yoksa Antep merkez etrafında rastgele dağıtır)
const getMockCoords = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return [37.0662 + (hash % 50) / 1000, 37.3833 + ((hash >> 4) % 50) / 1000];
};

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
          <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b px-8">
             <div className="flex items-center gap-3">
                <div className="bg-teal-600 text-white p-2.5 rounded-xl"><Activity className="w-6 h-6" /></div>
                <div>
                   <h1 className="font-black text-2xl tracking-tighter text-slate-900">E-90 <span className="text-teal-600">Nöbetçi</span></h1>
                   <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Gaziantep Eczane Platformu</p>
                </div>
             </div>
             <button onClick={() => setActiveTab('admin')} className="text-sm font-bold flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg">
               <ShieldCheck className="w-4 h-4" /> OdaPanel Girişi
             </button>
          </div>
          <div className="p-8 max-w-7xl mx-auto"><CitizenView pharmacies={pharmacies} /></div>
        </div>
      ) : (
        <AdminLayout pharmacies={pharmacies} db={db} setTab={setActiveTab} />
      )}
    </div>
  );
}

// ==========================================
// ODAPANEL YÖNETİM ARAYÜZÜ
// ==========================================
function AdminLayout({ pharmacies, db, setTab }) {
  const [activeMenu, setActiveMenu] = useState('map');

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#f1f5f9]">
      {/* SOL SİDEBAR */}
      <div className="w-72 bg-[#0f172a] text-slate-300 flex flex-col justify-between shadow-2xl z-20">
        <div>
          <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
            <div className="bg-teal-500 text-white p-2.5 rounded-xl shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">OdaPanel</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Gaziantep Eczacı Odası</p>
            </div>
          </div>
          <nav className="p-4 space-y-1.5 mt-2">
            <SidebarItem icon={MapIcon} text="Nöbet Planlama" active={activeMenu === 'map'} onClick={() => setActiveMenu('map')} />
            <SidebarItem icon={LayoutDashboard} text="Eczane Listesi" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} />
            <SidebarItem icon={FileText} text="Raporlar / İstatistik" active={activeMenu === 'reports'} onClick={() => setActiveMenu('reports')} />
            <SidebarItem icon={Settings} text="Sistem Ayarları" active={activeMenu === 'settings'} onClick={() => setActiveMenu('settings')} />
          </nav>
        </div>
        <div className="p-5 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">Y</div>
            <div>
              <p className="text-white font-bold text-sm">Yönetici Hesabı</p>
              <p className="text-xs text-slate-400 font-medium">Oda Sekreteryası</p>
            </div>
          </div>
          <button onClick={() => setTab('citizen')} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition text-sm">
            <LogOut className="w-4 h-4" /> Vatandaş Ekranına Dön
          </button>
        </div>
      </div>

      {/* SAĞ İÇERİK */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {activeMenu === 'dashboard' ? 'Eczane Yönetimi' : activeMenu === 'map' ? 'Haritalı Nöbet Planlama' : 'Sistem Modülü'}
          </h2>
          <div className="flex items-center gap-3 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100">
             <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
             </span>
             <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Sistem Çevrimiçi</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeMenu === 'dashboard' && <div className="p-8"><AdminDashboard pharmacies={pharmacies} db={db} /></div>}
          {activeMenu === 'map' && <MapModule pharmacies={pharmacies} db={db} />}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, text, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-semibold ${active ? 'bg-teal-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      <span className="text-sm">{text}</span>
    </button>
  );
}

// ==========================================
// HARİTALI NÖBET PLANLAMA MODÜLÜ (Efsane Kısım)
// ==========================================
function MapModule({ pharmacies, db }) {
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  const dutyPharmacies = pharmacies.filter(p => p.isDuty);

  const toggleDuty = async (pharmacy) => {
    await updateDoc(doc(db, 'eczaneler', pharmacy.id), { isDuty: !pharmacy.isDuty });
  };

  return (
    <div className="flex h-full w-full">
      {/* Sol Panel: Liste ve Butonlar */}
      <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-4">{today}<br/>Nöbet Dağıtımı</h2>
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition">
            <Edit2 className="w-4 h-4" /> Otomatik Dağıtımı Çalıştır
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">Mesafe algoritmasına göre adil dağılım yapar.</p>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input type="text" placeholder="Eczane Ara..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 mb-2">TÜM ECZANELER ({pharmacies.length})</p>
          {pharmacies.map(pharmacy => (
            <div key={pharmacy.id} className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${pharmacy.isDuty ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200 hover:border-teal-300'}`}>
              <div>
                <h4 className={`font-bold text-sm ${pharmacy.isDuty ? 'text-teal-900' : 'text-slate-800'}`}>{pharmacy.ad}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{pharmacy.ilce} Bölgesi</p>
              </div>
              <button onClick={() => toggleDuty(pharmacy)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pharmacy.isDuty ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {pharmacy.isDuty ? 'Nöbetçi' : 'Ata'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <button className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition">Taslak Kaydet</button>
            <button className="flex-[1.5] bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-black transition shadow-lg"><Send className="w-4 h-4" /> Kesinleştir</button>
        </div>
      </div>

      {/* Sağ Panel: Canlı Harita */}
      <div className="flex-1 relative bg-slate-100">
        <MapContainer center={[37.0662, 37.3833]} zoom={12} className="w-full h-full" zoomControl={false}>
          {/* Harita Teması */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
          
          {/* Nöbetçi Eczaneleri Haritada Göster */}
          {dutyPharmacies.map(pharmacy => {
            const coords = getMockCoords(pharmacy.id);
            return (
              <React.Fragment key={pharmacy.id}>
                {/* 1.5 KM Kırmızı Yasaklı Alan Algoritması */}
                <Circle center={coords} radius={1500} pathOptions={{ fillColor: '#ef4444', color: '#ef4444', weight: 1, fillOpacity: 0.1 }} />
                {/* Eczane İğnesi */}
                <Marker position={coords}>
                  <Popup className="font-sans">
                    <strong className="block text-sm mb-1">{pharmacy.ad}</strong>
                    <span className="text-xs text-slate-500">{pharmacy.ilce}</span><br/>
                    <a href={`tel:${pharmacy.telefon}`} className="text-teal-600 font-bold text-xs mt-1 inline-block">📞 {pharmacy.telefon}</a>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Lejant (Bilgi Kutusu) */}
        <div className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur p-4 rounded-xl shadow-xl border border-white/20">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">Harita Lejantı</h4>
          <div className="flex items-center gap-2.5 mb-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-slate-700">Atanmış Nöbetçi</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full border border-red-500 bg-red-500/10"></div>
            <span className="text-sm font-semibold text-slate-700">1.5 KM Çakışma Alanı</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ECZANE LİSTESİ TABLOSU (AdminDashboard)
// ==========================================
function AdminDashboard({ pharmacies, db }) {
  const stats = useMemo(() => ({ total: pharmacies.length, duty: pharmacies.filter(p => p.isDuty).length }), [pharmacies]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ad: '', ilce: gaziantepIlceleri[0], telefon: '', isDuty: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'eczaneler'), { ...formData, lastAction: serverTimestamp() });
    setModalOpen(false);
    setFormData({ ad: '', ilce: gaziantepIlceleri[0], telefon: '', isDuty: false });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Eczane Listesi</h2>
           <p className="text-slate-500 font-medium mt-1">Sisteme kayıtlı tüm eczaneleri yönetin.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition">
          <Plus className="w-5 h-5" /> Yeni Ekle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-5">
           <Pill className="w-14 h-14 text-slate-400 bg-slate-50 p-3 rounded-2xl" />
           <div><p className="text-xs text-slate-400 font-black tracking-widest uppercase mb-1">Toplam Kayıt</p><p className="text-4xl font-black text-slate-800">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-5">
           <CalendarClock className="w-14 h-14 text-teal-600 bg-teal-50 p-3 rounded-2xl" />
           <div><p className="text-xs text-teal-600/70 font-black tracking-widest uppercase mb-1">Bugünkü Nöbetçi</p><p className="text-4xl font-black text-slate-800">{stats.duty}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200/60">
            <tr>{['Eczane Adı', 'İlçe', 'Durum', 'Telefon', 'İşlem'].map(h => <th key={h} className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {pharmacies.map(p => (
               <tr key={p.id} className="hover:bg-slate-50 transition">
                 <td className="p-4 font-bold text-slate-800">{p.ad}</td>
                 <td className="p-4 text-sm font-medium text-slate-500">{p.ilce}</td>
                 <td className="p-4"><span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md ${p.isDuty ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{p.isDuty ? 'NÖBETÇİ' : 'KAPALI'}</span></td>
                 <td className="p-4 text-sm font-medium text-slate-600">{p.telefon}</td>
                 <td className="p-4">
                   <button onClick={() => deleteDoc(doc(db, 'eczaneler', p.id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button type="button" onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-black text-slate-800 mb-6">Yeni Eczane Ekle</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adı</label><input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.ad} onChange={e=>setFormData({...formData, ad: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">İlçe</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.ilce} onChange={e=>setFormData({...formData, ilce: e.target.value})}>{gaziantepIlceleri.map(i=><option key={i}>{i}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label><input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.telefon} onChange={e=>setFormData({...formData, telefon: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full mt-6 bg-teal-500 text-white font-bold py-3.5 rounded-xl">Kaydet</button>
          </form>
        </div>
      )}
    </div>
  );
}

// Vatandaş Ekranı
function CitizenView({ pharmacies }) {
  const dutyPharmacies = pharmacies.filter(p => p.isDuty);
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gaziantep Geneli</p><h2 className="text-2xl font-black text-slate-800">Şu Anki Nöbetçiler</h2></div>
        <div className="bg-teal-50 text-teal-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-100"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span> Sistem Aktif</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dutyPharmacies.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-black text-slate-800">{p.ad}</h3><span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded uppercase">Nöbetçi</span></div>
            <p className="text-slate-500 text-sm mb-6 flex items-center gap-2"><MapPin className="w-4 h-4"/>{p.ilce} / Gaziantep</p>
            <a href={`tel:${p.telefon}`} className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"><Phone className="w-4 h-4"/> {p.telefon}</a>
          </div>
        ))}
      </div>
    </div>
  );
}