import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';

export default function Hero() {
  return <section id="top" className="relative isolate overflow-hidden bg-slate-950 pb-14 pt-28 text-white lg:min-h-[760px] lg:pt-36">
    <div className="absolute inset-0 -z-20"><img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=85&w=2671&auto=format&fit=crop" alt="Résidence Safe Trip" className="h-full w-full object-cover opacity-55" referrerPolicy="no-referrer" /></div>
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/25" />
    <div className="mx-auto grid max-w-7xl items-end gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide backdrop-blur"><ShieldCheck size={16} className="text-blue-300" /> RÉSIDENCES VÉRIFIÉES À ABIDJAN</div>
        <h1 className="font-display text-5xl font-extrabold leading-[.98] tracking-tight sm:text-6xl lg:text-7xl">Votre séjour, <span className="font-serif font-normal italic text-blue-300">sans compromis.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">Des appartements, studios et villas sélectionnés avec soin. Consultez, choisissez, puis réservez simplement par WhatsApp.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#residences" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-slate-950 transition hover:bg-blue-50">Explorer les résidences <ArrowRight size={19} /></a><a href="https://wa.me/message/3HKDYS6DBJADK1" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-white/25 px-6 py-4 font-bold transition hover:bg-white/10">Parler à un conseiller</a></div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-blue-300" /> Sans création de compte</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-blue-300" /> Réponse WhatsApp rapide</span></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .65 }} className="hidden rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl lg:block"><div className="rounded-2xl bg-white p-5 text-slate-900"><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Trouver votre séjour</p><p className="mt-2 font-display text-2xl font-extrabold">À Abidjan, en quelques instants.</p><div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600"><MapPin size={19} className="text-accent" /> Cocody, Marcory, Plateau…</div><a href="#residences" className="mt-3 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white">Voir le catalogue</a></div></motion.div>
    </div>
  </section>;
}
