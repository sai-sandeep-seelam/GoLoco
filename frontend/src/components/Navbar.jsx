import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Menu, X, LogOut, User, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

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

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoutClick = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logoContainer} style={{ textDecoration: 'none' }} onClick={() => window.scrollTo(0,0)}>
        <span className={styles.logoIcon}>
          <Ticket size={28} strokeWidth={2.5} />
        </span>
        <span>GoLoco!</span>
      </Link>

      <div className={styles.navLinks}>
        <button 
          className={`${styles.navLink} ${location.pathname === '/' ? styles.activeNavLink : ''}`}
          onClick={() => handleNavigate('/')}
        >
          Home
        </button>
        {user?.role !== 'Organizer' && (
          <button 
            className={`${styles.navLink} ${(location.pathname === '/events' || location.pathname === '/attendee') ? styles.activeNavLink : ''}`}
            onClick={() => handleNavigate(isAuthenticated && user?.role === 'Attendee' ? '/attendee' : '/events')}
          >
            Browse Events
          </button>
        )}
        
        {/* Conditional Navigation Links based on User Role */}
        {isAuthenticated && user?.role === 'Organizer' && (
          <button 
            className={`${styles.navLink} ${location.pathname === '/organizer' ? styles.activeNavLink : ''}`}
            onClick={() => handleNavigate('/organizer')}
          >
            Organizer Portal
          </button>
        )}

        {isAuthenticated && user?.role === 'Attendee' && (
          <button 
            className={`${styles.navLink} ${location.pathname === '/bookings' ? styles.activeNavLink : ''}`}
            onClick={() => handleNavigate('/bookings')}
          >
            My Bookings
          </button>
        )}
      </div>

      <div className={styles.authButtons}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} />
              {user?.name} ({user?.role})
            </span>
            <button className={styles.loginBtn} onClick={handleLogoutClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <>
            <button className={styles.loginBtn} onClick={() => handleNavigate('/login')}>Login</button>
            <button className={styles.signUpBtn} onClick={() => handleNavigate('/signup')}>Sign Up</button>
          </>
        )}
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
          position: 'fixed', top: '70px', left: 0, right: 0,
          background: 'rgba(11, 15, 25, 0.98)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', padding: '2rem', gap: '1.5rem', zIndex: 999
        }}>
          <button 
            onClick={() => handleNavigate('/')} 
            style={{ 
              color: location.pathname === '/' ? 'var(--accent-purple)' : 'var(--text-primary)', 
              fontSize: '1.1rem', fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            Home
          </button>
          {user?.role !== 'Organizer' && (
            <button 
              onClick={() => handleNavigate(isAuthenticated && user?.role === 'Attendee' ? '/attendee' : '/events')} 
              style={{ 
                color: (location.pathname === '/events' || location.pathname === '/attendee') ? 'var(--accent-purple)' : 'var(--text-primary)', 
                fontSize: '1.1rem', fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              Browse Events
            </button>
          )}

          {isAuthenticated && user?.role === 'Organizer' && (
            <button 
              onClick={() => handleNavigate('/organizer')} 
              style={{ 
                color: location.pathname === '/organizer' ? 'var(--accent-purple)' : 'var(--text-primary)', 
                fontSize: '1.1rem', fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              Organizer Portal
            </button>
          )}

          {isAuthenticated && user?.role === 'Attendee' && (
            <button 
              onClick={() => handleNavigate('/bookings')} 
              style={{ 
                color: location.pathname === '/bookings' ? 'var(--accent-purple)' : 'var(--text-primary)', 
                fontSize: '1.1rem', fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              My Bookings
            </button>
          )}
          
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
          
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
                Signed in as <strong>{user?.name}</strong>
              </span>
              <button onClick={handleLogoutClick} style={{ color: '#ef4444', padding: '0.8rem', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'rgba(239,68,68,0.1)', width: '100%', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => handleNavigate('/login')} style={{ color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'none' }}>
                Login
              </button>
              <button onClick={() => handleNavigate('/signup')} style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)', color: '#fff', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, border: 'none' }}>
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
