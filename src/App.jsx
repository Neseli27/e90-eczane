import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { MapPin, Phone, Navigation, Plus, Activity, Clock, Trash2, Edit2, Search, Filter, Pill, CalendarClock, AlertTriangle, CloudCheck, X, ShieldCheck } from 'lucide-react';

// 1. SENİN FİREBASE YAPILANDIRMAN (Stabil ve Canlı)
const firebaseConfig = {
  apiKey: "AIzaSyCqUSoowo2EbKKhG0SBcIzBYddwYOzHKRo",
  authDomain: "egitim-yonetim-platformu.firebaseapp.com",
  projectId: "egitim-yonetim-platformu",
  storageBucket: "egitim-yonetim-platformu.firebasestorage.app",
  messagingSenderId: "548967060709",
  appId: "1:548967060709:web:18d27afcb6ec387734700c",
  measurementId: "G-JSYQ1QPZ2Q"
};

// Firebase Servislerini Başlatma
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Gaziantep İlçeleri
const gaziantepIlceleri = [
  "Şahinbey", "Şehitkamil", "Oğuzeli", "Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Yavuzeli"
];

// Tema Renkleri
const colors = {
  primary: 'teal-600',
  primaryHover: 'teal-700',
  accent: 'red-600',
  bg: 'gray-50',
  card: 'white',
  textMain: 'gray-900',
  textSub: 'gray-600'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin'); // Başlangıçta Yönetim Paneli

  // Kimlik Doğrulama
  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error("Giriş Hatası:", e));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Gerçek Zamanlı Veritabanı Dinleyicisi
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'eczaneler'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPharmacies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (e) => { console.error("Veri hatası:", e); setLoading(false); });
    return () => unsubscribe();
  }, [user]);

  if (loading) return (
    <div className={`min-h-screen bg-${colors.bg} flex flex-col items-center justify-center`}>
      <Activity className={`w-16 h-16 text-${colors.accent} animate-pulse mb-6`} />
      <h1 className="text-2xl font-black text-gray-800 tracking-tighter">E-90 Yükleniyor...</h1>
    </div>
  );

  return (
    <div className={`min-h-screen bg-${colors.bg} font-sans`}>
      <header className={`bg-${colors.card} shadow-sm sticky top-0 z-40 border-b border-gray-100`}>
        <div className="max-w-[90rem] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`bg-${colors.accent} text-white rounded-xl p-2.5 shadow-md`}>
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl leading-none tracking-tighter text-gray-950">E-90 <span className={`text-${colors.accent}`}>Nöbetçi</span></h1>
              <p className={`text-xs text-${colors.textSub} font-semibold uppercase tracking-widest mt-0.5`}>Gaziantep Eczane Platformu</p>
            </div>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {['citizen', 'admin'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2.5 transition ${activeTab === tab ? `bg-${colors.card} text-${colors.primary} shadow` : `text-${colors.textSub} hover:bg-gray-200`}`}>
                {tab === 'citizen' ? <Navigation className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                {tab === 'citizen' ? 'Vatandaş Ekranı' : 'Yönetim Paneli'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto px-6 py-8">
        {activeTab === 'citizen' ? (
          <CitizenView pharmacies={pharmacies} />
        ) : (
          <AdminView pharmacies={pharmacies} db={db} />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 1. VATANDAŞ EKRANI (Modernize Edilmiş)
// ==========================================
function CitizenView({ pharmacies }) {
  const dutyPharmacies = useMemo(() => pharmacies.filter(p => p.isDuty).sort((a,b) => (a.ilce === "Şahinbey" ? -1 : 1)), [pharmacies]);
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8">
      <div className={`bg-${colors.card} rounded-3xl shadow-lg p-6 border border-gray-100 flex justify-between items-center`}>
        <div>
          <p className={`text-sm text-${colors.textSub} font-bold uppercase tracking-wider mb-1`}>Şu Anki Durum</p>
          <p className="font-black text-3xl text-gray-900 tracking-tight">{today}</p>
        </div>
        <div className={`flex items-center gap-3 text-${colors.primary} bg-teal-50 px-5 py-3 rounded-2xl font-bold text-base`}>
          <span className="relative flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${colors.primary} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 bg-${colors.primary}`}></span>
          </span>
          Sistem Aktif - {dutyPharmacies.length} Nöbetçi
        </div>
      </div>

      {dutyPharmacies.length === 0 ? (
        <div className={`bg-${colors.card} p-16 rounded-3xl text-center shadow-lg border border-gray-100`}>
          <Clock className={`w-20 h-20 text-gray-200 mx-auto mb-6`} />
          <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">Şu An Nöbetçi Eczane Bulunmuyor</h3>
          <p className={`text-${colors.textSub} mt-2`}>Yönetici tarafından nöbet listesi güncellendiğinde burada görünecektir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dutyPharmacies.map((pharmacy, index) => (
            <div key={pharmacy.id} className={`bg-${colors.card} rounded-3xl shadow-xl overflow-hidden relative border border-gray-100 transition hover:shadow-2xl`}>
              {index < 2 && (
                <div className={`bg-${colors.primary} text-white text-[11px] font-black px-4 py-1.5 absolute top-0 left-0 rounded-br-2xl flex items-center gap-1.5 z-10 tracking-wide`}>
                  <MapPin className="w-3.5 h-3.5" /> MERKEZİ KONUM
                </div>
              )}
              <div className="p-7 pt-10">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-3xl font-black text-gray-950 tracking-tighter leading-none">{pharmacy.ad}</h2>
                  <span className={`bg-red-50 text-${colors.accent} text-[11px] font-black px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest`}>NÖBETÇİ</span>
                </div>
                <p className={`text-${colors.textSub} mb-1.5 text-sm leading-relaxed flex items-center gap-2.5 font-semibold`}>
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" /> {pharmacy.ilce} / Gaziantep
                </p>
                <p className={`text-${colors.textSub} mb-6 text-base leading-relaxed`}>{pharmacy.adres}</p>
                <div className="flex gap-4">
                  <a href={`tel:${pharmacy.telefon}`} className={`flex-1 bg-${colors.primary} text-white py-4 rounded-2xl font-bold text-sm text-center hover:bg-${colors.primaryHover} transition flex items-center justify-center gap-2.5 shadow-md`}>
                    <Phone className="w-5 h-5" /> Ara
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.adres + ' ' + pharmacy.ilce + ' Gaziantep')}`} target="_blank" rel="noreferrer" className={`flex-[1.5] bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm text-center hover:bg-black transition shadow-md flex items-center justify-center gap-2.5`}>
                    <Navigation className="w-5 h-5" /> Yol Tarifi Al
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. YÖNETİM PANELİ (Ekran Görüntüsü Birebiri)
// ==========================================
function AdminView({ pharmacies, db }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // id or null
  const [formData, setFormData] = useState({ ad: '', ilce: gaziantepIlceleri[0], adres: '', telefon: '', isDuty: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Arama ve Filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIlce, setFilterIlce] = useState('Hepsi');

  // Analiz Hesaplamaları
  const stats = useMemo(() => {
    return {
      total: pharmacies.length,
      duty: pharmacies.filter(p => p.isDuty).length,
      pending: pharmacies.filter(p => !p.telefon || !p.adres).length, // Örnek analiz
      lastUpdate: pharmacies.length > 0 ? new Date(Math.max(...pharmacies.map(p => p.lastAction?.toMillis() || 0))).toLocaleTimeString('tr-TR') : 'N/A'
    };
  }, [pharmacies]);

  // Filtrelenmiş Liste
  const filteredPharmacies = useMemo(() => {
    return pharmacies
      .filter(p => filterIlce === 'Hepsi' || p.ilce === filterIlce)
      .filter(p => p.ad.toLowerCase().includes(searchTerm.toLowerCase()) || p.telefon.includes(searchTerm))
      .sort((a,b) => (b.lastAction?.toMillis() || 0) - (a.lastAction?.toMillis() || 0));
  }, [pharmacies, filterIlce, searchTerm]);

  // Modal Açma (Ekleme veya Düzenleme için)
  const openModal = (pharmacy = null) => {
    if (pharmacy) {
      setIsEditing(pharmacy.id);
      setFormData({ ad: pharmacy.ad, ilce: pharmacy.ilce, adres: pharmacy.adres, telefon: pharmacy.telefon, isDuty: pharmacy.isDuty });
    } else {
      setIsEditing(null);
      setFormData({ ad: '', ilce: gaziantepIlceleri[0], adres: '', telefon: '', isDuty: true });
    }
    setModalOpen(true);
  };

  // Kaydetme İşlemi (CRUD - Create & Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // GÜNCELLEME (Update)
        await updateDoc(doc(db, 'eczaneler', isEditing), { ...formData, lastAction: serverTimestamp() });
      } else {
        // YENİ EKLEME (Create)
        await addDoc(collection(db, 'eczaneler'), { ...formData, lastAction: serverTimestamp() });
      }
      setModalOpen(false);
    } catch (error) { alert("Hata: " + error.message); }
    setIsSubmitting(false);
  };

  // Silme İşlemi (CRUD - Delete)
  const handleDelete = async (pharmacy) => {
    if (window.confirm(`${pharmacy.ad} eczanesini silmek istediğinize emin misiniz?`)) {
      await deleteDoc(doc(db, 'eczaneler', pharmacy.id));
    }
  };

  // Nöbet Durumu Değiştirme (Hızlı Düzenleme)
  const toggleDuty = async (pharmacy) => {
    await updateDoc(doc(db, 'eczaneler', pharmacy.id), { isDuty: !pharmacy.isDuty, lastAction: serverTimestamp() });
  };

  // Analiz Kartları Bileşeni
  const StatCard = ({ icon: Icon, title, value, unit, color }) => (
    <div className={`bg-${colors.card} p-7 rounded-3xl shadow-lg border border-gray-100 flex items-center gap-6`}>
      <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100`}>
        <Icon className="w-10 h-10" />
      </div>
      <div>
        <p className={`text-sm text-${colors.textSub} font-bold uppercase tracking-wider mb-1`}>{title}</p>
        <p className="text-4xl font-black text-gray-950 tracking-tighter leading-none">{value} <span className="text-lg font-bold tracking-normal text-gray-400">{unit}</span></p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* 1. ANALİZ PANELİ (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={Pill} title="Toplam Eczane" value={stats.total} unit="adet" color="gray" />
        <StatCard icon={CalendarClock} title="Bugünkü Nöbetçi" value={stats.duty} unit="aktif" color="teal" />
        <StatCard icon={AlertTriangle} title="Eksik Veri" value={stats.pending} unit="kayıt" color="red" />
        <StatCard icon={CloudCheck} title="Son Senkronizasyon" value={stats.lastUpdate} unit="" color="gray" />
      </div>

      {/* 2. ANA YÖNETİM ALANI */}
      <div className={`bg-${colors.card} rounded-3xl shadow-xl border border-gray-100 overflow-hidden`}>
        {/* Aksiyon Barı */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center gap-4 flex-wrap bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-950 tracking-tighter">Eczane Listesi</h2>
            <div className={`bg-${colors.accent} text-white font-bold text-xs px-3 py-1 rounded-full`}>{filteredPharmacies.length}</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* İlçe Filtresi */}
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select value={filterIlce} onChange={(e) => setFilterIlce(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition">
                <option>Hepsi</option>
                {gaziantepIlceleri.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            {/* Arama Kutusu */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Eczane adı veya telefon ara..."
                className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm w-80 focus:ring-2 focus:ring-teal-200 transition focus:border-teal-300" />
            </div>
            {/* Yeni Ekle Butonu */}
            <button onClick={() => openModal()}
              className={`px-6 py-3 bg-${colors.primary} text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-${colors.primaryHover} transition shadow-md`}>
              <Plus className="w-5 h-5" /> Yeni Eczane Ekle
            </button>
          </div>
        </div>

        {/* 3. VERİ TABLOSU (Modern) */}
        {filteredPharmacies.length === 0 ? (
          <div className="text-center py-20 px-6">
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Kayıt Bulunamadı</h3>
            <p className={`text-${colors.textSub} mt-1`}>Filtreleri değiştirebilir veya yeni bir eczane ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100/50 border-b border-gray-100">
                <tr>
                  {['Adı', 'İlçe', 'Durum', 'Telefon', 'Son İşlem', 'İşlemler'].map(header => (
                    <th key={header} className={`px-6 py-4 text-xs text-${colors.textSub} font-black uppercase tracking-widest`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPharmacies.map(pharmacy => (
                  <tr key={pharmacy.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-gray-900 text-base tracking-tight">{pharmacy.ad}</td>
                    <td className="px-6 py-5 text-sm text-gray-700 font-semibold">{pharmacy.ilce}</td>
                    <td className="px-6 py-5">
                      <button onClick={() => toggleDuty(pharmacy)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${pharmacy.isDuty ? `bg-teal-50 text-${colors.primary} border border-teal-100` : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-100'}`}>
                        {pharmacy.isDuty ? <CalendarClock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {pharmacy.isDuty ? 'Nöbetçi' : 'Kapalı'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-800">{pharmacy.telefon}</td>
                    <td className="px-6 py-5 text-xs text-gray-500 font-mono">
                      {pharmacy.lastAction ? pharmacy.lastAction.toDate().toLocaleString('tr-TR', {dateStyle:'short', timeStyle:'short'}) : 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(pharmacy)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-teal-600 transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(pharmacy)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. EKLEME/DÜZENLEME MODALI (Form) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
            className={`bg-${colors.card} rounded-3xl shadow-2xl w-full max-w-xl p-8 space-y-6 border border-gray-100 transform transition-all`}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-950 tracking-tighter">
                {isEditing ? 'Eczane Bilgilerini Düzenle' : 'Yeni Eczane Kaydı'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Eczane Adı" required value={formData.ad} onChange={v => setFormData({...formData, ad: v})} placeholder="Örn: Güneş Eczanesi" />
              <div>
                <label className={`block text-xs font-black uppercase text-${colors.textSub} mb-1.5 tracking-wider`}>İlçe</label>
                <select required value={formData.ilce} onChange={e => setFormData({...formData, ilce: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-300">
                  {gaziantepIlceleri.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <InputField label="Telefon" required type="tel" value={formData.telefon} onChange={v => setFormData({...formData, telefon: v})} placeholder="0342 XXX XX XX" />
            
            <div>
              <label className={`block text-xs font-black uppercase text-${colors.textSub} mb-1.5 tracking-wider`}>Açık Adres</label>
              <textarea required rows="3" value={formData.adres} onChange={e => setFormData({...formData, adres: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-300 placeholder:text-gray-300" 
                placeholder="Örn: İbrahimli Mah. 22 Nolu Cadde No: 45"></textarea>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input type="checkbox" id="isDuty" checked={formData.isDuty} onChange={e => setFormData({...formData, isDuty: e.target.checked})}
                className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 border-gray-300" />
              <label htmlFor="isDuty" className="text-sm font-bold text-gray-800 cursor-pointer">Bu eczane şu an nöbetçi mi?</label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition">İptal</button>
              <button type="submit" disabled={isSubmitting}
                className={`flex-[2] px-6 py-3.5 bg-${colors.primary} text-white font-bold rounded-xl text-sm hover:bg-${colors.primaryHover} transition disabled:opacity-50`}>
                {isSubmitting ? 'Kaydediliyor...' : (isEditing ? 'Değişiklikleri Kaydet' : 'Eczaneyi Sisteme Ekle')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Ortak Input Bileşeni
const InputField = ({ label, required, onChange, ...props }) => (
  <div>
    <label className={`block text-xs font-black uppercase text-${colors.textSub} mb-1.5 tracking-wider`}>
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input required={required} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-300 placeholder:text-gray-300"
      {...props} />
  </div>
);