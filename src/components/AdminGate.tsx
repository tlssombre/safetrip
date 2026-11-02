import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAdmin, PasswordLoginForm } from './AdminAuth';
import AdminDashboardPage from './AdminDashboardPage';
import { Residence } from '../lib/residenceService';
import { Testimonial } from '../lib/testimonialService';

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

export default function AdminGate(props: Props) {
  const { isAdmin, loading, loginWithPassword, authError } = useAdmin();

  if (loading) return <div className="min-h-screen bg-slate-100" />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl">
          <button onClick={props.onExit} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700">
            <ArrowLeft size={16} /> Retour au site
          </button>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={32} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Tableau de bord Admin</h2>
            <p className="mb-8 text-sm leading-relaxed text-gray-500">Connectez-vous pour accéder à l'espace de gestion Safe Trip.</p>
            {authError && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-left">
                <p className="mb-1 text-xs font-black uppercase tracking-wider text-red-700">Erreur d'authentification</p>
                <p className="text-[11px] font-medium leading-relaxed text-red-600">{authError}</p>
              </div>
            )}
            <PasswordLoginForm onSubmit={(pwd) => loginWithPassword(pwd)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardPage
      residences={props.residences}
      testimonials={props.testimonials}
      clicks={props.clicks}
      visits={props.visits}
      onUpdate={props.onUpdate}
      editingResidence={props.editingResidence}
      editingTestimonial={props.editingTestimonial}
      onCancelEdit={props.onCancelEdit}
      onEditResidence={props.onEditResidence}
      onDeleteResidence={props.onDeleteResidence}
      onEditTestimonial={props.onEditTestimonial}
      onDeleteTestimonial={props.onDeleteTestimonial}
      onExit={props.onExit}
    />
  );
}
