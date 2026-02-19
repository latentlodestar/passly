using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSummaryEncryptedContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "ContentIv",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "ContentSalt",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "ContentTag",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "EncryptedContent",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentIv",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "ContentSalt",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "ContentTag",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "EncryptedContent",
                schema: "app",
                table: "submission_summaries");
        }
    }
}
