using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations.Modeling
{
    /// <inheritdoc />
    public partial class AddSubmissionSummaries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "submission_summaries",
                schema: "modeling",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatImportId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncryptedPdf = table.Column<byte[]>(type: "bytea", nullable: false),
                    Salt = table.Column<byte[]>(type: "bytea", nullable: false),
                    Iv = table.Column<byte[]>(type: "bytea", nullable: false),
                    Tag = table.Column<byte[]>(type: "bytea", nullable: false),
                    TotalMessages = table.Column<int>(type: "integer", nullable: false),
                    SelectedMessages = table.Column<int>(type: "integer", nullable: false),
                    GapCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_submission_summaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_submission_summaries_submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalSchema: "modeling",
                        principalTable: "submissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_submission_summaries_SubmissionId",
                schema: "modeling",
                table: "submission_summaries",
                column: "SubmissionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "submission_summaries",
                schema: "modeling");
        }
    }
}
