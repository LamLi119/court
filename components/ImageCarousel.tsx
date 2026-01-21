
import React, { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return (
    <div className="w-full h-48 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 italic">
      No images available
    </div>
  );

  return (
    <div className="relative group">
      <div className="relative h-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800">
        <img
          src={images[index]}
          className="w-full h-full object-cover transition-opacity duration-300"
          alt={`Court photo ${index + 1}`}
        />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur flex items-center justify-center shadow-lg transition-all"
            >
              ←
            </button>
            <button 
              onClick={() => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur flex items-center justify-center shadow-lg transition-all"
            >
              →
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 rounded-full backdrop-blur">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-[#13ec5b] w-3' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;
