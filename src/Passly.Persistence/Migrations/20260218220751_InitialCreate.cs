using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "app");

            migrationBuilder.CreateTable(
                name: "submissions",
                schema: "app",
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

            migrationBuilder.CreateTable(
                name: "chat_imports",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileHash = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    EncryptedRawContent = table.Column<byte[]>(type: "bytea", nullable: false),
                    Salt = table.Column<byte[]>(type: "bytea", nullable: false),
                    Iv = table.Column<byte[]>(type: "bytea", nullable: false),
                    Tag = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_imports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chat_imports_submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalSchema: "app",
                        principalTable: "submissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatImportId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncryptedSenderName = table.Column<byte[]>(type: "bytea", nullable: false),
                    EncryptedContent = table.Column<byte[]>(type: "bytea", nullable: false),
                    Salt = table.Column<byte[]>(type: "bytea", nullable: false),
                    Iv = table.Column<byte[]>(type: "bytea", nullable: false),
                    Tag = table.Column<byte[]>(type: "bytea", nullable: false),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    MessageIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chat_messages_chat_imports_ChatImportId",
                        column: x => x.ChatImportId,
                        principalSchema: "app",
                        principalTable: "chat_imports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "submission_summaries",
                schema: "app",
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
                        name: "FK_submission_summaries_chat_imports_ChatImportId",
                        column: x => x.ChatImportId,
                        principalSchema: "app",
                        principalTable: "chat_imports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_submission_summaries_submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalSchema: "app",
                        principalTable: "submissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_DeviceId",
                schema: "app",
                table: "chat_imports",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_DeviceId_FileHash",
                schema: "app",
                table: "chat_imports",
                columns: new[] { "DeviceId", "FileHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_SubmissionId",
                schema: "app",
                table: "chat_imports",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_ChatImportId",
                schema: "app",
                table: "chat_messages",
                column: "ChatImportId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_ChatImportId_Timestamp",
                schema: "app",
                table: "chat_messages",
                columns: new[] { "ChatImportId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_submission_summaries_ChatImportId",
                schema: "app",
                table: "submission_summaries",
                column: "ChatImportId");

            migrationBuilder.CreateIndex(
                name: "IX_submission_summaries_SubmissionId",
                schema: "app",
                table: "submission_summaries",
                column: "SubmissionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_submissions_DeviceId",
                schema: "app",
                table: "submissions",
                column: "DeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_messages",
                schema: "app");

            migrationBuilder.DropTable(
                name: "submission_summaries",
                schema: "app");

            migrationBuilder.DropTable(
                name: "chat_imports",
                schema: "app");

            migrationBuilder.DropTable(
                name: "submissions",
                schema: "app");
        }
    }
}
