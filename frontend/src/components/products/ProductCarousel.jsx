import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import logo from '@/assets/logo.png';

const ImageWithRetry = ({ src, alt, isSold }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasRetried, setHasRetried] = useState(false);
  const [error, setError] = useState(false);
  const fallbackImage = logo;

  useEffect(() => {
    setImgSrc(src);
    setHasRetried(false);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!hasRetried) {
      const separator = imgSrc.includes('?') ? '&' : '?';
      setImgSrc(`${imgSrc}${separator}retry=${Date.now()}`);
      setHasRetried(true);
    } else {
      setError(true);
    }
  };

  return (
    <img
      src={error ? fallbackImage : imgSrc}
      alt={alt}
      className={`w-full h-full object-cover transition-transform duration-700 ${isSold ? "grayscale-[0.5]" : "group-hover:scale-105"}`}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
};

const ProductCarousel = ({ images, image, photo, isSold, name, id, updatedAt }) => {
  const swiperRef = useRef(null);
  const fallbackMachineImage = logo;
  
  let displayImages = [];
  
  // 1. Check if singular 'image' exists
  if (typeof image === 'string' && image.trim() !== '' && !image.startsWith('blob:')) {
    displayImages.push(image);
  }
  
  // 2. Check if 'images' array has content
  if (Array.isArray(images) && images.length > 0) {
    const validGallery = images.filter(img => img && typeof img === 'string' && !img.startsWith('blob:'));
    validGallery.forEach(img => {
      if (!displayImages.includes(img)) displayImages.push(img);
    });
  }
  
  // 3. Check if 'photo' field exists (backward compatibility)
  if (displayImages.length === 0 && typeof photo === 'string' && photo.trim() !== '' && !photo.startsWith('blob:')) {
    displayImages.push(photo);
  }
  
  // 4. Global fallback
  if (displayImages.length === 0) {
    displayImages = [fallbackMachineImage];
  }

  const hasMultiple = displayImages.length > 1;

  return (
    <div
      className="relative h-full w-full group/carousel"
      onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
      onMouseLeave={() => swiperRef.current?.autoplay?.start()}
    >
      <Swiper
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{ clickable: true }}
        autoplay={hasMultiple ? {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        loop={hasMultiple}
        className="h-full w-full"
      >
        {displayImages.map((img, index) => (
          <SwiperSlide key={index}>
            <Link to={`/product/${id}`} className="block h-full w-full bg-slate-100 flex items-center justify-center">
              <ImageWithRetry
                src={img}
                alt={`${name || 'Product'} - view ${index + 1}`}
                isSold={isSold}
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {hasMultiple && (
        <>
          <button className="swiper-button-prev-custom absolute left-3 top-1/2 -translate-y-1/2 z-10 w-[42px] h-[42px] rounded-full bg-white/95 shadow-[0_8px_18px_rgba(0,0,0,0.10)] flex items-center justify-center text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-all duration-[350ms] ease-in-out hover:scale-[1.08] disabled:opacity-0 hidden md:flex cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          <button className="swiper-button-next-custom absolute right-3 top-1/2 -translate-y-1/2 z-10 w-[42px] h-[42px] rounded-full bg-white/95 shadow-[0_8px_18px_rgba(0,0,0,0.10)] flex items-center justify-center text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-all duration-[350ms] ease-in-out hover:scale-[1.08] disabled:opacity-0 hidden md:flex cursor-pointer">
            <ChevronRight size={24} />
          </button>
        </>
      )}
      {/* Dark overlay gradient at bottom of image for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-[5]" />
    </div>
  );
};

export default ProductCarousel;
