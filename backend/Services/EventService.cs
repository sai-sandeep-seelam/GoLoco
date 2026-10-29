using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using OnlineEventTicketManagement.DTOs;
using OnlineEventTicketManagement.Interfaces;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IBlobStorageService _blobStorageService;

        public EventService(
            IEventRepository eventRepository,
            IBookingRepository bookingRepository,
            IBlobStorageService blobStorageService)
        {
            _eventRepository = eventRepository;
            _bookingRepository = bookingRepository;
            _blobStorageService = blobStorageService;
        }

        /// <summary>
        /// Retrieves all events with the associated organizer details.
        /// </summary>
        public async Task<IEnumerable<EventDto>> GetAllEventsAsync()
        {
            var events = await _eventRepository.GetAllEventsWithOrganizersAsync();
            return events.Select(MapToDto);
        }

        /// <summary>
        /// Retrieves a single event by ID with associated organizer details.
        /// </summary>
        public async Task<EventDto?> GetEventByIdAsync(int id)
        {
            var e = await _eventRepository.GetEventWithOrganizerAsync(id);
            return e == null ? null : MapToDto(e);
        }

        /// <summary>
        /// Retrieves all ticket types for a specific event.
        /// </summary>
        public async Task<IEnumerable<TicketTypeDto>> GetTicketTypesForEventAsync(int eventId)
        {
            var e = await _eventRepository.GetEventWithTicketsAsync(eventId);
            if (e == null) return new List<TicketTypeDto>();

            return e.TicketTypes.Select(tt => new TicketTypeDto
            {
                Id = tt.Id,
                Name = tt.Name,
                Price = tt.Price,
                Capacity = tt.Capacity
            });
        }

        /// <summary>
        /// Retrieves all seats for a specific event.
        /// </summary>
        public async Task<IEnumerable<SeatDto>> GetSeatsForEventAsync(int eventId)
        {
            var e = await _eventRepository.GetEventWithTicketsAsync(eventId);
            if (e == null) return new List<SeatDto>();

            var seats = new List<SeatDto>();
            foreach (var tt in e.TicketTypes)
            {
                foreach (var seat in tt.Seats)
                {
                    seats.Add(new SeatDto
                    {
                        Id = seat.Id,
                        SeatNumber = seat.SeatNumber,
                        IsReserved = seat.IsReserved,
                        TicketTypeId = tt.Id,
                        TicketTypeName = tt.Name
                    });
                }
            }
            return seats;
        }

        /// <summary>
        /// Creates a new event. If an image is provided, it is uploaded to Azure Blob Storage
        /// and the returned URL is persisted in Event.ImageUrl.
        /// </summary>
        public async Task<EventDto> CreateEventAsync(CreateEventDto createEventDto, int organizerId, IFormFile? image = null)
        {
            var e = new Event
            {
                Title = createEventDto.Title,
                Description = createEventDto.Description,
                Date = createEventDto.Date,
                Location = createEventDto.Location,
                TotalCapacity = createEventDto.TotalCapacity,
                Category = string.IsNullOrWhiteSpace(createEventDto.Category) ? null : createEventDto.Category.Trim(),
                OrganizerId = organizerId,
                CreatedAt = DateTime.UtcNow
            };

            // Build TicketType entities with auto-generated Seat rows
            int typeIndex = 0;
            foreach (var tt in createEventDto.TicketTypes)
            {
                var ticketType = new TicketType
                {
                    Name = tt.Name,
                    Price = tt.Price,
                    Capacity = tt.Capacity,
                    CreatedAt = DateTime.UtcNow,
                    Event = e
                };

                char rowLetter = (char)('A' + (typeIndex % 26));
                for (int i = 1; i <= tt.Capacity; i++)
                {
                    ticketType.Seats.Add(new Seat
                    {
                        SeatNumber = $"{rowLetter}-{i}",
                        IsReserved = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                e.TicketTypes.Add(ticketType);
                typeIndex++;
            }

            await _eventRepository.AddAsync(e);
            await _eventRepository.SaveChangesAsync();

            // Upload image AFTER saving so we can use the new Event.Id as the blob name
            if (image != null)
            {
                string ext = System.IO.Path.GetExtension(image.FileName);
                string blobName = $"events/{e.Id}/poster{ext}";
                e.ImageUrl = await _blobStorageService.UploadImageAsync(image, blobName);
                _eventRepository.Update(e);
                await _eventRepository.SaveChangesAsync();
            }

            var savedEvent = await _eventRepository.GetEventWithOrganizerAsync(e.Id);
            return MapToDto(savedEvent ?? e);
        }

        /// <summary>
        /// Updates an event. If a new image is supplied the old blob is deleted first,
        /// then the new one is uploaded. If no image is supplied the existing URL is retained.
        /// </summary>
        public async Task<bool> UpdateEventAsync(int id, CreateEventDto updateEventDto, int organizerId, IFormFile? image = null)
        {
            var e = await _eventRepository.GetByIdAsync(id);
            if (e == null) return false;

            if (e.OrganizerId != organizerId)
                throw new UnauthorizedAccessException("You are not authorized to modify another organizer's event.");

            e.Title = updateEventDto.Title;
            e.Description = updateEventDto.Description;
            e.Date = updateEventDto.Date;
            e.Location = updateEventDto.Location;
            e.TotalCapacity = updateEventDto.TotalCapacity;
            // Only change the category when one is supplied; otherwise keep the existing value
            if (!string.IsNullOrWhiteSpace(updateEventDto.Category))
                e.Category = updateEventDto.Category.Trim();
            e.UpdatedAt = DateTime.UtcNow;

            // Replace image: delete old blob → upload new blob → store new URL
            if (image != null)
            {
                await _blobStorageService.DeleteImageAsync(e.ImageUrl);
                string ext = System.IO.Path.GetExtension(image.FileName);
                string blobName = $"events/{e.Id}/poster{ext}";
                e.ImageUrl = await _blobStorageService.UploadImageAsync(image, blobName);
            }

            _eventRepository.Update(e);
            return await _eventRepository.SaveChangesAsync();
        }

        /// <summary>
        /// Deletes an event and its associated Blob image automatically.
        /// </summary>
        public async Task<bool> DeleteEventAsync(int id, int organizerId)
        {
            var e = await _eventRepository.GetByIdAsync(id);
            if (e == null) return false;

            if (e.OrganizerId != organizerId)
                throw new UnauthorizedAccessException("You are not authorized to delete another organizer's event.");

            // Delete the poster from Azure Blob Storage before removing the DB row
            await _blobStorageService.DeleteImageAsync(e.ImageUrl);

            // Delete related bookings first to satisfy the FK Restrict constraint
            var relatedBookings = await _bookingRepository.GetBookingsByEventIdAsync(id);
            foreach (var booking in relatedBookings)
            {
                _bookingRepository.Delete(booking);
            }

            _eventRepository.Delete(e);
            return await _eventRepository.SaveChangesAsync();
        }

        // -----------------------------------------------------------------------
        // Private helpers
        // -----------------------------------------------------------------------

        private static EventDto MapToDto(Event e) => new EventDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Date = e.Date,
            Location = e.Location,
            TotalCapacity = e.TotalCapacity,
            AvailableSeats = e.TicketTypes?.Sum(tt => tt.Capacity) ?? e.TotalCapacity,
            Price = e.TicketTypes != null && e.TicketTypes.Any() ? e.TicketTypes.Min(tt => tt.Price) : 0,
            OrganizerId = e.OrganizerId,
            OrganizerName = e.Organizer?.Name ?? "Unknown",
            ImageUrl = e.ImageUrl,
            Category = e.Category
        };
    }
}
