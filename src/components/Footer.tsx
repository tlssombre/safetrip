import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
         

          

          

          <div>
            <h4 className="text-lg font-bold mb-6">Contact</h4>
            <ul className="space-y-6 text-gray-400 text-sm">
              <li className="flex gap-3">
                <MapPin size={20} className="text-accent shrink-0" />
                <span>Cocody,Abidjan, Côte d’Ivoire</span>
              </li>
              <li className="flex gap-3">
                <Phone size={20} className="text-accent shrink-0" />
                <a href="tel:+2250501914649" className="hover:text-white transition-colors">+225 0501914649</a>
              </li>
              <li className="flex gap-3">
                <Mail size={20} className="text-accent shrink-0" />
                <span> Mariemicheleeffi222@gmail.com</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Liens Rapides</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Accueil</a></li>
              <li><a href="#residences" className="hover:text-white transition-colors">Résidences</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">À Propos</a></li>
              <li><a href="#avantages" className="hover:text-white transition-colors">Avantages</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Services Événementiels</a></li>
            </ul>
          </div>
          <div>
            
          </div>
           <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <img
                src="/safetrip-logo.png"
                alt="Safe Trip"
                className="w-16 h-16  object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-3xl font-display font-bold tracking-tight text-white">
                SAFE<span className="text-accent italic">TRIP</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Votre agence de référence pour des séjours d'exception et des résidences de prestige en Côte d'Ivoire. Confort, Sécurité, Elégance.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/profile.php?id=61574046737190" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-all">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/safe_tripinst/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:row justify-between items-center gap-4 text-xs tracking-widest text-gray-500 uppercase font-semibold">
          <p>© 2026 SAFE TRIP CI. TOUS DROITS RÉSERVÉS.</p>
          
        </div>
      </div>
    </footer>
  );
}
