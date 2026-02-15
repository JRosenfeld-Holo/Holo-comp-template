import { ReactNode } from 'react';

export interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  href?: string;
}

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface StatCardProps {
  value: string;
  label: string;
}

export interface PricingCardProps {
  tier: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}
