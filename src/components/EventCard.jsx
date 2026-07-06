import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Star, Bookmark, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './EventCard.module.css';

export default function EventCard({ event, onBook, viewMode = 'grid' }) {
  const {
    title,
    image,
    date,
    time,
    location,
    category,
    price,
    seatsLeft,
    totalSeats = 100,
    rating,
    description,
    organizer = 'GoLoco',
    type = 'In-Person',
    trending = false,
    startsInDays
  } = event;

  const [bookmarked, setBookmarked] = useState(false);

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: window.location.href,
      }).catch(err => console.log(err));
    } else {
      alert(`Share link for "${title}" copied to clipboard!`);
    }
  };

  // Calculate percentage of seats taken
  const seatsTakenPercentage = ((totalSeats - seatsLeft) / totalSeats) * 100;
  const isSeatsLow = seatsLeft <= 20;

  return (
    <article className={`${styles.card} ${viewMode === 'list' ? styles.listCard : ''}`}>
      {/* Trending Corner Ribbon */}
      {trending && <div className={styles.trendingRibbon}>Trending</div>}

      <div className={styles.imageWrapper}>
        <img 
          src={image} 
          alt={title} 
          className={styles.image} 
          loading="lazy" 
        />
        <span className={styles.categoryBadge}>{category}</span>
        <span className={styles.typeBadge}>{type}</span>
        
        <span className={styles.ratingBadge}>
          <Star size={12} fill="#FBBF24" stroke="#FBBF24" />
          <span>{rating}</span>
        </span>

        {startsInDays <= 5 && (
          <span className={styles.countdownBadge}>
            Starts in {startsInDays} {startsInDays === 1 ? 'Day' : 'Days'}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.organizer}>by {organizer}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <Calendar size={14} className={styles.metaIcon} />
            <span>{date}</span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={14} className={styles.metaIcon} />
            <span>{time}</span>
          </div>
          <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
            <MapPin size={14} className={styles.metaIcon} />
            <span>{location === 'Remote' ? 'Online / Remote' : location}</span>
          </div>
        </div>

        {/* Seats progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span>Seats Remaining</span>
            <span style={{ fontWeight: 600, color: isSeatsLow ? '#EF4444' : '#10B981' }}>
              {seatsLeft} / {totalSeats} left
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div 
              className={`${styles.progressBarFill} ${isSeatsLow ? styles.progressBarFillLow : ''}`}
              style={{ width: `${Math.max(5, 100 - seatsTakenPercentage)}%` }}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Price</span>
            <span className={styles.price}>{price}</span>
          </div>

          <div className={styles.actionGroup}>
            {/* Share button */}
            <motion.button 
              className={styles.actionBtn} 
              onClick={handleShareClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Share event"
            >
              <Share2 size={16} />
            </motion.button>

            {/* Bookmark button */}
            <motion.button 
              className={`${styles.actionBtn} ${bookmarked ? styles.bookmarked : ''}`} 
              onClick={handleBookmarkClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={bookmarked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
              aria-label="Bookmark event"
            >
              <Bookmark size={16} />
            </motion.button>

            <button className={styles.bookBtn} onClick={() => onBook(event)}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
