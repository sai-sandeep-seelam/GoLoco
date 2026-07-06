import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Ticket, User, ArrowRight } from 'lucide-react';
import styles from './Hero.module.css';

export default function Hero({ setView }) {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="home" className={styles.heroContainer}>
      <motion.div 
        className={styles.leftCol}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.badge} variants={itemVariants}>
          <Sparkles size={14} /> Redefining Event Ticket Bookings
        </motion.div>

        <motion.h1 className={styles.heading} variants={itemVariants}>
          Discover, Book & <br />
          Experience Amazing Events
        </motion.h1>

        <motion.p className={styles.subheading} variants={itemVariants}>
          Find concerts, workshops, conferences, sports events, and festivals all in one place. 
          Book premium tickets in seconds and manage your events effortlessly with GoLoco.
        </motion.p>

        <motion.div className={styles.ctaGroup} variants={itemVariants}>
          <button className={styles.primaryCta} onClick={() => setView('attendee')}>
            <Ticket size={20} />
            <span>Browse as Attendee</span>
          </button>
          <button className={styles.secondaryCta} onClick={() => setView('organizer')}>
            <User size={20} />
            <span>Continue as Organiser</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </motion.div>

      <motion.div 
        className={styles.rightCol}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg 
          className={styles.illustration} 
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Radial glow background in SVG */}
          <circle className={styles.glowCircle} cx="250" cy="250" r="180" fill="url(#svgGlow)" opacity="0.6" />
          
          {/* Floating Ticket Graphic */}
          <g className={styles.floatElement}>
            {/* Main ticket glass shape */}
            <rect x="80" y="100" width="340" height="200" rx="20" fill="rgba(25, 30, 48, 0.8)" stroke="url(#borderGradient)" strokeWidth="2.5" />
            
            {/* Ticket left/right notches */}
            <circle cx="80" cy="200" r="15" fill="#0B0F19" stroke="url(#borderGradient)" strokeWidth="2.5" />
            <circle cx="420" cy="200" r="15" fill="#0B0F19" stroke="url(#borderGradient)" strokeWidth="2.5" />
            
            {/* Ticket Dividers */}
            <line x1="310" y1="100" x2="310" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
            
            {/* Ticket content */}
            <text x="110" y="145" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="Inter, sans-serif">VIP ADMISSION</text>
            <text x="110" y="170" fill="var(--text-secondary)" fontSize="12" fontFamily="Inter, sans-serif">EVENT ACCESS PASS</text>
            
            {/* Custom SVG logo badge on ticket */}
            <rect x="110" y="200" width="80" height="28" rx="6" fill="rgba(124, 58, 237, 0.2)" stroke="rgba(124, 58, 237, 0.4)" />
            <text x="120" y="218" fill="#A78BFA" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">GOLOCO</text>

            <text x="110" y="265" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">PRICE: $120.00</text>
            <text x="210" y="265" fill="var(--text-secondary)" fontSize="11" fontFamily="Inter, sans-serif">SEAT: ROW A-12</text>

            {/* QR Code Graphic Mockup */}
            <rect x="332" y="130" width="65" height="65" rx="6" fill="#FFFFFF" />
            {/* QR Code details */}
            <rect x="338" y="136" width="18" height="18" fill="#131A2E" />
            <rect x="373" y="136" width="18" height="18" fill="#131A2E" />
            <rect x="338" y="171" width="18" height="18" fill="#131A2E" />
            <rect x="362" y="152" width="12" height="12" fill="#131A2E" />
            <rect x="378" y="171" width="10" height="10" fill="#131A2E" />
            <rect x="360" y="174" width="8" height="6" fill="#131A2E" />
            
            {/* Scan Text */}
            <text x="338" y="222" fill="#A78BFA" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">SCAN QR</text>
          </g>

          {/* Floating Calendar Element — outer g holds the SVG position transform,
              inner g carries the CSS float animation so translateY doesn't clobber
              the translate(40, 190) positioning. */}
          <g transform="translate(40, 190)">
            <g className={styles.floatElementDelayed}>
              <rect x="20" y="100" width="120" height="130" rx="16" fill="rgba(19, 26, 46, 0.9)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
              <rect x="20" y="100" width="120" height="35" rx="16" fill="url(#purpleBlueGrad)" />
              <rect x="20" y="115" width="120" height="20" fill="url(#purpleBlueGrad)" />
              
              {/* Mini Calendar rings */}
              <circle cx="50" cy="100" r="4" fill="#0B0F19" />
              <circle cx="110" cy="100" r="4" fill="#0B0F19" />

              <text x="80" y="123" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="Inter, sans-serif">JULY</text>
              <text x="80" y="180" fill="#FFFFFF" fontSize="32" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">24</text>
              <text x="80" y="210" fill="var(--text-secondary)" fontSize="11" textAnchor="middle" fontFamily="Inter, sans-serif">FRIDAY</text>
            </g>
          </g>

          {/* Stage / Wave/ Particles */}
          <path d="M50 420 Q150 370 250 420 T450 420" stroke="url(#purpleBlueGrad)" strokeWidth="4" opacity="0.3" />
          <path d="M20 440 Q150 400 280 450 T480 430" stroke="url(#borderGradient)" strokeWidth="2" opacity="0.2" />

          {/* Sphere points — each on its own independent float rhythm */}
          <circle cx="410" cy="360" r="8" fill="#60A5FA" opacity="0.7" className={styles.floatElement} />
          <circle cx="60" cy="180" r="14" fill="#7C3AED" opacity="0.5" className={styles.floatElementAlt} />
          <circle cx="430" cy="110" r="6" fill="#FBBF24" opacity="0.6" />

          {/* Definitions for gradients */}
          <defs>
            <radialGradient id="svgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="purpleBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </section>
  );
}
