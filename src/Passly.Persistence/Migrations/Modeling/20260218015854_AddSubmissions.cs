using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations.Modeling
{
    /// <inheritdoc />
    public partial class AddSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "modeling");

            migrationBuilder.CreateTable(
                name: "submissions",
                schema: "modeling",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentStep = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_submissions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_submissions_DeviceId",
                schema: "modeling",
                table: "submissions",
                column: "DeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "submissions",
                schema: "modeling");
        }
    }
}
