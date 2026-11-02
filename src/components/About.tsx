import { motion } from 'motion/react';
import { CheckCircle2, Users, Briefcase, Rocket, Mic, Music, Calendar } from 'lucide-react';

export default function About() {
  const points = [
    'Sélection rigoureuse des biens',
    'Service client disponible 24/7',
    'Sécurité et confidentialité garanties',
    'Emplacements stratégiques et prisés'
  ];

  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=2572&auto=format&fit=crop"
                alt="Safe Trip Concierge"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent rounded-[32px] -z-10 hidden md:block"></div>
            <div className="absolute bottom-10 left-10 bg-white p-8 rounded-3xl shadow-xl max-w-[200px]">
              <p className="text-4xl font-display font-extrabold text-primary mb-1">5+</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Ans d'Expérience</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent text-sm font-bold uppercase tracking-widest mb-4 block">Notre Mission</span>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-8 leading-tight">
              Redéfinir le confort de <span className="italic font-serif font-normal text-primary underline underline-offset-8">vos séjours à Abidjan & partout en Côte d'Ivoire</span>
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed font-light">
              Safe Trip est bien plus qu'une agence de location. Nous sommes votre partenaire de confiance en Côte d'Ivoire. Nous sélectionnons méticuleusement chaque résidence pour vous offrir un environnement où luxe, sécurité et sérénité se rencontrent.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {points.map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={16} /></div>
                  <span className="text-sm font-medium text-gray-800">{point}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16" id="avantages">
        <h3 className="text-4xl font-display font-extrabold text-accent mb-10">Nos Avantages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Users size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Gain de temps pour les clients et les propriétaires</h4><p className="text-gray-500">Les utilisateurs n'ont plus à effectuer des recherches longues et incertaines : la structure s'occupe de tout.</p></div></div></div>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Briefcase size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Accessibilité pour tous les budgets</h4><p className="text-gray-500">Proposer des hébergements variés à partir de 15 000 F permet d'attirer un large public, du voyageur économique au client haut de gamme.</p></div></div></div>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Rocket size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Sécurisation des locations</h4><p className="text-gray-500">L'activité protège les voyageurs contre les arnaques, fréquentes dans le secteur de la location immobilière informelle.</p></div></div></div>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Mic size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Contribution au développement touristique</h4><p className="text-gray-500">En facilitant l'accès à des résidences fiables, l'activité participe à la promotion du tourisme local et à l'image positive du pays.</p></div></div></div>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Music size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Soutien aux propriétaires locaux</h4><p className="text-gray-500">Les propriétaires bénéficient d'une plateforme pour valoriser leurs biens et accroître leur visibilité.</p></div></div></div>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm"><div className="flex gap-4 items-start"><div className="p-3 rounded-full bg-accent/10 text-accent"><Calendar size={28} /></div><div><h4 className="text-lg font-bold text-primary mb-2">Accompagnement personnalisé et rassurant</h4><p className="text-gray-500">Le service prend en compte les critères spécifiques de chaque client, offrant une expérience sur mesure et sécurisée.</p></div></div></div>
        </div>
      </div>
    </section>
  );
}
