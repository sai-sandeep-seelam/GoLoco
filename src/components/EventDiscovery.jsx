import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Layers, Tag, ArrowUpDown, RefreshCw, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import styles from './EventDiscovery.module.css';

export default function EventDiscovery({ filters, setFilters, onReset }) {
  const [isSticky, setIsSticky] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'location' | 'date' | 'category' | 'price' | 'sort' | null

  const searchInputRef = useRef(null);
  const popoverRef = useRef(null);

  // Monitor scroll to stick panel below Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle clicking outside of open dropdown popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const locations = ["All Locations", "Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune", "Remote"];
  const dates = ["All Dates", "Today", "Tomorrow", "This Weekend", "This Month"];
  const categories = ["All Categories", "Music", "Tech", "Food", "Sports", "Business", "Workshop", "Festival", "Comedy", "Education"];
  const prices = ["All Prices", "Free", "Under ₹500", "₹500–₹1000", "₹1000–₹3000", "Premium"];
  
  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Lowest Price" },
    { value: "price-high", label: "Highest Price" },
    { value: "closest", label: "Closest Date" },
    { value: "seats", label: "Most Seats Available" }
  ];

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setActiveDropdown(null); // Close popover on select
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const getSortLabel = (val) => {
    const opt = sortOptions.find(o => o.value === val);
    return opt ? opt.label : "Most Popular";
  };

  return (
    <div className={`${styles.stickyWrapper} ${isSticky ? styles.sticky : ''}`} ref={popoverRef}>
      {/* Desktop Filter Panel */}
      <div className={styles.discoveryBar}>
        
        {/* Search Toggle */}
        <div className={styles.searchContainer}>
          {!searchExpanded ? (
            <button 
              className={`${styles.searchIconBtn} ${styles.hasTooltip}`}
              onClick={() => setSearchExpanded(true)}
              aria-label="Open Search"
              type="button"
            >
              <Search size={18} />
              <span className={styles.tooltip}>Search Events</span>
            </button>
          ) : (
            <div className={styles.searchInputWrapper}>
              <Search size={16} style={{ color: 'var(--accent-purple)', marginRight: '0.5rem' }} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search title, artist, venues..."
                className={styles.searchInput}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <button 
                className={styles.searchCloseBtn} 
                onClick={() => {
                  setSearchExpanded(false);
                  setFilters(prev => ({ ...prev, search: '' }));
                }}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Location Popover */}
        <div className={styles.popoverContainer}>
          <button 
            className={`${styles.filterPill} ${filters.location !== 'All Locations' ? styles.activePill : ''}`}
            onClick={() => toggleDropdown('location')}
            type="button"
          >
            <span>📍 {filters.location === 'All Locations' ? 'Location' : filters.location}</span>
            <ChevronDown size={14} className={styles.pillArrow} />
          </button>
          {activeDropdown === 'location' && (
            <div className={styles.popoverDropdown}>
              {locations.map(loc => (
                <button
                  key={loc}
                  className={`${styles.dropdownOption} ${filters.location === loc ? styles.activeOption : ''}`}
                  onClick={() => handleInputChange('location', loc)}
                  type="button"
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Popover */}
        <div className={styles.popoverContainer}>
          <button 
            className={`${styles.filterPill} ${filters.date !== 'All Dates' ? styles.activePill : ''}`}
            onClick={() => toggleDropdown('date')}
            type="button"
          >
            <span>📅 {filters.date === 'All Dates' ? 'Date' : filters.date}</span>
            <ChevronDown size={14} className={styles.pillArrow} />
          </button>
          {activeDropdown === 'date' && (
            <div className={styles.popoverDropdown}>
              {dates.map(d => (
                <button
                  key={d}
                  className={`${styles.dropdownOption} ${filters.date === d ? styles.activeOption : ''}`}
                  onClick={() => handleInputChange('date', d)}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Popover */}
        <div className={styles.popoverContainer}>
          <button 
            className={`${styles.filterPill} ${filters.category !== 'All Categories' ? styles.activePill : ''}`}
            onClick={() => toggleDropdown('category')}
            type="button"
          >
            <span>🎭 {filters.category === 'All Categories' ? 'Category' : filters.category}</span>
            <ChevronDown size={14} className={styles.pillArrow} />
          </button>
          {activeDropdown === 'category' && (
            <div className={styles.popoverDropdown}>
              {categories.map(c => (
                <button
                  key={c}
                  className={`${styles.dropdownOption} ${filters.category === c ? styles.activeOption : ''}`}
                  onClick={() => handleInputChange('category', c)}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Popover */}
        <div className={styles.popoverContainer}>
          <button 
            className={`${styles.filterPill} ${filters.price !== 'All Prices' ? styles.activePill : ''}`}
            onClick={() => toggleDropdown('price')}
            type="button"
          >
            <span>💰 {filters.price === 'All Prices' ? 'Price' : filters.price}</span>
            <ChevronDown size={14} className={styles.pillArrow} />
          </button>
          {activeDropdown === 'price' && (
            <div className={styles.popoverDropdown}>
              {prices.map(p => (
                <button
                  key={p}
                  className={`${styles.dropdownOption} ${filters.price === p ? styles.activeOption : ''}`}
                  onClick={() => handleInputChange('price', p)}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Popover */}
        <div className={styles.popoverContainer}>
          <button 
            className={`${styles.filterPill} ${filters.sortBy !== 'popular' ? styles.activePill : ''}`}
            onClick={() => toggleDropdown('sort')}
            type="button"
          >
            <span>⇅ {getSortLabel(filters.sortBy)}</span>
            <ChevronDown size={14} className={styles.pillArrow} />
          </button>
          {activeDropdown === 'sort' && (
            <div className={styles.popoverDropdown}>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.dropdownOption} ${filters.sortBy === opt.value ? styles.activeOption : ''}`}
                  onClick={() => handleInputChange('sortBy', opt.value)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Availability Group */}
        <div className={styles.availabilityGroup}>
          <button 
            className={`${styles.toggleChip} ${filters.availability === 'all' ? styles.activeAllChip : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, availability: 'all' }))}
            type="button"
          >
            ⚪ All
          </button>
          <button 
            className={`${styles.toggleChip} ${filters.availability === 'available' ? styles.activeToggleChip : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, availability: 'available' }))}
            type="button"
          >
            🟢 Available
          </button>
          <button 
            className={`${styles.toggleChip} ${filters.availability === 'soldout' ? styles.activeSoldOutChip : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, availability: 'soldout' }))}
            type="button"
          >
            🔴 Sold Out
          </button>
        </div>

        {/* Reset Button */}
        <button 
          className={`${styles.resetIconBtn} ${styles.hasTooltip}`}
          onClick={onReset}
          type="button"
        >
          <RefreshCw size={16} />
          <span className={styles.tooltip}>Reset Filters</span>
        </button>

      </div>

      {/* Mobile Mini Search & Trigger Row */}
      <div className={styles.mobileSearchOnly}>
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px', padding: '0.4rem 1rem' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search events..." 
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: '100%' }}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <button 
          className={styles.mobileFilterTrigger}
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Filter Options</h3>
              <button className={styles.drawerClose} onClick={() => setIsDrawerOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Location */}
            <div className={styles.drawerGroup}>
              <span className={styles.drawerLabel}>Location</span>
              <select 
                className={styles.drawerSelect} 
                value={filters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              >
                {locations.map(l => <option key={l} value={l} style={{ background: '#131A2E' }}>{l}</option>)}
              </select>
            </div>

            {/* Date */}
            <div className={styles.drawerGroup}>
              <span className={styles.drawerLabel}>Date</span>
              <select 
                className={styles.drawerSelect} 
                value={filters.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              >
                {dates.map(d => <option key={d} value={d} style={{ background: '#131A2E' }}>{d}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className={styles.drawerGroup}>
              <span className={styles.drawerLabel}>Category</span>
              <select 
                className={styles.drawerSelect} 
                value={filters.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {categories.map(c => <option key={c} value={c} style={{ background: '#131A2E' }}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div className={styles.drawerGroup}>
              <span className={styles.drawerLabel}>Price</span>
              <select 
                className={styles.drawerSelect} 
                value={filters.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
              >
                {prices.map(p => <option key={p} value={p} style={{ background: '#131A2E' }}>{p}</option>)}
              </select>
            </div>

            {/* Availability */}
            <div className={styles.drawerGroup}>
              <span className={styles.drawerLabel}>Availability</span>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button 
                  style={{ flex: 1, padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem', background: filters.availability === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                  onClick={() => handleInputChange('availability', 'all')}
                >
                  All
                </button>
                <button 
                  style={{ flex: 1, padding: '0.6rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', color: '#34D399', fontSize: '0.8rem', background: filters.availability === 'available' ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}
                  onClick={() => handleInputChange('availability', 'available')}
                >
                  Available
                </button>
                <button 
                  style={{ flex: 1, padding: '0.6rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#F87171', fontSize: '0.8rem', background: filters.availability === 'soldout' ? 'rgba(239, 68, 68, 0.15)' : 'transparent' }}
                  onClick={() => handleInputChange('availability', 'soldout')}
                >
                  Sold Out
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button 
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                marginTop: '1rem'
              }}
              onClick={onReset}
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
