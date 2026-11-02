/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ResidenceCard from './components/ResidenceCard';
import ResidenceDetails from './components/ResidenceDetails';
import About from './components/About';
import Footer from './components/Footer';
import AdminGate from './components/AdminGate';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { useAdmin } from './components/AdminAuth';
import { useHashRoute } from './lib/useHashRoute';
import { getResidences, Residence, removeResidence } from './lib/residenceService';
import { defaultResidences } from './lib/defaultResidences';
import { getTestimonials, Testimonial, removeTestimonial } from './lib/testimonialService';
import { trackReservationClick, getAnalytics } from './lib/analyticsService';
import { Search, Star, Quote, Loader2, ChevronLeft, ChevronRight, X, MapPin, Bed, Bath, MessageCircle, Share2, Heart } from 'lucide-react';
import { trackVisit } from './lib/analyticsService';
import { useState, useEffect, useMemo, useRef } from 'react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [showLanding, setShowLanding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxBudget, setMaxBudget] = useState('');
  const [minBeds, setMinBeds] = useState('');
  const [promotionsOnly, setPromotionsOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('safetrip-favorites') || '[]'); } catch { return []; }
  });
  const [isSearchFixed, setIsSearchFixed] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const catalogueRef = useRef<HTMLElement>(null);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [detailResidence, setDetailResidence] = useState<Residence | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNights, setBookingNights] = useState('1');
  const [bookingError, setBookingError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'residence' | 'testimonial'; id: string; label: string } | null>(null);
  const [analytics, setAnalytics] = useState<{ clicks: { residence_id: string | null; created_at: string }[]; visits: { id: number; created_at: string }[] }>({ clicks: [], visits: [] });
  const hash = useHashRoute();

  const categories = ["Tous", "Appartements", "Penthouses", "Villas", "Studio"];
  const filteredResidences = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return residences.filter((residence) => {
      const categoryMatches = activeCategory === 'Tous' || residence.tags.some((tag) => tag.toLocaleLowerCase().includes(activeCategory.toLocaleLowerCase()));
      const searchMatches = !query || `${residence.title} ${residence.location} ${residence.tags.join(' ')}`.toLocaleLowerCase().includes(query);
      const price = Number(residence.price.replace(/\D/g, ''));
      const budgetMatches = !maxBudget || (price > 0 && price <= Number(maxBudget));
      const bedsMatches = !minBeds || residence.beds >= Number(minBeds);
      const promotionMatches = !promotionsOnly || (Number((residence.originalPrice || '').replace(/\D/g, '')) > price);
      const locationMatches = !locationFilter || residence.location.toLocaleLowerCase().includes(locationFilter.toLocaleLowerCase());
      const favoriteMatches = !favoritesOnly || (!!residence.id && favoriteIds.includes(residence.id));
      return categoryMatches && searchMatches && budgetMatches && bedsMatches && promotionMatches && locationMatches && favoriteMatches;
    });
  }, [residences, activeCategory, searchQuery, maxBudget, minBeds, promotionsOnly, locationFilter, favoritesOnly, favoriteIds]);

  const toggleFavorite = (id?: string) => {
    if (!id) return;
    setFavoriteIds(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      localStorage.setItem('safetrip-favorites', JSON.stringify(next));
      return next;
    });
  };

  const resetFilters = () => {
    setSearchQuery(''); setActiveCategory('Tous'); setMaxBudget(''); setMinBeds('');
    setPromotionsOnly(false); setLocationFilter(''); setFavoritesOnly(false);
  };

  const validateBooking = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = bookingDate ? new Date(`${bookingDate}T00:00:00`) : null;
    if (!arrival) { setBookingError('Choisissez une date d’arrivée pour continuer.'); return false; }
    if (arrival < today) { setBookingError('La date d’arrivée doit être aujourd’hui ou plus tard.'); return false; }
    if (!Number.isInteger(Number(bookingNights)) || Number(bookingNights) < 1 || Number(bookingNights) > 365) {
      setBookingError('Indiquez un nombre de nuits entre 1 et 365.'); return false;
    }
    setBookingError('');
    return true;
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('Le serveur met trop de temps à répondre.')), 15000);
      });
      const [resData, testData] = await Promise.race([
        Promise.all([getResidences(), getTestimonials()]),
        timeout,
      ]);
      setResidences(resData.length > 0 ? resData : defaultResidences);
      setTestimonials(testData);
    } catch (err) {
      console.error(err);
      setResidences(defaultResidences);
      setLoadError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    trackVisit();
  }, []);

  useEffect(() => {
    if (hash === '#admin') {
      getAnalytics().then(setAnalytics).catch((err) => console.error('[App] Failed to load analytics', err));
    }
  }, [hash]);

  useEffect(() => {
    const updateSearchPosition = () => {
      const anchor = searchAnchorRef.current;
      const catalogue = catalogueRef.current;
      if (!anchor || !catalogue) return;
      const headerHeight = window.innerWidth >= 640 ? 76 : 64;
      const catalogueBottom = catalogue.getBoundingClientRect().bottom;
      setIsSearchFixed(anchor.getBoundingClientRect().top <= headerHeight && catalogueBottom > 180);
    };
    window.addEventListener('scroll', updateSearchPosition, { passive: true });
    window.addEventListener('resize', updateSearchPosition);
    updateSearchPosition();
    return () => { window.removeEventListener('scroll', updateSearchPosition); window.removeEventListener('resize', updateSearchPosition); };
  }, []);

  useEffect(() => {
    const id = window.location.hash.match(/^#residence\/(.+)$/)?.[1];
    if (id && residences.length) setDetailResidence(residences.find(item => item.id === id) || null);
  }, [residences]);

  // Automatic Slider Interval for details modal
  useEffect(() => {
    if (!selectedResidence || !selectedResidence.images || selectedResidence.images.length <= 1 || !isAutoPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % selectedResidence.images!.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedResidence, selectedResidence?.images, isAutoPlaying]);

  // Reset image index when selected residence changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedResidence]);

  useEffect(() => {
    if (detailResidence) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [detailResidence]);

  const requestDeleteResidence = (id: string) => {
    setDeleteConfirm({ type: 'residence', id, label: 'cette résidence' });
  };

  const requestDeleteTestimonial = (id: string) => {
    setDeleteConfirm({ type: 'testimonial', id, label: 'cet avis' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'residence') {
        await removeResidence(deleteConfirm.id);
      } else {
        await removeTestimonial(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getResidenceDescription = (residence: Residence) => {
    const variants = [
      (item: Residence) => `Découvrez un cadre de vie raffiné et lumineux à ${item.location}, pensé pour allier confort, élégance et discrétion. Avec ${item.beds} chambre${item.beds > 1 ? 's' : ''} et ${item.baths} salle${item.baths > 1 ? 's' : ''} de bains, cette résidence offre un séjour haut de gamme idéal pour les escapades comme pour les séjours professionnels.`,
      (item: Residence) => `Ce bien met en valeur un environnement de prestige à ${item.location}, où chaque détail a été conçu pour offrir une expérience de séjour exceptionnelle. Son architecture soignée et ses prestations raffinées en font un choix privilégié pour un séjour inoubliable.`,
      (item: Residence) => `Idéalement situé à ${item.location}, ce logement combine charme, modernité et confort premium. La disposition des espaces, le niveau de finition et l’atmosphère de sérénité en font une adresse recherchée pour les voyageurs exigeants.`,
      (item: Residence) => `Offrant un mélange subtil entre confort contemporain et ambiance élégante, cette résidence à ${item.location} invite à profiter d’un cadre de vie sophistiqué. Elle répond parfaitement aux attentes de ceux qui recherchent qualité, discrétion et prestige.`,
    ];

    const seed = `${residence.title}${residence.location}${residence.beds}${residence.baths}`;
    const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % variants.length;

    return variants[index](residence);
  };

  const openLanding = () => {
    setShowLanding(true);
    window.setTimeout(() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const openDetails = (residence: Residence) => {
    window.location.hash = `residence/${residence.id}`;
    setDetailResidence(residence);
    setSelectedResidence(null);
  };

  if (hash === '#admin') {
    return (
      <>
        <AdminGate
          residences={residences}
          testimonials={testimonials}
          clicks={analytics.clicks}
          visits={analytics.visits}
          onUpdate={fetchData}
          editingResidence={editingResidence}
          editingTestimonial={editingTestimonial}
          onCancelEdit={() => { setEditingResidence(null); setEditingTestimonial(null); }}
          onEditResidence={setEditingResidence}
          onDeleteResidence={requestDeleteResidence}
          onEditTestimonial={setEditingTestimonial}
          onDeleteTestimonial={requestDeleteTestimonial}
          onExit={() => { window.location.hash = ''; }}
        />
        <ConfirmDeleteModal
          label={deleteConfirm?.label ?? null}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
        />
      </>
    );
  }

  if (detailResidence) {
    return <ResidenceDetails residence={detailResidence} imageIndex={currentImageIndex} onImageChange={setCurrentImageIndex} onClose={() => { history.replaceState(null, '', window.location.pathname); setDetailResidence(null); }} description={getResidenceDescription(detailResidence)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onHome={openLanding} />
      <div className={showLanding ? 'block' : 'hidden md:block'}><Hero /></div>

      {/* Categories & Search */}
      <section ref={catalogueRef} id="residences" className="py-7 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-7 mb-9">
            <div>
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-accent text-xs font-bold uppercase tracking-[0.18em] mb-3 block"
              >
                Notre Catalogue
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
                Découvrez nos Résidences <br />
                <span className="italic font-serif font-normal text-primary">de Prestige.</span>
              </h2>
            </div>
            
          </div>

          <div ref={searchAnchorRef} className={isSearchFixed ? 'mb-8 h-[142px] sm:h-[150px]' : 'mb-8'}>
          <div className={`${isSearchFixed ? 'fixed inset-x-0 top-16 z-[90] border-y border-slate-200 bg-slate-50 px-4 py-3 shadow-lg sm:top-[76px] sm:px-6' : '-mx-4 border-y border-slate-200 bg-slate-50 px-4 py-3 shadow-md sm:mx-0 sm:rounded-2xl sm:border sm:px-3'} sm:mx-auto sm:max-w-7xl`}>
          <div className="flex">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Quartier, résidence, type de bien..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>
          </div>
            <div className="relative mt-3">
              <button onClick={() => document.getElementById('category-scroll')?.scrollBy({ left: -180, behavior: 'smooth' })} className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md animate-pulse" aria-label="Catégories précédentes"><ChevronLeft size={18} /></button>
              <div id="category-scroll" className="no-scrollbar flex gap-2 overflow-x-auto px-11 py-1">
                {categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-900'}`}>{cat}</button>)}
              </div>
              <button onClick={() => document.getElementById('category-scroll')?.scrollBy({ left: 180, behavior: 'smooth' })} className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-md animate-pulse" aria-label="Catégories suivantes"><ChevronRight size={18} /></button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input value={locationFilter} onChange={event => setLocationFilter(event.target.value)} placeholder="Ville ou quartier" aria-label="Filtrer par ville ou quartier" className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20" />
              <select value={maxBudget} onChange={event => setMaxBudget(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 outline-none"><option value="">Tous budgets</option><option value="25000">Jusqu'à 25 000</option><option value="50000">Jusqu'à 50 000</option><option value="100000">Jusqu'à 100 000</option><option value="200000">Jusqu'à 200 000</option></select>
              <select value={minBeds} onChange={event => setMinBeds(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 outline-none"><option value="">Toutes chambres</option><option value="1">1+ chambre</option><option value="2">2+ chambres</option><option value="3">3+ chambres</option></select>
              <div className="flex gap-2"><button onClick={() => setPromotionsOnly(!promotionsOnly)} className={`flex-1 rounded-xl px-2 py-3 text-[10px] font-bold sm:px-3 sm:text-xs ${promotionsOnly ? 'bg-red-500 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Promotions</button><button onClick={() => setFavoritesOnly(!favoritesOnly)} className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-3 text-[10px] font-bold sm:px-3 sm:text-xs ${favoritesOnly ? 'bg-pink-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}><Heart size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />Favoris</button></div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-gray-400 font-medium">Chargement des résidences...</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">{loadError}</p>
              <button onClick={fetchData} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/95">Réessayer</button>
            </div>
          ) : filteredResidences.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
              <button onClick={resetFilters} className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Effacer les filtres</button>
              <p className="text-gray-400 font-medium">Aucune résidence disponible pour le moment.</p>
              {isAdmin && <p className="text-xs mt-2">Rendez-vous sur le tableau de bord admin pour en ajouter.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-7">
              {filteredResidences.map((res) => (
                <ResidenceCard
                  key={res.id}
                  residence={res}
                  onSelect={setSelectedResidence}
                  isFavorite={!!res.id && favoriteIds.includes(res.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 text-primary font-bold border-b-2 border-primary pb-1 hover:text-accent hover:border-accent transition-all uppercase tracking-widest text-sm">
              Voir tout le catalogue
            </button>
          </div>
        </div>
      </section>

      <About />

      {/* Testimonials */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-accent text-sm font-bold uppercase tracking-widest mb-4 block">Témoignages</span>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-6">
              Ils nous font <span className="italic font-serif font-normal text-primary">confiance.</span>
            </h2>
            <p className="text-gray-500 font-light text-lg">
              La satisfaction de nos clients et la réussite de nos propriétaires sont nos priorités absolues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.length === 0 ? (
              <div className="md:col-span-3 text-center py-12 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Aucun témoignage disponible pour le moment.</p>
              </div>
            ) : (
              testimonials.map((t, i) => (
                <motion.div
                  key={t.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[40px] bg-gray-50 border border-gray-100 flex flex-col h-full relative group"
                >
                  <div className="mb-6 flex justify-between items-start">
                    <div className="flex gap-1 text-yellow-500">
                      {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                    </div>
                    <Quote className="text-primary/20" size={32} />
                  </div>
                  <p className="text-gray-700 italic font-serif text-lg mb-8 flex-1 leading-relaxed">"{t.text}"</p>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t.role}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[60px] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="absolute top-0 right-0 w-96 h-96 border-[40px] border-white rounded-full"></div>
               <div className="absolute bottom-0 left-0 w-48 h-48 border-[20px] border-white rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-8 leading-tight">
                Propriétaires, <br />
                <span className="italic font-serif font-normal text-secondary/80 underline underline-offset-8">mettez vos biens en location avec nous.</span>
              </h2>
              <p className="text-white/60 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                Vous possédez une résidence et vous souhaitez la mettre en location avec une gestion professionnelle, fiable et à forte visibilité ? Contactez-nous dès aujourd'hui !
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="https://wa.me/message/3HKDYS6DBJADK1"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-white text-primary px-10 py-5 rounded-full font-bold hover:bg-gray-100 transition-all text-lg shadow-xl shadow-black/10 inline-flex items-center justify-center"
                >
                  Nous Contacter sur WhatsApp
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61574046737190"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-white/30 text-white px-10 py-5 rounded-full font-bold hover:bg-white/10 transition-all text-lg"
                >
                  Voir Plus de Photos
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <ConfirmDeleteModal
        label={deleteConfirm?.label ?? null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
      />

      {/* Detail Modal & Automatic Image Slider */}
      <AnimatePresence>
        {selectedResidence && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResidence(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative flex h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[40px] lg:flex-row z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedResidence(null)}
                className="absolute top-6 right-6 lg:top-8 lg:right-8 bg-black/60 hover:bg-black/85 text-white p-3 rounded-full transition-all z-30 shadow-lg cursor-pointer"
                title="Fermer"
              >
                <X size={20} />
              </button>

              {/* Left Column: Image Slider */}
              <div 
                className="relative h-[31dvh] min-h-[210px] w-full shrink-0 bg-slate-900 group sm:h-[400px] lg:h-auto lg:min-h-[500px] lg:w-3/5"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                {/* Images Container */}
                <div className="w-full h-full relative overflow-hidden">
                  {selectedResidence.images && selectedResidence.images.length > 0 ? (
                    <motion.img
                      key={currentImageIndex}
                      src={selectedResidence.images[currentImageIndex]}
                      alt={`${selectedResidence.title} - ${currentImageIndex + 1}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      onClick={() => setIsFullscreenGallery(true)}
                      className="w-full h-full cursor-zoom-in object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img
                      src={selectedResidence.imageUrl}
                      alt={selectedResidence.title}
                      onClick={() => setIsFullscreenGallery(true)}
                      className="w-full h-full cursor-zoom-in object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Dark Gradient Overlay for Typography contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 pointer-events-none" />

                {/* Image Info & Navigation Dots */}
                {selectedResidence.images && selectedResidence.images.length > 1 && (
                  <>
                    {/* Navigation Buttons */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => 
                          prev === 0 ? selectedResidence.images!.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-900 shadow-lg transition hover:bg-white sm:left-4 sm:bg-white/15 sm:p-3.5 sm:text-white sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Précédent"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => 
                          (prev + 1) % selectedResidence.images!.length
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-900 shadow-lg transition hover:bg-white sm:right-4 sm:bg-white/15 sm:p-3.5 sm:text-white sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Suivant"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Pagination Indicator / Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {selectedResidence.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex ? "w-6 bg-secondary" : "w-2 bg-white/40 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Status indicator on the slider */}
                <span className="absolute bottom-6 left-6 text-white/90 text-[10px] font-black tracking-widest uppercase font-mono bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {selectedResidence.images && selectedResidence.images.length > 1
                    ? `IMAGE ${currentImageIndex + 1} SUR ${selectedResidence.images.length}`
                    : "APERÇU RESIDENCE"}
                </span>
              </div>

              {/* Right Column: Detailed Info and Action */}
              <div className="flex w-full min-h-0 flex-1 flex-col justify-between overflow-hidden p-4 sm:p-8 lg:w-2/5 lg:p-10 lg:max-h-[90vh]">
                <div className="space-y-6">
                  {/* Category & Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2 lg:pt-0">
                    {selectedResidence.tags.map(tag => (
                      <span key={tag} className="bg-primary/5 text-primary text-[9px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full border border-primary/10">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 mb-3 leading-tight">
                      {selectedResidence.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <MapPin size={16} className="text-accent flex-shrink-0" />
                      {selectedResidence.location}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100">
                    <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm flex-shrink-0">
                        <Bed size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-950 font-display truncate">{selectedResidence.beds}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider truncate">Chambres</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm flex-shrink-0">
                        <Bath size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-950 font-display truncate">{selectedResidence.baths}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider truncate">Douches</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Pricing & Booking Footer Block */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Tarif nuitée</span>
                    <div>
                      <span className="text-2xl font-display font-black text-primary">{selectedResidence.price}</span>
                      {selectedResidence.originalPrice && <div className="mt-1 text-right"><span className="text-xs text-slate-400 line-through">{selectedResidence.originalPrice} FCFA</span><span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">-{Math.max(0, Math.round((1 - Number(selectedResidence.price.replace(/\D/g, '')) / Number(selectedResidence.originalPrice.replace(/\D/g, ''))) * 100))}%</span></div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date d'arrivée<input type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nuits<input type="number" min="1" value={bookingNights} onChange={(event) => setBookingNights(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></label>
                  </div>

                  <div className="grid grid-cols-2 gap-2"><button onClick={() => openDetails(selectedResidence)} className="rounded-2xl border border-primary/20 py-3 text-xs font-black uppercase tracking-widest text-primary transition hover:bg-primary/5">Plus de détails</button><button onClick={() => navigator.share?.({ title: selectedResidence.title, text: `Découvrez ${selectedResidence.title} sur Safe Trip`, url: `${location.origin}${location.pathname}#residence/${selectedResidence.id}` })} className="inline-flex items-center justify-center gap-1 rounded-2xl bg-slate-100 py-3 text-xs font-black text-slate-600"><Share2 size={15} /> Partager</button></div>

                  <a
                    onClick={(event) => {
                      if (!validateBooking()) { event.preventDefault(); return; }
                      trackReservationClick(selectedResidence.id, 'modal', { title: selectedResidence.title, location: selectedResidence.location, bookingDate, nights: Number(bookingNights) || undefined });
                      event.currentTarget.href = `https://wa.me/2250501914649?text=${encodeURIComponent(`Bonjour Safe Trip, je suis intéressé(e) par "${selectedResidence.title}" à ${selectedResidence.location}. Date d'arrivée souhaitée : ${bookingDate || 'à préciser'}. Nombre de nuit(s) : ${bookingNights || 'à préciser'}. Tarif affiché : ${selectedResidence.price} FCFA. Pouvez-vous confirmer la disponibilité ?`)}`;
                    }}
                    href={`https://wa.me/2250501914649?text=${encodeURIComponent(
                      `Bonjour Prestige Résidences, je suis intéressé(e) par la résidence de prestige "${selectedResidence.title}" à ${selectedResidence.location} (${selectedResidence.price}). Pouvez-vous s'il vous plaît me confirmer la disponibilité ?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all shadow-xl shadow-green-500/10 cursor-pointer"
                  >
                    <MessageCircle size={18} fill="currentColor" />
                    Réserver sur WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>{isFullscreenGallery && selectedResidence && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] flex items-center justify-center bg-black p-3"><button onClick={() => setIsFullscreenGallery(false)} className="absolute right-5 top-5 z-10 rounded-full bg-white/15 p-3 text-white"><X size={22}/></button><button onClick={() => setCurrentImageIndex(i => i === 0 ? (selectedResidence.images?.length || 1) - 1 : i - 1)} className="absolute left-3 z-10 rounded-full bg-white/15 p-3 text-white"><ChevronLeft/></button><img src={selectedResidence.images?.[currentImageIndex] || selectedResidence.imageUrl} alt={selectedResidence.title} className="max-h-full max-w-full object-contain"/><button onClick={() => setCurrentImageIndex(i => (i + 1) % (selectedResidence.images?.length || 1))} className="absolute right-3 z-10 rounded-full bg-white/15 p-3 text-white"><ChevronRight/></button></motion.div>}</AnimatePresence>
    </div>
  );
}
