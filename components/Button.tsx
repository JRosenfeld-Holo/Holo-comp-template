import React from 'react';
import { motion } from 'framer-motion';
import { ButtonProps } from '../types';

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', onClick, href }) => {
  const baseStyles = "relative px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";

  const variants = {
    primary: "bg-brand-lime text-black border border-brand-lime",
    outline: "bg-transparent text-white border border-white/20",
    ghost: "bg-transparent text-white hover:text-brand-lime"
  };

  const hoverEffects = variant === 'primary'
    ? "hover:shadow-[0_0_30px_rgba(191,253,17,0.4)]"
    : variant === 'outline'
      ? "hover:border-brand-lime hover:text-brand-lime hover:shadow-[0_0_20px_rgba(191,253,17,0.2)]"
      : "";

  const Component = href ? motion.a : motion.button;
  const props = href ? { href } : { onClick };

  return (
    // @ts-ignore
    <Component
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${hoverEffects} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
