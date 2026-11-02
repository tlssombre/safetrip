import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { getReservationRequests, updateRequestStatus, ReservationRequest, RequestStatus } from '../lib/analyticsService';

const STATUS_OPTIONS: { value: RequestStatus; label: string; tone: string }[] = [
  { value: 'nouveau', label: 'Nouveau', tone: 'bg-blue-50 text-blue-600' },
  { value: 'contacte', label: 'Contacté', tone: 'bg-amber-50 text-amber-600' },
  { value: 'confirme', label: 'Confirmé', tone: 'bg-green-50 text-green-600' },
  { value: 'annule', label: 'Annulé', tone: 'bg-red-50 text-red-600' },
];

const formatDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminRequests() {
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | 'tous'>('tous');

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await getReservationRequests());
    } catch (err) {
      console.error('[AdminRequests] Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id: number, status: RequestStatus) => {
    setRequests(prev => prev.map(item => (item.id === id ? { ...item, status } : item)));
    try {
      await updateRequestStatus(id, status);
    } catch (err) {
      console.error('[AdminRequests] Failed to update status', err);
      load();
    }
  };

  const visible = filter === 'tous' ? requests : requests.filter(item => item.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black text-slate-950">Demandes de réservation</h2>
          <p className="text-sm text-slate-400">Suivi des clics WhatsApp envoyés par les visiteurs.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as RequestStatus | 'tous')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="tous">Tous les statuts</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button onClick={load} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary" title="Rafraîchir">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-sm text-slate-400">Chargement des demandes...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <MessageCircle className="mx-auto mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-400">Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Résidence</th>
                <th className="px-5 py-4">Séjour souhaité</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Reçu le</th>
                <th className="px-5 py-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(item => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{item.residence_title || 'Résidence supprimée'}</p>
                    {item.residence_location && <p className="text-xs text-slate-400">{item.residence_location}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                    {item.booking_date ? new Date(item.booking_date).toLocaleDateString('fr-FR') : '—'}
                    {item.nights ? ` · ${item.nights} nuit${item.nights > 1 ? 's' : ''}` : ''}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{item.source === 'modal' ? 'Aperçu' : 'Fiche détail'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(item.created_at)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.id, e.target.value as RequestStatus)}
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${STATUS_OPTIONS.find(o => o.value === item.status)?.tone || 'bg-slate-100 text-slate-600'}`}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
