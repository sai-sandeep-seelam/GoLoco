import React from 'react';
import { Ticket } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer id="about" className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandCol}>
          <div className={styles.logoContainer}>
            <span className={styles.logoIcon}>
              <Ticket size={28} strokeWidth={2.5} />
            </span>
            <span>GoLoco</span>
          </div>
          <p className={styles.tagline}>
            Connecting you to local experiences, premium conferences, electrifying concerts, and culinary festivals in seconds.
          </p>
        </div>

        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.list}>
            <li><a href="#home" className={styles.link}>Home</a></li>
            <li><a href="#events" className={styles.link}>Upcoming Events</a></li>
            <li><a href="#about" className={styles.link}>About Us</a></li>
            <li><a id="contact" href="#contact" className={styles.link}>Contact</a></li>
          </ul>
        </div>

        <div className={styles.socialCol}>
          <h4 className={styles.colTitle}>Follow Us</h4>
          <div className={styles.socialList}>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            </a>
          </div>
        </div>
      </div>


      <div className={styles.bottom}>
        <span className={styles.copyright}>
          &copy; {new Date().getFullYear()} GoLoco Inc. All rights reserved.
        </span>
        <div className={styles.termsList}>
          <a href="#privacy" className={styles.link} style={{ fontSize: '0.88rem' }}>Privacy Policy</a>
          <a href="#terms" className={styles.link} style={{ fontSize: '0.88rem' }}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
