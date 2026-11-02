import React from 'react';
import { motion } from 'motion/react';
import { Bath, Bed, ChevronRight, Heart, MapPin, Pencil, Tag, Trash2 } from 'lucide-react';
import type { Residence } from '../lib/residenceService';

type Props = {
  residence: Residence;
  isAdmin?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id?: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (residence: Residence) => void;
  onSelect?: (residence: Residence) => void;
};

const number = (value: string) => Number(value.replace(/\D/g, ''));

const ResidenceCard: React.FC<Props> = ({ residence, isAdmin, isFavorite, onToggleFavorite, onDelete, onEdit, onSelect }) => {
  const discount = residence.originalPrice && number(residence.originalPrice) > number(residence.price)
    ? Math.round((1 - number(residence.price) / number(residence.originalPrice)) * 100)
    : 0;

  return (
    <motion.article initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} onClick={() => onSelect?.(residence)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/10">
      <div className="relative aspect-[.95/1] overflow-hidden sm:aspect-[1.38/1]">
        <img src={residence.imageUrl || residence.images?.[0] || ''} alt={residence.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
        {discount > 0 && <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[9px] font-black text-white shadow"><Tag size={11} /> -{discount}%</span>}
        <div className="absolute left-2.5 top-2.5 flex max-w-[60%] flex-wrap gap-1">{residence.tags.slice(0, 1).map(tag => <span key={tag} className="rounded-full bg-white/95 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-primary shadow-sm">{tag}</span>)}</div>
        <button aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={!!isFavorite} onClick={event => { event.stopPropagation(); onToggleFavorite?.(residence.id); }} className={`absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full shadow transition ${isFavorite ? 'bg-pink-600 text-white' : 'bg-white/95 text-slate-600 hover:text-pink-600'}`}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        {isAdmin && residence.id && <div className="absolute right-2.5 top-10 flex gap-1.5"><button onClick={event => { event.stopPropagation(); onEdit?.(residence); }} className="grid h-8 w-8 place-items-center rounded-full bg-white text-primary shadow" title="Modifier"><Pencil size={13} /></button><button onClick={event => { event.stopPropagation(); onDelete?.(residence.id!); }} className="grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white shadow" title="Supprimer"><Trash2 size={13} /></button></div>}
      </div>
      <div className="p-3.5 sm:p-6">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="flex items-center gap-1 truncate text-[9px] font-bold uppercase tracking-wider text-slate-400"><MapPin size={12} className="shrink-0 text-accent" />{residence.location}</p><h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-extrabold leading-tight text-slate-900 sm:text-xl">{residence.title}</h3></div><ChevronRight className="hidden shrink-0 sm:block" size={18} /></div>
        <div className="mt-3 flex gap-2 border-y border-slate-100 py-2.5 text-[11px] font-semibold text-slate-600"><span className="flex items-center gap-1"><Bed size={14} />{residence.beds} ch.</span><span className="flex items-center gap-1"><Bath size={14} />{residence.baths} sdb</span></div>
        <div className="mt-3 flex items-end justify-between"><div>{discount > 0 && <p className="text-[10px] text-slate-400 line-through">{residence.originalPrice} FCFA</p>}<p className="font-display text-[15px] font-extrabold text-primary sm:text-xl">{residence.price} <span className="text-[9px] font-semibold sm:text-xs">FCFA / nuit</span></p></div><span className="text-[10px] font-bold text-accent">Détails</span></div>
      </div>
    </motion.article>
  );
};

export default ResidenceCard;
