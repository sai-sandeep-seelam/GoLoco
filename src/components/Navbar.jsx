import React, { useState, useEffect } from 'react';
import { Ticket, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.logoContainer} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span className={styles.logoIcon}>
          <Ticket size={28} strokeWidth={2.5} />
        </span>
        <span>GoLoco</span>
      </div>

      <div className={styles.navLinks}>
        <a href="#home" className={styles.navLink}>Home</a>
        <a href="#events" className={styles.navLink}>Upcoming Events</a>
        <a href="#about" className={styles.navLink}>About Us</a>
        <a href="#contact" className={styles.navLink}>Contact</a>
      </div>

      <div className={styles.authButtons}>
        <button className={styles.loginBtn}>Login</button>
        <button className={styles.signUpBtn}>Sign Up</button>
      </div>

      <button 
        className={styles.mobileMenuBtn} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Drawer (Glassmorphic) */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          background: 'rgba(11, 15, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          gap: '1.5rem',
          zIndex: 999
        }}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>Home</a>
          <a href="#events" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>Upcoming Events</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>About Us</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>Contact</a>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
          <button style={{ color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>Login</button>
          <button style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)', color: '#fff', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>Sign Up</button>
        </div>
      )}
    </nav>
  );
}
