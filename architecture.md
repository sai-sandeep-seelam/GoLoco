# GoLoco — Online Event Ticket Management: Architecture Diagrams

> All diagrams are written in **TikZ/LaTeX** and are ready to paste directly into [Overleaf](https://www.overleaf.com).
> Each block compiles as a **standalone** PDF with `pdfLaTeX`.
> To embed in a report, replace `\documentclass[border=10pt]{standalone}` with your report class and wrap each `tikzpicture` in a `\begin{figure}...\end{figure}`.

---

## 1. System Overview (High-Level)

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes.geometric, arrows.meta, positioning, fit, backgrounds}

\begin{document}
\begin{tikzpicture}[
  font=\small,
  >=Stealth,
  box/.style={
    rectangle, rounded corners=4pt, draw, thick,
    minimum width=2.8cm, minimum height=1cm, text centered
  },
  cloudbox/.style={box, fill=blue!10},
  clientbox/.style={box, fill=orange!15},
  serverbox/.style={box, fill=green!12},
  dbbox/.style={
    cylinder, shape border rotate=90, draw, thick,
    minimum height=1.2cm, minimum width=2.2cm,
    aspect=0.25, text centered, fill=yellow!15
  },
  storebox/.style={box, fill=purple!12},
  arrow/.style={->, thick}
]

\node[clientbox] (browser) {Browser / User};

\node[cloudbox, below=1.2cm of browser] (frontend)
  {React SPA\\(Vite + JSX)};

\node[storebox, left=2cm of frontend] (staticweb)
  {Azure Static\\Web Apps};

\node[serverbox, below=1.5cm of frontend] (backend)
  {ASP.NET Core 8\\Web API};

\node[storebox, right=2cm of backend] (appservice)
  {Azure App\\Service};

\node[dbbox, below left=1.5cm and 0.5cm of backend] (sqldb)
  {Azure SQL\\Database};

\node[storebox, below right=1.5cm and 0.5cm of backend] (blob)
  {Azure Blob\\Storage};

\draw[arrow] (browser)  -- node[right, font=\tiny]{HTTPS} (frontend);
\draw[arrow] (frontend) -- node[right, font=\tiny]{REST/JSON (JWT)} (backend);
\draw[arrow] (backend)  -- node[left,  font=\tiny]{EF Core} (sqldb);
\draw[arrow] (backend)  -- node[right, font=\tiny]{Azure SDK} (blob);
\draw[dashed, thick] (frontend) -- (staticweb);
\draw[dashed, thick] (backend)  -- (appservice);

\end{tikzpicture}
\end{document}
```

---

## 2. Backend Layered Architecture

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes, arrows.meta, positioning, fit, backgrounds}

\begin{document}
\begin{tikzpicture}[
  font=\small,
  >=Stealth,
  layer/.style={
    rectangle, draw, thick, rounded corners=3pt,
    minimum width=10cm, minimum height=1.2cm, text centered
  },
  item/.style={
    rectangle, draw, thin, rounded corners=2pt,
    minimum width=2.1cm, minimum height=0.7cm,
    text centered, font=\scriptsize
  },
  arrow/.style={->, thick}
]

\node[layer, fill=orange!20] (ctrl) at (0,0)
  {\textbf{Controllers (API Layer)}};

\node[item, below=0.1cm of ctrl.west, xshift=1.3cm] (authctrl) {AuthController};
\node[item, right=0.3cm of authctrl] (eventctrl) {EventsController};
\node[item, right=0.3cm of eventctrl] (bookctrl)  {BookingsController};
\node[item, right=0.3cm of bookctrl]  (basectrl)  {BaseApiController};

\node[layer, fill=green!15, below=1.2cm of ctrl] (svc)
  {\textbf{Services (Business Logic Layer)}};

\node[item, below=0.1cm of svc.west, xshift=1.3cm] (authsvc)  {AuthService};
\node[item, right=0.3cm of authsvc]  (eventsvc) {EventService};
\node[item, right=0.3cm of eventsvc] (booksvc)  {BookingService};
\node[item, right=0.3cm of booksvc]  (blobsvc)  {BlobStorageService};

\node[layer, fill=blue!12, below=1.2cm of svc] (repo)
  {\textbf{Repositories (Data Access Layer)}};

\node[item, below=0.1cm of repo.west, xshift=1.3cm] (genrepo)  {GenericRepository};
\node[item, right=0.3cm of genrepo]  (userrepo)  {UserRepository};
\node[item, right=0.3cm of userrepo] (eventrepo) {EventRepository};
\node[item, right=0.3cm of eventrepo](bookrepo)  {BookingRepository};

\node[layer, fill=yellow!20, below=1.2cm of repo] (dbctx)
  {\textbf{Data Layer (EF Core --- AppDbContext)}};

\node[layer, fill=purple!12, below=0.5cm of dbctx] (db)
  {\textbf{Azure SQL Database}};

\draw[arrow] (ctrl.south)  -- (svc.north);
\draw[arrow] (svc.south)   -- (repo.north);
\draw[arrow] (repo.south)  -- (dbctx.north);
\draw[arrow] (dbctx.south) -- (db.north);

\end{tikzpicture}
\end{document}
```

---

## 3. Domain Entity Relationship Diagram

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes.multipart, arrows.meta, positioning}

\begin{document}
\begin{tikzpicture}[
  font=\small,
  >=Stealth,
  entity/.style={
    rectangle split, rectangle split parts=2,
    draw, thick, rounded corners=2pt, text centered,
    rectangle split part fill={blue!15, white}
  },
  arrow/.style={->, thick},
  lbl/.style={font=\scriptsize, midway}
]

\node[entity] (user) {
  \textbf{User}
  \nodepart{two}
  \begin{tabular}{l}
    Id (PK) \\
    Name \\
    Email \\
    PasswordHash \\
    Role (Organizer/Attendee)
  \end{tabular}
};

\node[entity, right=3.5cm of user] (event) {
  \textbf{Event}
  \nodepart{two}
  \begin{tabular}{l}
    Id (PK) \\
    Title \\
    Description \\
    Date \\
    Location \\
    TotalCapacity \\
    ImageUrl \\
    OrganizerId (FK \textrightarrow{} User)
  \end{tabular}
};

\node[entity, below=3cm of event] (tickettype) {
  \textbf{TicketType}
  \nodepart{two}
  \begin{tabular}{l}
    Id (PK) \\
    Name (VIP / General) \\
    Price \\
    Capacity \\
    EventId (FK \textrightarrow{} Event)
  \end{tabular}
};

\node[entity, below=3cm of user] (booking) {
  \textbf{Booking}
  \nodepart{two}
  \begin{tabular}{l}
    Id (PK) \\
    BookingDate \\
    TotalPrice \\
    Status \\
    NumberOfTickets \\
    UserId (FK \textrightarrow{} User) \\
    EventId (FK \textrightarrow{} Event) \\
    TicketTypeId (FK \textrightarrow{} TicketType)
  \end{tabular}
};

\node[entity, right=3.5cm of booking] (seat) {
  \textbf{Seat}
  \nodepart{two}
  \begin{tabular}{l}
    Id (PK) \\
    SeatNumber \\
    IsReserved \\
    TicketTypeId (FK \textrightarrow{} TicketType) \\
    BookingId (FK \textrightarrow{} Booking, nullable)
  \end{tabular}
};

\draw[arrow] (user.east)        -- node[above, lbl]{organizes} (event.west);
\draw[arrow] (event.south)      -- node[right, lbl]{has many} (tickettype.north);
\draw[arrow] (user.south)       -- node[left,  lbl]{makes}    (booking.north);
\draw[arrow] (event.south west) -- node[below left, lbl, pos=0.3]{has many} (booking.north east);
\draw[arrow] (tickettype.west)  -- node[below, lbl]{categorises} (booking.east);
\draw[arrow] (tickettype.east)  -- node[above, lbl]{has many} (seat.west);
\draw[arrow] (booking.east)     -- node[below, lbl]{reserves} (seat.west);

\end{tikzpicture}
\end{document}
```

---

## 4. Frontend React Component Tree

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{trees, arrows.meta, positioning}

\begin{document}
\begin{tikzpicture}[
  font=\scriptsize,
  >=Stealth,
  grow=right,
  level distance=3.2cm,
  sibling distance=1.0cm,
  every node/.style={
    rectangle, draw, thin, rounded corners=2pt,
    minimum height=0.55cm, minimum width=2.5cm,
    text centered, fill=teal!10
  },
  edge from parent/.style={draw, ->}
]

\node {App.jsx}
  child { node {AuthContext} }
  child { node {Navbar}
    child { node {Login Page} }
    child { node {Signup Page} }
    child { node {AccessDenied} }
  }
  child { node {LandingView}
    child { node {Hero} }
    child { node {EventList}
      child { node {EventCard} }
    }
    child { node {Footer} }
  }
  child { node {EventDiscovery}
    child { node {EventCard} }
    child { node {SeatMap} }
  }
  child { node {OrganizerPortal}
    child { node {Create Event Form} }
    child { node {Edit Event} }
    child { node {Manage Bookings} }
  }
  child { node {AttendeePortal}
    child { node {Bookings Page} }
    child { node {DownloadableQRCode} }
  };

\end{tikzpicture}
\end{document}
```

---

## 5. Request / Response Sequence (Login, Browse, Book, Upload)

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta, positioning}

\begin{document}
\begin{tikzpicture}[
  font=\small,
  >=Stealth,
  actor/.style={
    rectangle, draw, thick, fill=gray!15,
    minimum width=2.2cm, minimum height=0.8cm, text centered
  },
  lifeline/.style={dashed, thin},
  msg/.style={->, thick},
  ret/.style={->, dashed, thick, draw=blue!60}
]

\node[actor] (browser) at (0,0)    {Browser};
\node[actor] (spa)     at (3.5,0)  {React SPA};
\node[actor] (api)     at (7.5,0)  {ASP.NET API};
\node[actor] (db)      at (11.5,0) {Azure SQL};
\node[actor] (blob)    at (11.5,-7){Blob Storage};

\draw[lifeline] (browser.south) -- ++(0,-10);
\draw[lifeline] (spa.south)     -- ++(0,-10);
\draw[lifeline] (api.south)     -- ++(0,-10);
\draw[lifeline] (db.south)      -- ++(0,-10);
\draw[lifeline] (blob.north)    -- ++(0,3.5);

%% 1. Login
\draw[msg] (0,-1.2)   -- node[above, font=\scriptsize]{POST /auth/login} (7.5,-1.2);
\draw[msg] (7.5,-1.5) -- node[above, font=\scriptsize]{Verify hash}      (11.5,-1.5);
\draw[ret] (11.5,-1.8) -- node[above, font=\scriptsize]{User row}         (7.5,-1.8);
\draw[ret] (7.5,-2.1)  -- node[above, font=\scriptsize]{JWT token}        (0,-2.1);

%% 2. Browse Events
\draw[msg] (0,-3.0)   -- node[above, font=\scriptsize]{GET /events}        (3.5,-3.0);
\draw[msg] (3.5,-3.3) -- node[above, font=\scriptsize]{+ Bearer JWT}       (7.5,-3.3);
\draw[msg] (7.5,-3.6) -- node[above, font=\scriptsize]{SELECT events}      (11.5,-3.6);
\draw[ret] (11.5,-3.9) -- node[above, font=\scriptsize]{EventDto list}      (3.5,-3.9);

%% 3. Book Ticket
\draw[msg] (0,-5.2)   -- node[above, font=\scriptsize]{POST /bookings}             (3.5,-5.2);
\draw[msg] (3.5,-5.5) -- node[above, font=\scriptsize]{+ Bearer JWT}               (7.5,-5.5);
\draw[msg] (7.5,-5.8) -- node[above, font=\scriptsize]{INSERT Booking + Seats}     (11.5,-5.8);
\draw[ret] (11.5,-6.1) -- node[above, font=\scriptsize]{BookingDto}                 (3.5,-6.1);

%% 4. Upload Event Image
\draw[msg] (0,-7.5)   -- node[above, font=\scriptsize]{POST /events (multipart)}  (7.5,-7.5);
\draw[msg] (7.5,-7.8) -- node[above, font=\scriptsize]{Upload image}               (11.5,-7.8);
\draw[ret] (11.5,-8.1) -- node[above, font=\scriptsize]{Blob URL}                  (7.5,-8.1);
\draw[ret] (7.5,-8.4)  -- node[above, font=\scriptsize]{EventDto}                  (0,-8.4);

\end{tikzpicture}
\end{document}
```

---

## 6. Azure Deployment Architecture

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes.geometric, arrows.meta, positioning, fit, backgrounds}

\begin{document}
\begin{tikzpicture}[
  font=\small,
  >=Stealth,
  azure/.style={
    rectangle, draw=blue!60, thick, rounded corners=5pt,
    minimum width=3.2cm, minimum height=1.1cm, text centered
  },
  user/.style={
    circle, draw, thick, fill=orange!20,
    minimum size=1cm, text centered, font=\scriptsize
  },
  arrow/.style={->, thick}
]

\node[user] (client) {User};

\node[azure, fill=cyan!10,   right=2cm of client]   (cdn)     {Azure CDN\\/ Static Web Apps};
\node[azure, fill=green!10,  right=2cm of cdn]       (appsvc)  {Azure App Service\\(ASP.NET Core API)};
\node[azure, fill=yellow!15, below right=1.5cm and 0cm of appsvc] (sqldb) {Azure SQL Database\\(SQL Server)};
\node[azure, fill=purple!12, above right=1.5cm and 0cm of appsvc] (blob)  {Azure Blob Storage\\(event-images)};
\node[azure, fill=gray!10,   above=1.5cm of appsvc]  (appcfg)  {App Settings\\(Env Vars / Secrets)};

\draw[arrow]         (client)  -- node[above, font=\scriptsize]{HTTPS}              (cdn);
\draw[arrow]         (cdn)     -- node[above, font=\scriptsize]{REST API}           (appsvc);
\draw[arrow]         (appsvc)  -- node[right, font=\scriptsize]{EF Core}            (sqldb);
\draw[arrow]         (appsvc)  -- node[right, font=\scriptsize]{Azure SDK}          (blob);
\draw[dashed, arrow] (appcfg)  -- node[right, font=\scriptsize]{JWT / Conn Strings} (appsvc);

\begin{scope}[on background layer]
  \node[draw=blue!40, dashed, thick, rounded corners=10pt,
        fit=(cdn)(appsvc)(sqldb)(blob)(appcfg),
        label=above:{\textbf{Microsoft Azure}}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

---

## Quick-Reference: Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, CSS Modules |
| **State / Auth** | React Context API, localStorage (JWT) |
| **HTTP Client** | Native Fetch API (`apiClient.js`) |
| **Backend** | ASP.NET Core 8 Web API (C\#) |
| **ORM** | Entity Framework Core (Code-First, Migrations) |
| **Auth** | JWT Bearer (HS256, `JwtBearerDefaults`) |
| **Database** | Azure SQL Database (SQL Server) |
| **File Storage** | Azure Blob Storage (`event-images` container) |
| **Hosting (FE)** | Azure Static Web Apps |
| **Hosting (BE)** | Azure App Service |
| **API Docs** | Swagger / OpenAPI (Swashbuckle) |
| **CORS Policy** | `ReactPolicy` (env-aware, configurable origins) |

---

### Using in Overleaf

1. Create a new Overleaf project.
2. Copy any `\documentclass{standalone}` block into a `.tex` file.
3. Compile with **pdfLaTeX**.
4. To embed in a report: replace the `standalone` class with your report class and wrap each `tikzpicture` inside a `\begin{figure}...\end{figure}` block.
