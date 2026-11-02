import { motion } from 'motion/react';
import { Building2, Home, Menu, MessageCircle, Phone, Shield, X } from 'lucide-react';
import { useState } from 'react';
import LoginModal, { useAdmin } from './AdminAuth';

const links = [{ label: 'Accueil', href: '#top' }, { label: 'Résidences', href: '#residences' }, { label: 'Pourquoi nous', href: '#about' }, { label: 'Contact', href: '#contact' }];

type NavbarProps = { onHome?: () => void };
export default function Navbar({ onHome }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const closeMenu = () => setIsOpen(false);
  return <>
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[76px] lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Safe Trip, accueil"><img src="/logo.png" alt="Safe Trip" className="h-11 w-11 rounded-xl object-contain" /><span className="font-display text-xl font-extrabold tracking-tight text-slate-950">SAFE<span className="text-accent">TRIP</span></span></a>
        <div className="hidden items-center gap-7 lg:flex">{links.map(link => <a key={link.href} href={link.href} onClick={link.href === '#top' ? (event) => { event.preventDefault(); onHome?.(); } : undefined} className="text-sm font-semibold text-slate-500 transition hover:text-primary">{link.label}</a>)}</div>
        <div className="hidden items-center gap-3 md:flex"><button onClick={() => { if (isAdmin) { window.location.hash = 'admin'; } else { setIsLoginOpen(true); } }} aria-label="Espace administrateur" className={`grid h-10 w-10 place-items-center rounded-full transition ${isAdmin ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}><Shield size={18} /></button><a href="https://wa.me/message/3HKDYS6DBJADK1" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-slate-800"><Phone size={16} /> Réserver</a></div>
        <button onClick={() => setIsOpen(!isOpen)} className="grid h-11 w-11 place-items-center rounded-xl text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:hidden" aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={isOpen}>{isOpen ? <X /> : <Menu />}</button>
      </div>
      {isOpen && <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="border-t border-slate-100 bg-white px-5 py-5 md:hidden"><div className="space-y-1">{links.map(link => <a key={link.href} href={link.href} onClick={(event) => { if (link.href === '#top') { event.preventDefault(); onHome?.(); } closeMenu(); }} className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">{link.label}</a>)}</div><a href="https://wa.me/message/3HKDYS6DBJADK1" target="_blank" rel="noreferrer" onClick={closeMenu} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white"><MessageCircle size={19} /> Écrire sur WhatsApp</a><button onClick={() => { closeMenu(); if (isAdmin) { window.location.hash = 'admin'; } else { setIsLoginOpen(true); } }} className="mt-3 w-full py-2 text-sm font-semibold text-slate-400">Espace administrateur</button></motion.div>}
    </nav>
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-[72px] items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,.10)] backdrop-blur-xl md:hidden"><a href="#top" onClick={(event) => { event.preventDefault(); onHome?.(); }} className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-bold text-primary"><Home size={19} />Accueil</a><a href="#residences" className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-500"><Building2 size={19} />Biens</a><a href="https://wa.me/message/3HKDYS6DBJADK1" target="_blank" rel="noreferrer" className="-mt-8 grid h-14 w-14 place-items-center rounded-full border-4 border-slate-50 bg-green-500 text-white shadow-lg shadow-green-500/30" aria-label="WhatsApp"><MessageCircle size={24} /></a><a href="#about" className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-500"><Shield size={19} />Services</a><a href="#contact" className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-500"><Phone size={19} />Contact</a></nav>
    <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSuccess={() => { window.location.hash = 'admin'; }} />
  </>;
}
