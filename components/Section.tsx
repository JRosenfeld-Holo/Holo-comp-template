import React from 'react';
import { motion } from 'framer-motion';
import { SectionProps } from '../types';

export const Section: React.FC<SectionProps> = ({ children, className = '', id }) => {
  return (
    <section id={id} className={`w-full py-20 px-4 md:px-12 lg:px-24 relative overflow-hidden scroll-mt-24 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {children}
      </motion.div>
    </section>
  );
};