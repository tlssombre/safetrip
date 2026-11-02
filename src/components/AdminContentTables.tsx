import { useState } from 'react';
import { Pencil, Search, Star, Trash2 } from 'lucide-react';
import { Residence } from '../lib/residenceService';
import { Testimonial } from '../lib/testimonialService';

const number = (value: string) => Number(value.replace(/\D/g, ''));

type ResidencesTableProps = {
  residences: Residence[];
  onEdit: (residence: Residence) => void;
  onDelete: (id: string) => void;
};

export function ResidencesTable({ residences, onEdit, onDelete }: ResidencesTableProps) {
  const [query, setQuery] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const filtered = residences.filter(r => `${r.title} ${r.location}`.toLowerCase().includes(query.toLowerCase()));

  if (residences.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
        <p className="text-sm font-medium text-gray-400">Aucune résidence enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une résidence..."
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <th className="px-5 py-4">Résidence</th>
              <th className="px-5 py-4">Tarif</th>
              <th className="px-5 py-4">Capacité</th>
              <th className="px-5 py-4">Statut</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const hasPromo = number(r.originalPrice || '') > number(r.price);
              const unavailableToday = r.blockedDates?.includes(today);
              return (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={r.imageUrl || r.images?.[0]} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">{r.title}</p>
                        <p className="truncate text-xs text-gray-400">{r.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-primary">{r.price} FCFA</p>
                    {hasPromo && <p className="text-xs text-gray-400 line-through">{r.originalPrice} FCFA</p>}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-600">{r.beds} ch. · {r.baths} sdb</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {hasPromo && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600">Promo</span>}
                      {unavailableToday && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-600">Indispo. auj.</span>}
                      {!hasPromo && !unavailableToday && <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-600">Disponible</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(r)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-primary hover:bg-primary/10" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => r.id && onDelete(r.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-red-500 hover:bg-red-50" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type TestimonialsTableProps = {
  testimonials: Testimonial[];
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (id: string) => void;
};

export function TestimonialsTable({ testimonials, onEdit, onDelete }: TestimonialsTableProps) {
  if (testimonials.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
        <p className="text-sm font-medium text-gray-400">Aucun avis client pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {testimonials.map(t => (
        <div key={t.id} className="rounded-3xl border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-gray-900">{t.name}</p>
              <p className="truncate text-xs uppercase tracking-wider text-gray-400">{t.role}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={() => onEdit(t)} className="grid h-8 w-8 place-items-center rounded-xl bg-gray-50 text-primary hover:bg-primary/10" title="Modifier">
                <Pencil size={13} />
              </button>
              <button onClick={() => t.id && onDelete(t.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-gray-50 text-red-500 hover:bg-red-50" title="Supprimer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <div className="mt-2 flex gap-0.5 text-yellow-500">
            {[...Array(t.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
          </div>
          <p className="mt-3 line-clamp-3 text-sm italic text-gray-600">"{t.text}"</p>
        </div>
      ))}
    </div>
  );
}
