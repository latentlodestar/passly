using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameDeviceIdToUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DeviceId",
                schema: "app",
                table: "submissions",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_submissions_DeviceId",
                schema: "app",
                table: "submissions",
                newName: "IX_submissions_UserId");

            migrationBuilder.RenameColumn(
                name: "DeviceId",
                schema: "app",
                table: "chat_imports",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_chat_imports_DeviceId_FileHash",
                schema: "app",
                table: "chat_imports",
                newName: "IX_chat_imports_UserId_FileHash");

            migrationBuilder.RenameIndex(
                name: "IX_chat_imports_DeviceId",
                schema: "app",
                table: "chat_imports",
                newName: "IX_chat_imports_UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UserId",
                schema: "app",
                table: "submissions",
                newName: "DeviceId");

            migrationBuilder.RenameIndex(
                name: "IX_submissions_UserId",
                schema: "app",
                table: "submissions",
                newName: "IX_submissions_DeviceId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                schema: "app",
                table: "chat_imports",
                newName: "DeviceId");

            migrationBuilder.RenameIndex(
                name: "IX_chat_imports_UserId_FileHash",
                schema: "app",
                table: "chat_imports",
                newName: "IX_chat_imports_DeviceId_FileHash");

            migrationBuilder.RenameIndex(
                name: "IX_chat_imports_UserId",
                schema: "app",
                table: "chat_imports",
                newName: "IX_chat_imports_DeviceId");
        }
    }
}
