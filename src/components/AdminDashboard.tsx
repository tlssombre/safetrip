import { CalendarDays, Home, MousePointerClick, Tag, TrendingUp } from 'lucide-react';
import { Residence } from '../lib/residenceService';

type ClickRow = { residence_id: string | null; created_at: string };
type VisitRow = { id: number; created_at: string };

type Props = {
  residences: Residence[];
  clicks: ClickRow[];
  visits: VisitRow[];
};

const number = (value: string) => Number(value.replace(/\D/g, ''));

const DAYS_WINDOW = 14;

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function buildDailySeries(clicks: ClickRow[], visits: VisitRow[]) {
  const days: string[] = [];
  const today = new Date();
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const visitCounts = new Map<string, number>();
  const clickCounts = new Map<string, number>();
  visits.forEach(v => { const k = dayKey(v.created_at); visitCounts.set(k, (visitCounts.get(k) || 0) + 1); });
  clicks.forEach(c => { const k = dayKey(c.created_at); clickCounts.set(k, (clickCounts.get(k) || 0) + 1); });
  return days.map(day => ({ day, visits: visitCounts.get(day) || 0, clicks: clickCounts.get(day) || 0 }));
}

function DailyChart({ clicks, visits }: { clicks: ClickRow[]; visits: VisitRow[] }) {
  const series = buildDailySeries(clicks, visits);
  const max = Math.max(1, ...series.map(d => Math.max(d.visits, d.clicks)));
  const width = 560;
  const height = 160;
  const padding = 8;
  const barGroupWidth = (width - padding * 2) / series.length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-black">Activité (14 derniers jours)</h3>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Visites</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Clics WhatsApp</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" preserveAspectRatio="none">
        {series.map((d, i) => {
          const x = padding + i * barGroupWidth;
          const visitH = (d.visits / max) * (height - 24);
          const clickH = (d.clicks / max) * (height - 24);
          const barWidth = Math.max(2, barGroupWidth / 2 - 2);
          return (
            <g key={d.day}>
              <rect x={x} y={height - 20 - visitH} width={barWidth} height={visitH} fill="#0f172a" rx={2} />
              <rect x={x + barWidth + 2} y={height - 20 - clickH} width={barWidth} height={clickH} fill="var(--color-accent, #f59e0b)" rx={2} />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-bold uppercase text-slate-300">
        <span>{series[0]?.day.slice(5)}</span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function TopResidences({ residences, clicks }: { residences: Residence[]; clicks: ClickRow[] }) {
  const counts = new Map<string, number>();
  clicks.forEach(c => { if (c.residence_id) counts.set(c.residence_id, (counts.get(c.residence_id) || 0) + 1); });
  const ranked = residences
    .map(r => ({ residence: r, count: r.id ? counts.get(r.id) || 0 : 0 }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="font-display text-xl font-black">Résidences les plus demandées</h3>
      <div className="mt-4 space-y-3">
        {ranked.length === 0 ? (
          <p className="text-sm text-slate-400">Pas encore de clics enregistrés.</p>
        ) : (
          ranked.map(({ residence, count }, i) => (
            <div key={residence.id} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{residence.title}</p>
                <p className="truncate text-xs text-slate-400">{residence.location}</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">{count} clic{count > 1 ? 's' : ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ residences, clicks, visits }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const promos = residences.filter(item => number(item.originalPrice || '') > number(item.price));
  const unavailable = residences.filter(item => item.blockedDates?.includes(today));
  const cards = [
    ['Biens publiés', residences.length, Home, 'bg-primary text-white'],
    ['Promotions actives', promos.length, Tag, 'bg-red-500 text-white'],
    ["Indisponibles aujourd'hui", unavailable.length, CalendarDays, 'bg-amber-400 text-slate-950'],
    ['Clics WhatsApp', clicks.length, MousePointerClick, 'bg-green-500 text-white'],
  ] as const;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Pilotage Safe Trip</p>
        <h2 className="mt-1 font-display text-3xl font-black text-slate-950">Vue d'ensemble</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <div key={label} className={`rounded-3xl p-5 ${tone}`}>
            <Icon size={20} />
            <p className="mt-5 text-xs font-bold opacity-75">{label}</p>
            <p className="mt-1 font-display text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DailyChart clicks={clicks} visits={visits} />
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200"><TrendingUp size={14} /> Taux d'intérêt</p>
          <p className="mt-2 font-display text-5xl font-black">{visits.length ? Math.round((clicks.length / visits.length) * 100) : 0}%</p>
          <p className="mt-5 text-sm text-slate-300"><b>{visits.length}</b> visites pour <b>{clicks.length}</b> clics WhatsApp enregistrés.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-xl font-black">Promotions en cours</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {promos.length ? (
              promos.map(item => (
                <span key={item.id} className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                  {item.title} · {item.price} FCFA
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">Aucune promotion active.</p>
            )}
          </div>
        </div>
        <TopResidences residences={residences} clicks={clicks} />
      </div>
    </section>
  );
}
