using Microsoft.EntityFrameworkCore;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Event> Events { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<TicketType> TicketTypes { get; set; }
        public DbSet<Seat> Seats { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. One Organizer (User) creates many Events
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Organizer)
                .WithMany(u => u.OrganizedEvents)
                .HasForeignKey(e => e.OrganizerId)
                .OnDelete(DeleteBehavior.Cascade); // If Organizer account is deleted, delete their Events

            // 2. One Event has many TicketTypes
            modelBuilder.Entity<TicketType>()
                .HasOne(tt => tt.Event)
                .WithMany(e => e.TicketTypes)
                .HasForeignKey(tt => tt.EventId)
                .OnDelete(DeleteBehavior.Cascade); // If Event is deleted, delete all associated TicketTypes

            // 3. One TicketType has many Seats
            modelBuilder.Entity<Seat>()
                .HasOne(s => s.TicketType)
                .WithMany(tt => tt.Seats)
                .HasForeignKey(s => s.TicketTypeId)
                .OnDelete(DeleteBehavior.Cascade); // If TicketType is deleted, delete associated Seats

            // 4. One Attendee (User) can make many Bookings
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths (cycles) by restricting delete

            // 5. One Event has many Bookings
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Event)
                .WithMany(e => e.Bookings)
                .HasForeignKey(b => b.EventId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths (cycles) by restricting delete

            // 6. One Booking can contain many Seats
            modelBuilder.Entity<Seat>()
                .HasOne(s => s.Booking)
                .WithMany(b => b.Seats)
                .HasForeignKey(s => s.BookingId)
                .OnDelete(DeleteBehavior.SetNull); // If a Booking is deleted, release the seats (set BookingId to Null)

            // 8. Ticket codes are unique (EF creates the index filtered to non-NULL codes)
            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.TicketCode)
                .IsUnique();

            // 7. One TicketType has many Bookings (linked via TicketTypeId)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.TicketType)
                .WithMany()
                .HasForeignKey(b => b.TicketTypeId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade paths cycles
        }
    }
}
