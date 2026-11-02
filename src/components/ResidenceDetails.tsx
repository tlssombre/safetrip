import { ArrowLeft, Bath, Bed, ChevronLeft, ChevronRight, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Residence } from '../lib/residenceService';
import { trackReservationClick } from '../lib/analyticsService';

type Props = { residence: Residence; imageIndex: number; onImageChange: (n: number) => void; onClose: () => void; description: string };

export default function ResidenceDetails({ residence, imageIndex, onImageChange, onClose, description }: Props) {
  const images = residence.images?.length ? residence.images : [residence.imageUrl];
  const [date, setDate] = useState('');
  const [nights, setNights] = useState('1');
  const [error, setError] = useState('');
  const price = Number(residence.price.replace(/\D/g, ''));
  const stayNights = Math.max(1, Number(nights) || 1);
  const total = price * stayNights;
  const old = Number((residence.originalPrice || '').replace(/\D/g, ''));
  const discount = old > price ? Math.round((1 - price / old) * 100) : 0;
  const whatsapp = `https://wa.me/2250501914649?text=${encodeURIComponent(`Bonjour Safe Trip, je souhaite réserver ${residence.title}. Date d'arrivée : ${date} ; nombre de nuits : ${stayNights}. Tarif : ${residence.price} FCFA par nuit, estimation ${total.toLocaleString('fr-FR')} FCFA hors frais éventuels. Merci de confirmer la disponibilité et le montant final.`)}`;

  const reserve = (event: MouseEvent<HTMLAnchorElement>) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!date) { event.preventDefault(); setError('Choisissez une date d’arrivée.'); return; }
    if (new Date(`${date}T00:00:00`) < today) { event.preventDefault(); setError('Choisissez une date qui n’est pas passée.'); return; }
    if (!Number.isInteger(Number(nights)) || Number(nights) < 1 || Number(nights) > 365) { event.preventDefault(); setError('Indiquez entre 1 et 365 nuits.'); return; }
    setError('');
    trackReservationClick(residence.id, 'details', { title: residence.title, location: residence.location, bookingDate: date, nights: stayNights });
  };

  return <main className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 pb-24">
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 px-4 backdrop-blur"><button onClick={onClose} className="mx-auto flex min-h-11 h-full w-full max-w-6xl items-center gap-2 text-sm font-bold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft size={18} /> Retour au catalogue</button></header>
    <div className="mx-auto grid max-w-6xl min-w-0 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-2 lg:gap-10">
      <section className="min-w-0"><div className="relative overflow-hidden rounded-[24px] bg-slate-900"><img src={images[imageIndex]} alt={residence.title} className="aspect-square w-full object-cover sm:aspect-[4/3]" />{images.length > 1 && <><button aria-label="Image précédente" onClick={() => onImageChange((imageIndex - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><ChevronLeft size={20} /></button><button aria-label="Image suivante" onClick={() => onImageChange((imageIndex + 1) % images.length)} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><ChevronRight size={20} /></button></>}</div></section>
      <section className="min-w-0"><p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500"><MapPin size={15} className="text-accent" />{residence.location}</p><h1 className="mt-2 break-words font-display text-3xl font-extrabold text-slate-950">{residence.title}</h1>
        <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-4"><Bed size={19} className="text-accent" /><b className="mt-2 block text-xl">{residence.beds}</b><small className="text-slate-500">Chambres</small></div><div className="rounded-2xl bg-white p-4"><Bath size={19} className="text-accent" /><b className="mt-2 block text-xl">{residence.baths}</b><small className="text-slate-500">Salles de bain</small></div></div>
        <p className="my-5 border-y border-slate-200 py-5 text-sm leading-relaxed text-slate-700">{description}</p>
        <div className="rounded-3xl bg-primary p-4 text-white sm:p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Prix par nuit</p><p className="mt-1 font-display text-3xl font-extrabold">{residence.price} FCFA</p>{discount > 0 && <p className="mt-1 text-sm text-blue-100">Au lieu de <span className="line-through">{residence.originalPrice} FCFA</span> · -{discount}%</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Date d’arrivée<input aria-label="Date d’arrivée" type="date" required min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => { setDate(event.target.value); setError(''); }} className="mt-1 block min-h-11 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300" /></label><label className="text-xs font-bold">Nombre de nuits<input aria-label="Nombre de nuits" type="number" required min="1" max="365" inputMode="numeric" value={nights} onChange={event => { setNights(event.target.value); setError(''); }} className="mt-1 block min-h-11 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300" /></label></div>
          <p aria-live="polite" className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">Estimation : {total.toLocaleString('fr-FR')} FCFA <span className="font-normal text-blue-100">(hors frais éventuels, à confirmer)</span></p>
          {error && <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <a onClick={reserve} href={whatsapp} target="_blank" rel="noreferrer" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3.5 text-center font-bold text-white hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><MessageCircle size={18} /> Réserver sur WhatsApp</a>
        </div>
      </section>
    </div>
  </main>;
}
