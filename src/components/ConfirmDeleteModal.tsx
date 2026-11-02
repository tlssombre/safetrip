import { AnimatePresence, motion } from 'motion/react';
import { Trash2, X } from 'lucide-react';

type Props = {
  label: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({ label, onCancel, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
          >
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"
              aria-label="Fermer"
              title="Fermer"
            >
              <X size={20} />
            </button>
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Supprimer {label} ?</h3>
            <p className="text-sm text-gray-600 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold hover:bg-red-600 transition-all"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
