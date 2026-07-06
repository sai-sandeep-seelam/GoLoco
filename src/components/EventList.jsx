import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, ArrowRight, Star, Users, MapPin, Sparkles, CalendarDays } from 'lucide-react';
import EventCard from './EventCard';
import styles from './EventList.module.css';

export default function EventList({ 
  filteredEvents, 
  onBookEvent, 
  activeChip, 
  setActiveChip, 
  sortBy, 
  setSortBy 
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const stats = [
    { id: 1, icon: <CalendarDays size={24} />, number: "250+", label: "Live Events" },
    { id: 2, icon: <Users size={24} />, number: "15K+", label: "Tickets Sold" },
    { id: 3, icon: <MapPin size={24} />, number: "120+", label: "Cities" },
    { id: 4, icon: <Star size={24} fill="#FBBF24" stroke="#FBBF24" />, number: "4.9/5", label: "Avg Rating" }
  ];

  const quickFilterChips = [
    { label: "All Events", value: "all" },
    { label: "🎵 Live Music", value: "music" },
    { label: "💻 Tech", value: "tech" },
    { label: "🍕 Food Festivals", value: "food" },
    { label: "⚽ Sports", value: "sports" },
    { label: "🎨 Workshops", value: "workshop" },
    { label: "🎭 Comedy", value: "comedy" },
    { label: "🎉 Festivals", value: "festival" },
    { label: "📚 Education", value: "education" }
  ];

  // Motion Variants
  const statsContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const gridContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <section id="events" className={styles.section}>
      {/* Featured Statistics */}
      <motion.div 
        className={styles.statsSection}
        variants={statsContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {stats.map(stat => (
          <motion.div 
            key={stat.id} 
            className={styles.statCard}
            variants={statCardVariants}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statNumber}>{stat.number}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Filter Chips */}
      <div className={styles.chipsContainer}>
        {quickFilterChips.map(chip => (
          <button
            key={chip.value}
            className={`${styles.chip} ${activeChip === chip.value ? styles.activeChip : ''}`}
            onClick={() => setActiveChip(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Rich Section Header */}
      <div className={styles.richHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Upcoming Events</h2>
          <span className={styles.subtitle}>Discover premium events happening around you.</span>
        </div>
        <a href="#events" className={styles.viewAll} onClick={() => setActiveChip('all')}>
          <span>View All</span>
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Grid Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.resultsCount}>
          Showing <strong>{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'}
        </div>

        <div className={styles.controlsRight}>
          {/* Grid/List layout toggle */}
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleIconBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={`${styles.toggleIconBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>

          {/* Sort By Dropdown */}
          <select 
            className={styles.sortDropdown}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Lowest Price</option>
            <option value="price-high">Highest Price</option>
            <option value="closest">Closest Date</option>
            <option value="seats">Most Seats Available</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <motion.div 
          className={viewMode === 'grid' ? styles.grid : styles.listGrid}
          key={viewMode} // Re-animate when viewMode changes
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEvents.map(event => (
            <motion.div key={event.id} variants={cardVariants}>
              <EventCard 
                event={event} 
                onBook={onBookEvent} 
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div style={{
          padding: '4rem 2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No events matches your search</p>
          <p style={{ fontSize: '0.9rem' }}>Try clearing filters or search term to see other events.</p>
        </div>
      )}
    </section>
  );
}
