using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineEventTicketManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketCodeAndCheckIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAt",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CheckedInByUserId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TicketCode",
                table: "Bookings",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            // Backfill a random 64-hex-character code for every existing booking BEFORE the unique index is created.
            migrationBuilder.Sql(
                "UPDATE [Bookings] SET [TicketCode] = LOWER(CONVERT(varchar(64), CRYPT_GEN_RANDOM(32), 2)) WHERE [TicketCode] IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TicketCode",
                table: "Bookings",
                column: "TicketCode",
                unique: true,
                filter: "[TicketCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_TicketCode",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CheckedInByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TicketCode",
                table: "Bookings");
        }
    }
}
