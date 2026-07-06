# 🎟 GoLoco — Online Event Ticketing & Management Platform

A modern, fully responsive landing page for an Online Event Ticketing & Management System built with **React + Vite**. Featuring a premium dark glassmorphism UI, smooth Framer Motion animations, and a fully functional frontend filtering & booking flow.

---

## 🚀 Live Demo

> Run locally via `npm run dev` → Open http://localhost:5173

---

## ✨ Features

### 🎯 Core Sections
- **Sticky Glassmorphic Navbar** — Transparent initially, blurs & adds shadow on scroll with a mobile hamburger menu
- **Hero Section** — Animated heading, subheading, dual CTAs, and a custom SVG event illustration
- **Event Discovery Bar** — Compact Airbnb-style filter row with expandable search, category/location/date/price/sort pill dropdowns with popovers, availability toggle chips, and a reset button
- **Featured Statistics** — Scroll-animated cards showing Live Events, Tickets Sold, Cities, and Average Rating
- **Quick Filter Chips** — Horizontal scrollable category shortcuts (Music, Tech, Food, Sports, etc.)
- **Upcoming Events Grid** — 10 sample events with responsive 4/3/2/1 column layouts
- **Event Cards** — Glass cards featuring image zoom on hover, countdown ("Starts in X Days"), trending ribbon, organizer info, type badge (In-Person/Online), seats progress bar, bookmark & share actions
- **Grid / List View Toggle** — Switch between card grid and horizontal list layout
- **Real-time Filtering & Sorting** — All filter changes update event cards instantly with no page reload
- **Booking Modal** — Ticket quantity selector, billing breakdown with fees, and a confirmation receipt with QR code
- **Footer** — Branding, quick links, social icons, copyright

### 🎨 Design System
- **Theme**: Dark mode with glassmorphism (`backdrop-filter: blur`)
- **Colors**: Purple (`#7C3AED`) and Blue (`#3B82F6`) accent gradient
- **Font**: Inter (Google Fonts)
- **Border Radius**: 18px rounded corners
- **Animations**: Framer Motion entrance animations, staggered card reveals, hover lift, scale, and glow effects
- **Background**: Animated floating gradient glow spheres

---

## 🛠 Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19.x | UI Framework |
| Vite | 8.x | Build Tool & Dev Server |
| Framer Motion | 12.x | Animations |
| Lucide React | 1.x | Icons |
| CSS Modules | Native | Scoped Component Styles |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx           # Sticky header with scroll detection
│   ├── Navbar.module.css
│   ├── Hero.jsx             # Landing hero with SVG illustration
│   ├── Hero.module.css
│   ├── EventDiscovery.jsx   # Compact filter bar with popovers
│   ├── EventDiscovery.module.css
│   ├── EventList.jsx        # Stats, chips, grid controls, event grid
│   ├── EventList.module.css
│   ├── EventCard.jsx        # Individual event card component
│   ├── EventCard.module.css
│   ├── Footer.jsx           # Site footer
│   └── Footer.module.css
│
├── data/
│   └── events.js            # 10 sample event objects
│
├── App.jsx                  # Root layout + filter state + booking modal
├── App.css                  # Global layout + modal styles
├── main.jsx                 # React entry point
└── index.css                # CSS variables + resets
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/sai-sandeep-seelam/GoLoco.git
cd GoLoco

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output is in the `/dist` folder.

---

## 🔮 Future Roadmap

The codebase is structured to easily extend into a full-stack platform:

- [ ] React Router — Login, Sign Up, Event Details, Seat Selection
- [ ] QR Ticket Page
- [ ] Organizer Dashboard
- [ ] User Dashboard (Bookings, Wishlist)
- [ ] Backend API integration (Node.js / Firebase)
- [ ] Payment gateway (Razorpay / Stripe)
- [ ] Real-time seat availability (WebSockets)

---

## 📸 Screenshots

> Coming soon — run locally to see the live experience.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">Made with ❤️ by <a href="https://github.com/sai-sandeep-seelam">Sai Sandeep Seelam</a></p>