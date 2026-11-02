import { useState } from 'react';
import { LayoutDashboard, LogOut, MessageSquareText, Building2, ArrowLeft, Menu, X } from 'lucide-react';
import { Residence } from '../lib/residenceService';
import { Testimonial } from '../lib/testimonialService';
import { useAdmin } from './AdminAuth';
import AdminDashboard from './AdminDashboard';
import AdminPanel from './AdminPanel';
import AdminRequests from './AdminRequests';

type Section = 'overview' | 'catalog' | 'requests';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'catalog', label: 'Résidences & Avis', icon: Building2 },
  { id: 'requests', label: 'Demandes', icon: MessageSquareText },
];

type ClickRow = { residence_id: string | null; created_at: string };
type VisitRow = { id: number; created_at: string };

type Props = {
  residences: Residence[];
  testimonials: Testimonial[];
  clicks: ClickRow[];
  visits: VisitRow[];
  onUpdate: () => void;
  editingResidence: Residence | null;
  editingTestimonial: Testimonial | null;
  onCancelEdit: () => void;
  onEditResidence: (residence: Residence) => void;
  onDeleteResidence: (id: string) => void;
  onEditTestimonial: (testimonial: Testimonial) => void;
  onDeleteTestimonial: (id: string) => void;
  onExit: () => void;
};

export default function AdminDashboardPage({
  residences,
  testimonials,
  clicks,
  visits,
  onUpdate,
  editingResidence,
  editingTestimonial,
  onCancelEdit,
  onEditResidence,
  onDeleteResidence,
  onEditTestimonial,
  onDeleteTestimonial,
  onExit,
}: Props) {
  const { logout } = useAdmin();
  const [section, setSection] = useState<Section>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onExit();
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-1">
          <img src="/logo.png" alt="Safe Trip" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-lg font-extrabold text-slate-950">SAFE<span className="text-accent">TRIP</span></span>
        </div>
        <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-300">Administration</p>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all ${section === item.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <button onClick={onExit} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={18} /> Retour au site
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-500 hover:bg-red-50">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
          <span className="font-display text-lg font-extrabold text-slate-950">Admin</span>
          <button onClick={() => setMobileNavOpen(v => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600" aria-label="Menu">
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {mobileNavOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-wrap gap-2">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setMobileNavOpen(false); }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${section === item.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500'}`}
                >
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
              <button onClick={onExit} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500"><ArrowLeft size={15} /> Site</button>
              <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500"><LogOut size={15} /> Sortir</button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8">
          {section === 'overview' && <AdminDashboard residences={residences} clicks={clicks} visits={visits} />}
          {section === 'catalog' && (
            <AdminPanel
              onUpdate={onUpdate}
              editingResidence={editingResidence}
              editingTestimonial={editingTestimonial}
              onCancelEdit={onCancelEdit}
              residences={residences}
              testimonials={testimonials}
              onEditResidence={onEditResidence}
              onDeleteResidence={onDeleteResidence}
              onEditTestimonial={onEditTestimonial}
              onDeleteTestimonial={onDeleteTestimonial}
            />
          )}
          {section === 'requests' && <AdminRequests />}
        </main>
      </div>
    </div>
  );
}
