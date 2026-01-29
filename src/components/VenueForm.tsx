import React, { useState, useRef, useEffect } from 'react';
import { Venue, Language } from '../../types.ts';

declare var google: any;

interface VenueFormProps {
    venue: Venue | null;
    onSave: (v: any) => Promise<void>;
    onCancel: () => void;
    onDelete?: (id: number) => void;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
}

const VenueForm: React.FC<VenueFormProps> = ({ venue, onSave, onCancel, onDelete, t, darkMode, language }) => {
    const [formData, setFormData] = useState<any>(venue || {
        name: '',
        description: '',
        mtrStation: '',
        mtrExit: '',
        walkingDistance: 0,
        address: '',
        ceilingHeight: 0,
        startingPrice: 0,
        pricing: { type: 'text', content: '', imageUrl: '' },
        images: [],
        amenities: [],
        whatsapp: '',
        coordinates: { lat: 22.3193, lng: 114.1694 }
    });

    const [placesApiError, setPlacesApiError] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pricingImageRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);

    useEffect(() => {
        if (!addressInputRef.current) return;

        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn("Places API not available. Autocomplete disabled.");
            setPlacesApiError(true);
            return;
        }

        try {
            autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
                componentRestrictions: { country: "hk" },
                fields: ["geometry", "formatted_address"],
                types: ["establishment", "geocode"]
            });

            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                const latLng = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };

                setFormData((prev: any) => ({
                    ...prev,
                    address: place.formatted_address,
                    coordinates: latLng
                }));
            });
        } catch (err) {
            console.error("Failed to initialize Autocomplete:", err);
            setPlacesApiError(true);
        }
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        setIsUploading(true);
        setSaveError(null);
        try {
            const uploadPromises = files.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file as Blob);
                });
            });

            const results = await Promise.all(uploadPromises);
            setFormData((prev: any) => ({
                ...prev,
                images: [...prev.images, ...results].slice(0, 12)
            }));
        } catch (err) {
            console.error("Upload failed", err);
            setSaveError("Failed to upload photos.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePricingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setSaveError(null);
        try {
            const result = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file as Blob);
            });

            setFormData((prev: any) => ({
                ...prev,
                pricing: { ...prev.pricing, imageUrl: result, type: 'image' }
            }));
        } catch (err) {
            console.error("Pricing upload failed", err);
            setSaveError("Failed to upload pricing image.");
        } finally {
            setIsUploading(false);
            if (pricingImageRef.current) pricingImageRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading || isSaving) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(formData);
        } catch (err: any) {
            setSaveError(err.message || "An unexpected error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!venue) return;
        onDelete?.(venue.id);
    };

    const labelClass = `block mb-1 text-[12px] font-[900] uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const inputClass = `w-full px-4 py-3 border rounded-[12px] focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`;

    return (
        <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-form-title"
            className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-0 md:p-4"
        >
            <div className={`w-full max-w-4xl h-full md:h-[90vh] flex flex-col shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} md:rounded-[16px] animate-in zoom-in duration-300 overflow-hidden`}>
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-inherit">
                    <h2 id="venue-form-title" className="text-[24px] font-[900]">Court Management</h2>
                    <button onClick={onCancel} className="text-3xl font-light hover:opacity-50 transition-opacity" aria-label="Close form">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {saveError && (
                        <div className="animate-in slide-in-from-top-4 duration-300 p-4 bg-red-500 rounded-[12px] flex items-start gap-3 shadow-lg shadow-red-500/20">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                                <h4 className="text-white font-[900] text-[12px] uppercase tracking-widest mb-1">Save Failed</h4>
                                <p className="text-white text-[12px] font-[700] leading-relaxed">{saveError}</p>
                            </div>
                            <button onClick={() => setSaveError(null)} className="text-white/60 hover:text-white font-[900] text-xl">×</button>
                        </div>
                    )}

                    <div className="relative">
                        <label className={labelClass}>
                            {language === 'en' ? 'Full Address *' : '詳細地址 *'} 
                        </label>
                        <input 
                            type="text"
                            ref={addressInputRef}
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                            className={inputClass} 
                            required 
                            placeholder="Start typing building or street name..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Court Name *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>MTR Station</label>
                                <input type="text" value={formData.mtrStation} onChange={e => setFormData({...formData, mtrStation: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>MTR Exit</label>
                                <input type="text" value={formData.mtrExit} onChange={e => setFormData({...formData, mtrExit: e.target.value})} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Walking (min)</label><input type="number" value={formData.walkingDistance} onChange={e => setFormData({...formData, walkingDistance: parseInt(e.target.value)})} className={inputClass} /></div>
                        <div><label className={labelClass}>Starting Price *</label><input type="number" value={formData.startingPrice} onChange={e => setFormData({...formData, startingPrice: parseInt(e.target.value)})} className={inputClass} required /></div>
                        <div><label className={labelClass}>Ceiling (m)</label><input type="number" step="0.1" value={formData.ceilingHeight} onChange={e => setFormData({...formData, ceilingHeight: parseFloat(e.target.value)})} className={inputClass} /></div>
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`${inputClass} h-24`} placeholder="Describe the court highlights..." />
                    </div>

                    <div><label className={labelClass}>WhatsApp Number *</label><input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className={inputClass} required /></div>

                    <div className="space-y-4">
                        <label className={labelClass}>Photos (Max 12)</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {formData.images.map((img: string, i: number) => (
                                <div key={i} className="relative aspect-square rounded-[12px] overflow-hidden border dark:border-gray-600">
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_:any, idx:number) => idx !== i)})} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                </div>
                            ))}
                            {isUploading && (
                                <div className="aspect-square rounded-[12px] border-2 border-dashed border-[#007a67] flex items-center justify-center bg-[#007a67]/5">
                                    <div className="w-6 h-6 border-2 border-[#007a67]/20 border-l-[#007a67] rounded-full animate-spin"></div>
                                </div>
                            )}
                            {formData.images.length < 12 && !isUploading && (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-[12px] border-2 border-dashed flex items-center justify-center text-gray-400 hover:border-[#007a67] hover:text-[#007a67] transition-all bg-gray-50 dark:bg-gray-700/30">
                                    <span className="text-2xl">+</span>
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className="space-y-4">
                        <label className={labelClass}>Pricing Info</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-[8px] text-[10px] font-[900]">
                            <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, type: 'text'}})} className={`px-3 py-1 rounded-[6px] ${formData.pricing.type === 'text' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'}`}>TEXT</button>
                            <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, type: 'image'}})} className={`px-3 py-1 rounded-[6px] ${formData.pricing.type === 'image' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'}`}>IMAGE</button>
                        </div>
                        {formData.pricing.type === 'text' ? (
                            <textarea value={formData.pricing.content} onChange={e => setFormData({...formData, pricing: {...formData.pricing, content: e.target.value}})} className={`${inputClass} h-24`} />
                        ) : (
                            <div className="relative h-40 border-2 border-dashed rounded-[12px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
                                {formData.pricing.imageUrl ? (
                                    <>
                                        <img src={formData.pricing.imageUrl} className="h-full w-full object-contain" alt="" />
                                        <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, imageUrl: ''}})} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full">×</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => pricingImageRef.current?.click()} className="text-xs font-bold text-gray-400">Upload Pricing Image</button>
                                )}
                                <input type="file" ref={pricingImageRef} className="hidden" accept="image/*" onChange={handlePricingImageUpload} />
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t dark:border-gray-700 flex gap-4 bg-white dark:bg-gray-800 md:rounded-b-[16px]">
                    <button 
                        type="submit" 
                        onClick={handleSubmit} 
                        disabled={isUploading || isSaving}
                        className={`flex-1 px-6 py-4 rounded-[8px] font-[900] text-lg shadow-xl active:scale-95 transition-all uppercase flex items-center justify-center gap-3 ${isUploading || isSaving ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-[#007a67] text-white hover:brightness-105'}`}
                    >
                        {(isUploading || isSaving) && <div className="w-5 h-5 border-3 border-white/20 border-l-white rounded-full animate-spin"></div>}
                        {isSaving ? 'Saving...' : 'Save Court'}
                    </button>
                    {venue && !isSaving && (
                        <button type="button" onClick={handleDelete} className="px-6 py-4 bg-red-500 text-white rounded-[8px] font-[900] active:scale-95 transition-all">DELETE</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueForm;