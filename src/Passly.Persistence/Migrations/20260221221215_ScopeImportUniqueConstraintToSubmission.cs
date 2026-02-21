using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ScopeImportUniqueConstraintToSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_chat_imports_SubmissionId",
                schema: "app",
                table: "chat_imports");

            migrationBuilder.DropIndex(
                name: "IX_chat_imports_UserId_FileHash",
                schema: "app",
                table: "chat_imports");

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_SubmissionId_FileHash",
                schema: "app",
                table: "chat_imports",
                columns: new[] { "SubmissionId", "FileHash" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_chat_imports_SubmissionId_FileHash",
                schema: "app",
                table: "chat_imports");

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_SubmissionId",
                schema: "app",
                table: "chat_imports",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_chat_imports_UserId_FileHash",
                schema: "app",
                table: "chat_imports",
                columns: new[] { "UserId", "FileHash" },
                unique: true);
        }
    }
}
