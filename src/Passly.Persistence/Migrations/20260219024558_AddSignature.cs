using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSignature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "EncryptedSignature",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "SignatureIv",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "SignatureSalt",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "SignatureTag",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedSignature",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "SignatureIv",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "SignatureSalt",
                schema: "app",
                table: "submission_summaries");

            migrationBuilder.DropColumn(
                name: "SignatureTag",
                schema: "app",
                table: "submission_summaries");
        }
    }
}
