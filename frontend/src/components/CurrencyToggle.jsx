import React from 'react';
import { motion } from 'framer-motion';
import { useCurrency, currencies } from '@/context/CurrencyContext';

const CurrencyToggle = ({ variant = 'default' }) => {
  const { currency, setCurrency } = useCurrency();

  const isCompact = variant === 'compact';
  const isSpacious = variant === 'spacious';
  const isOrange = variant === 'orange';

  if (isOrange) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-3 h-[52px] rounded-2xl shadow-lg border border-orange-300/20 relative shrink-0">
        {currencies.map((curr) => {
          const isActive = currency.code === curr.code;
          return (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr)}
              className={`
                relative z-10 min-w-[54px] px-3 h-[38px] flex items-center justify-center gap-1.5 rounded-xl transition-all duration-300
                text-[12px] font-bold tracking-tight
                ${isActive ? 'text-orange-600' : 'text-white/75 hover:text-white'}
              `}
            >
              <span className="text-[14px] leading-none">{curr.flag}</span>
              <span>{curr.code === 'INR' ? '₹ INR' : curr.code}</span>
              
              {isActive && (
                <motion.div
                  layoutId={`activeCurrency-${variant}`}
                  className="absolute inset-0 bg-white rounded-xl -z-10 shadow-md"
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (isSpacious) {
    return (
      <div className="flex items-center gap-3 md:gap-4 bg-white px-3 h-[48px] rounded-[14px] border border-slate-200 shadow-sm relative shrink-0">
        {currencies.map((curr) => {
          const isActive = currency.code === curr.code;
          return (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr)}
              className={`
                relative z-10 min-w-[58px] px-3 h-[40px] flex items-center justify-center gap-2 rounded-[10px] transition-all duration-300
                text-[13px] font-bold tracking-wide
                ${isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              <span className="text-[16px] leading-none">{curr.flag}</span>
              <span>{curr.code === 'INR' ? '₹ INR' : curr.code}</span>
              
              {isActive && (
                <motion.div
                  layoutId={`activeCurrency-${variant}`}
                  className="absolute inset-0 bg-primary rounded-[10px] -z-10 shadow-md"
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full border border-slate-200/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] relative w-fit mx-auto lg:mx-0">
      {currencies.map((curr) => {
        const isActive = currency.code === curr.code;
        return (
          <button
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className={`
              relative z-10 w-[64px] h-[38px] flex items-center justify-center gap-1.5 rounded-full transition-all duration-500
              uppercase tracking-tight font-black text-[11px]
              ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900'}
            `}
          >
            <span className="text-sm leading-none opacity-90">{curr.flag}</span>
            <span>{curr.code}</span>
            
            {isActive && (
              <motion.div
                layoutId={`activeCurrency-${variant}`}
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full -z-10 shadow-[0_4px_16px_rgba(245,160,0,0.4)] border border-amber-400/80"
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CurrencyToggle;
