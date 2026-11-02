import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Image as ImageIcon, MapPin, DollarSign, Bed, Bath, Star, MessageSquare, Home, Upload, Link as LinkIcon, AlertCircle, CalendarDays } from 'lucide-react';
import { addResidence, updateResidence, Residence } from '../lib/residenceService';
import { addTestimonial, updateTestimonial, Testimonial } from '../lib/testimonialService';
import { motion, AnimatePresence } from 'motion/react';
import { ResidencesTable, TestimonialsTable } from './AdminContentTables';

function compressAndResizeImage(file: File, maxWidth = 1000, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        if (!canvas || typeof canvas.getContext !== 'function') {
          resolve(event.target?.result as string);
          return;
        }
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface AdminPanelProps {
  onUpdate: () => void;
  editingResidence: Residence | null;
  editingTestimonial: Testimonial | null;
  onCancelEdit: () => void;
  residences: Residence[];
  testimonials: Testimonial[];
  onEditResidence: (residence: Residence) => void;
  onDeleteResidence: (id: string) => void;
  onEditTestimonial: (testimonial: Testimonial) => void;
  onDeleteTestimonial: (id: string) => void;
}

export default function AdminPanel({
  onUpdate,
  editingResidence,
  editingTestimonial,
  onCancelEdit,
  residences,
  testimonials,
  onEditResidence,
  onDeleteResidence,
  onEditTestimonial,
  onDeleteTestimonial,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'residences' | 'testimonials'>('residences');
  const [isAdding, setIsAdding] = useState(false);
  
  const [residenceData, setResidenceData] = useState<{
    title: string;
    location: string;
    price: string;
    originalPrice: string;
    beds: number;
    baths: number;
    imageUrl: string;
    images: string[];
    tags: string;
    blockedDates: string[];
  }>({
    title: '',
    location: '',
    price: '',
    originalPrice: '',
    beds: 1,
    baths: 1,
    imageUrl: '',
    images: [],
    tags: '',
    blockedDates: []
  });

  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');

  const [testimonialData, setTestimonialData] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5
  });
  const [confirmationState, setConfirmationState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });

  useEffect(() => {
    if (editingResidence) {
      setActiveTab('residences');
      const editingImages = editingResidence.images || (editingResidence.imageUrl ? [editingResidence.imageUrl] : []);
      setResidenceData({
        title: editingResidence.title,
        location: editingResidence.location,
        price: editingResidence.price,
        originalPrice: editingResidence.originalPrice || '',
        beds: editingResidence.beds,
        baths: editingResidence.baths,
        imageUrl: editingResidence.imageUrl,
        images: editingImages,
        tags: editingResidence.tags.join(', '),
        blockedDates: editingResidence.blockedDates || []
      });
      // If editing has a data URL or simple url, default mode appropriately
      setImageInputMethod(editingResidence.imageUrl.startsWith('data:') ? 'upload' : 'url');
      setIsAdding(true);
    }
  }, [editingResidence]);

  useEffect(() => {
    if (editingTestimonial) {
      setActiveTab('testimonials');
      setTestimonialData({
        name: editingTestimonial.name,
        role: editingTestimonial.role,
        text: editingTestimonial.text,
        rating: editingTestimonial.rating
      });
      setIsAdding(true);
    }
  }, [editingTestimonial]);

  const handleClose = () => {
    setIsAdding(false);
    onCancelEdit();
    setResidenceData({
      title: '',
      location: '',
      price: '',
      originalPrice: '',
      beds: 1,
      baths: 1,
      imageUrl: '',
      images: [],
      tags: '',
      blockedDates: []
    });
    setTestimonialData({
      name: '',
      role: '',
      text: '',
      rating: 5
    });
    setTempImageUrl('');
    setUploadError(null);
  };

  const addImageToList = (urlOrBase64: string) => {
    if (residenceData.images.length >= 6) {
      setUploadError("Vous pouvez ajouter au maximum 6 images.");
      return;
    }
    setResidenceData(prev => {
      const updatedImages = [...prev.images, urlOrBase64];
      return {
        ...prev,
        images: updatedImages,
        imageUrl: prev.imageUrl || urlOrBase64
      };
    });
    setUploadError(null);
  };

  const processAndSetImage = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error("Veuillez sélectionner un fichier image valide.");
      }
      if (residenceData.images.length >= 6) {
        throw new Error("Vous pouvez ajouter au maximum 6 images.");
      }
      const compressedBase64 = await compressAndResizeImage(file);
      addImageToList(compressedBase64);
    } catch (err: any) {
      setUploadError(err.message || "Erreur lors de la compression de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndSetImage(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleResidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (residenceData.images.length === 0) {
      setUploadError("Veuillez ajouter au moins une image (maximum 4).");
      return;
    }
    const cleanTags = residenceData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
    const submissionImageUrl = residenceData.images[0] || '';
    try {
      if (editingResidence?.id) {
        await updateResidence(editingResidence.id, {
          title: residenceData.title,
          location: residenceData.location,
          price: residenceData.price,
          originalPrice: residenceData.originalPrice,
          beds: residenceData.beds,
          baths: residenceData.baths,
          imageUrl: submissionImageUrl,
          images: residenceData.images,
          tags: cleanTags,
          blockedDates: residenceData.blockedDates
        });
      } else {
        await addResidence({
          title: residenceData.title,
          location: residenceData.location,
          price: residenceData.price,
          originalPrice: residenceData.originalPrice,
          beds: residenceData.beds,
          baths: residenceData.baths,
          imageUrl: submissionImageUrl,
          images: residenceData.images,
          tags: cleanTags,
          blockedDates: residenceData.blockedDates
        });
      }
      handleClose();
      onUpdate();
      setConfirmationState({ open: true, message: 'Résidence enregistrée avec succès.' });
    } catch (error) {
      console.error('[AdminPanel] Error saving residence', error);
      alert("Erreur lors de l'enregistrement de la résidence. Vérifiez la console pour plus d'infos.");
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestimonial?.id) {
        await updateTestimonial(editingTestimonial.id, {
          name: testimonialData.name,
          role: testimonialData.role,
          text: testimonialData.text,
          rating: testimonialData.rating
        });
      } else {
        await addTestimonial({
          name: testimonialData.name,
          role: testimonialData.role,
          text: testimonialData.text,
          rating: testimonialData.rating
        });
      }
      handleClose();
      onUpdate();
      setConfirmationState({ open: true, message: 'Avis enregistré avec succès.' });
    } catch (error) {
      console.error('[AdminPanel] Error saving testimonial', error);
      alert("Erreur lors de l'enregistrement de l'avis. Vérifiez la console pour plus d'infos.");
    }
  };

  return (
    <div className="mb-12">
      <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setActiveTab('residences')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'residences' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={18} />
            Résidences
          </button>
          <button 
            onClick={() => setActiveTab('testimonials')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'testimonials' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare size={18} />
            Avis Clients
          </button>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-xl shadow-primary/10"
        >
          <Plus size={20} />
          {activeTab === 'residences' ? 'Nouvelle Résidence' : 'Nouvel Avis'}
        </button>
      </div>

      {activeTab === 'residences' ? (
        <ResidencesTable residences={residences} onEdit={onEditResidence} onDelete={onDeleteResidence} />
      ) : (
        <TestimonialsTable testimonials={testimonials} onEdit={onEditTestimonial} onDelete={onDeleteTestimonial} />
      )}

      <AnimatePresence>
        {confirmationState.open && (
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
              onClick={() => setConfirmationState({ open: false, message: '' })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Plus size={24} />
              </div>
              <h3 className="text-xl font-display font-black text-gray-900 mb-2">Enregistré</h3>
              <p className="text-sm text-gray-600 mb-6">{confirmationState.message}</p>
              <button
                onClick={() => setConfirmationState({ open: false, message: '' })}
                className="w-full bg-primary text-white py-3 rounded-2xl font-bold hover:bg-primary/95 transition-all"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}

        {isAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={handleClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900" aria-label="Fermer le panneau" title="Fermer">
                <X size={24} />
              </button>

              <h2 className="text-3xl font-display font-extrabold mb-8">
                {editingResidence ? 'Modifier la Résidence' : editingTestimonial ? 'Modifier l\'Avis' : activeTab === 'residences' ? 'Ajouter une Résidence' : 'Ajouter un Avis Client'}
              </h2>

              {activeTab === 'residences' ? (
                <form onSubmit={handleResidenceSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Nom du bien</label>
                      <input 
                        required
                        type="text" 
                        value={residenceData.title}
                        aria-label="Nom du bien"
                        title="Nom du bien"
                        onChange={e => setResidenceData({...residenceData, title: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        placeholder="Ex: Villa Horizon"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Localisation</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          required
                          type="text" 
                          value={residenceData.location}
                          aria-label="Localisation"
                          title="Localisation"
                          onChange={e => setResidenceData({...residenceData, location: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                          placeholder="Ex: Cocody Angré"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Prix par nuit (FCFA)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary">FCFA</span>
                      <input 
                        required
                        type="text" 
                        value={residenceData.price}
                        onChange={e => setResidenceData({...residenceData, price: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        placeholder="Ex: 120 000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Ancien prix (FCFA, optionnel)</label>
                    <input type="text" value={residenceData.originalPrice} onChange={e => setResidenceData({...residenceData, originalPrice: e.target.value})} className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium outline-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Ex: 150 000" />
                    {residenceData.originalPrice && residenceData.price && <p className="text-xs font-bold text-green-600">Réduction : {Math.max(0, Math.round((1 - Number(residenceData.price.replace(/\D/g, '')) / Number(residenceData.originalPrice.replace(/\D/g, ''))) * 100))}%</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400"><CalendarDays size={15} /> Dates indisponibles</label>
                    <div className="flex gap-2"><input type="date" onChange={e => { if (e.target.value && !residenceData.blockedDates.includes(e.target.value)) setResidenceData({...residenceData, blockedDates: [...residenceData.blockedDates, e.target.value]}); e.currentTarget.value = ''; }} className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm" /><span className="rounded-2xl bg-gray-100 px-4 py-3 text-xs font-bold text-gray-500">Ajouter</span></div>
                    {residenceData.blockedDates.length > 0 && <div className="flex flex-wrap gap-2">{residenceData.blockedDates.map(date => <button type="button" key={date} onClick={() => setResidenceData({...residenceData, blockedDates: residenceData.blockedDates.filter(value => value !== date)})} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">{date} ×</button>)}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Chambres</label>
                      <input 
                        type="number" 
                        value={residenceData.beds}
                        onChange={e => setResidenceData({...residenceData, beds: parseInt(e.target.value) || 0})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Douches</label>
                      <input 
                        type="number" 
                        value={residenceData.baths}
                        onChange={e => setResidenceData({...residenceData, baths: parseInt(e.target.value) || 0})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">
                          Images de la résidence ({residenceData.images.length}/6)
                        </label>
                        <span className="text-[10px] text-gray-400 block mt-0.5">La première image sera l'affichage principal</span>
                      </div>
                      
                      {residenceData.images.length < 4 && (
                        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setImageInputMethod('upload');
                              setUploadError(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${imageInputMethod === 'upload' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                          >
                            <Upload size={12} />
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageInputMethod('url');
                              setUploadError(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${imageInputMethod === 'url' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                          >
                            <LinkIcon size={12} />
                            Lien URL
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Previews Grid */}
                    {residenceData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                        {residenceData.images.map((img, i) => (
                          <div key={i} className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-square group shadow-sm">
                            <img 
                              src={img} 
                              alt={`Aperçu ${i + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                Image {i + 1}
                              </span>
                              {i === 0 && (
                                <span className="bg-primary hover:bg-primary/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-center">
                                  Principale
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setResidenceData(prev => {
                                  const updated = prev.images.filter((_, idx) => idx !== i);
                                  return {
                                    ...prev,
                                    images: updated,
                                    imageUrl: updated[0] || ''
                                  };
                                });
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-xl transition-all shadow-md"
                              title="Supprimer cette image"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {residenceData.images.length >= 6 ? (
                      <div className="border border-green-100 bg-green-50/50 rounded-2xl p-4 text-center">
                        <p className="text-xs text-green-700 font-bold">✓ Maximum de 6 images atteint ({residenceData.images.length}/6)</p>
                        <p className="text-[10px] text-green-600 mt-1">Vous pouvez supprimer l'une d'elles pour en ajouter une nouvelle.</p>
                      </div>
                    ) : (
                      imageInputMethod === 'upload' ? (
                        <div>
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all relative ${
                              dragActive 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                            }`}
                          >
                            <input
                              type="file"
                              id="residence-image-upload"
                              aria-label="Ajouter une image"
                              title="Ajouter une image"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              disabled={isUploading}
                            />
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-bold text-gray-500">Traitement de l'image...</p>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                  <Upload size={20} />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-gray-700">Sélectionnez ou glissez l'image {residenceData.images.length + 1}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Sera ajoutée à la galerie (jusqu'à 6)</p>
                                </div>
                              </>
                            )}
                          </div>
                          {uploadError && (
                            <div className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100">
                              <AlertCircle size={14} />
                              {uploadError}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input 
                                type="url" 
                                value={tempImageUrl}
                                onChange={e => { setTempImageUrl(e.target.value); setUploadError(null); }}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm"
                                placeholder="Coller l'URL d'une image (ex: Unsplash)"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!tempImageUrl.trim()) return;
                                if (!tempImageUrl.startsWith('http://') && !tempImageUrl.startsWith('https://')) {
                                  setUploadError("Veuillez saisir une URL valide commençant par http:// ou https://");
                                  return;
                                }
                                addImageToList(tempImageUrl.trim());
                                setTempImageUrl('');
                              }}
                              className="bg-primary hover:bg-primary/95 text-white font-bold px-5 text-sm rounded-2xl transition-all"
                            >
                              Ajouter
                            </button>
                          </div>
                          {uploadError && (
                            <div className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100">
                              <AlertCircle size={14} />
                              {uploadError}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tags (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      value={residenceData.tags}
                      onChange={e => setResidenceData({...residenceData, tags: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                      placeholder="Wifi, Piscine, Parking..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary/95 transition-all shadow-xl shadow-primary/20"
                  >
                    {editingResidence ? 'Enregistrer les Modifications' : 'Ajouter au Catalogue'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Nom du Client</label>
                      <input 
                        required
                        type="text" 
                        value={testimonialData.name}
                        onChange={e => setTestimonialData({...testimonialData, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        placeholder="Ex: Jean Kouadio"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Rôle (Titre)</label>
                      <input 
                        required
                        type="text" 
                        value={testimonialData.role}
                        onChange={e => setTestimonialData({...testimonialData, role: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        placeholder="Ex: Client d'affaires"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Note (1-5)</label>
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button 
                          key={n}
                          type="button"
                          onClick={() => setTestimonialData({...testimonialData, rating: n})}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${testimonialData.rating >= n ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                          <Star size={20} fill={testimonialData.rating >= n ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Témoignage</label>
                    <textarea 
                      required
                      value={testimonialData.text}
                      onChange={e => setTestimonialData({...testimonialData, text: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 min-h-[150px] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                      placeholder="Partagez l'expérience du client..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary/95 transition-all shadow-xl shadow-primary/20"
                  >
                    {editingTestimonial ? 'Enregistrer les Modifications' : 'Ajouter le Témoignage'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
