using System;
using System.Collections.Generic;

namespace OnlineEventTicketManagement.DTOs
{
    /// <summary>Possible outcomes of a check-in attempt (the "Result" field).</summary>
    public static class CheckInResults
    {
        public const string Admitted = "Admitted";
        public const string AlreadyUsed = "AlreadyUsed";
        public const string Invalid = "Invalid";
        public const string WrongEvent = "WrongEvent";
        public const string Cancelled = "Cancelled";
    }

    public class CheckInResultDto
    {
        public string Result { get; set; } = CheckInResults.Invalid;
        public string Message { get; set; } = string.Empty;

        // The fields below are filled only for Admitted / AlreadyUsed / Cancelled.
        public int AdmitCount { get; set; }
        public string? AttendeeName { get; set; }
        public string? EventTitle { get; set; }
        public string? TicketTypeName { get; set; }
        public List<string> Seats { get; set; } = new();
        public DateTime? CheckedInAt { get; set; }
    }
}
