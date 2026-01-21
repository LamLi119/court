
import React, { useState, useRef, useEffect } from 'react';
import { Venue, Language } from '../types';

declare var google: any;

interface VenueFormProps {
    venue: Venue | null;
    onSave: (v: any) => void;
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pricingImageRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);

    useEffect(() => {
        if (!addressInputRef.current) return;

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
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({
                    ...prev,
                    images: [...prev.images, reader.result as string].slice(0, 12)
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePricingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({
                    ...prev,
                    pricing: { ...prev.pricing, imageUrl: reader.result as string, type: 'image' }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleDelete = () => {
        if (!venue) return;
        // Pass to parent to handle the high-level custom popup
        onDelete?.(venue.id);
    };

    const labelClass = `block mb-1 text-xs font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const inputClass = `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00e911] focus:outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`;

    return (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-0 md:p-4">
            <div className={`w-full max-w-4xl h-full md:h-[90vh] flex flex-col shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} md:rounded-3xl animate-in zoom-in duration-300`}>
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-black">Court Management</h2>
                    <button onClick={onCancel} className="text-3xl font-light hover:opacity-50 transition-opacity">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="relative">
                        <label className={labelClass}>Full Address * (Search to pin location)</label>
                        <input 
                            type="text"
                            ref={addressInputRef}
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                            className={inputClass} 
                            required 
                            placeholder="Start typing building or street name..."
                        />
                        <div className="mt-2 flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold opacity-40 uppercase">GPS Sync: {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}</span>
                        </div>
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
                                <input type="text" value={formData.mtrExit} onChange={e => setFormData({...formData, mtrExit: e.target.value})} className={inputClass} placeholder="e.g. A1" />
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
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border dark:border-gray-600">
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_:any, idx:number) => idx !== i)})} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                </div>
                            ))}
                            {formData.images.length < 12 && (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-gray-400 hover:border-[#00e911] hover:text-[#00e911] transition-all bg-gray-50 dark:bg-gray-700/30">
                                    <span className="text-2xl">+</span>
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className={labelClass}>Pricing Info</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg text-[10px] font-black">
                                <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, type: 'text'}})} className={`px-3 py-1 rounded ${formData.pricing.type === 'text' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'}`}>TEXT</button>
                                <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, type: 'image'}})} className={`px-3 py-1 rounded ${formData.pricing.type === 'image' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'}`}>IMAGE</button>
                            </div>
                        </div>
                        {formData.pricing.type === 'text' ? (
                            <textarea value={formData.pricing.content} onChange={e => setFormData({...formData, pricing: {...formData.pricing, content: e.target.value}})} className={`${inputClass} h-24`} />
                        ) : (
                            <div className="relative h-40 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
                                {formData.pricing.imageUrl ? (
                                    <>
                                        <img src={formData.pricing.imageUrl} className="h-full w-full object-contain" alt="" />
                                        <button type="button" onClick={() => setFormData({...formData, pricing: {...formData.pricing, imageUrl: ''}})} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg">×</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => pricingImageRef.current?.click()} className="text-xs font-bold text-gray-400">Upload Price Chart</button>
                                )}
                                <input type="file" ref={pricingImageRef} className="hidden" accept="image/*" onChange={handlePricingImageUpload} />
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t dark:border-gray-700 flex gap-4 bg-white dark:bg-gray-800 md:rounded-b-3xl">
                    <button type="submit" onClick={handleSubmit} className="flex-1 px-6 py-4 bg-[#00e911] text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all uppercase">Save Court</button>
                    {venue && (
                        <button type="button" onClick={handleDelete} className="px-6 py-4 bg-red-500 text-white rounded-2xl font-black active:scale-95 transition-all">DELETE</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueForm;
