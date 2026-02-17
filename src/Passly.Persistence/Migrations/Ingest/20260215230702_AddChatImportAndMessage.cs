using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations.Ingest
{
    /// <inheritdoc />
    public partial class AddChatImportAndMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ingest");

            migrationBuilder.CreateTable(
                name: "chat_imports",
                schema: "ingest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
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
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                schema: "ingest",
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
                        principalSchema: "ingest",
                        principalTable: "chat_imports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_DeviceId",
                schema: "ingest",
                table: "chat_imports",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_DeviceId_FileHash",
                schema: "ingest",
                table: "chat_imports",
                columns: new[] { "DeviceId", "FileHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_ChatImportId",
                schema: "ingest",
                table: "chat_messages",
                column: "ChatImportId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_ChatImportId_Timestamp",
                schema: "ingest",
                table: "chat_messages",
                columns: new[] { "ChatImportId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_messages",
                schema: "ingest");

            migrationBuilder.DropTable(
                name: "chat_imports",
                schema: "ingest");
        }
    }
}
