using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSummaryContentAndOptionalPdf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make PDF fields nullable
            migrationBuilder.AlterColumn<byte[]>(
                name: "Tag",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea");

            migrationBuilder.AlterColumn<byte[]>(
                name: "Salt",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea");

            migrationBuilder.AlterColumn<byte[]>(
                name: "Iv",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea");

            migrationBuilder.AlterColumn<byte[]>(
                name: "EncryptedPdf",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea");

            // Add content columns only if they don't already exist
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'app' AND table_name = 'submission_summaries' AND column_name = 'ContentIv') THEN
                        ALTER TABLE app.submission_summaries ADD COLUMN "ContentIv" bytea NOT NULL DEFAULT '\x';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'app' AND table_name = 'submission_summaries' AND column_name = 'ContentSalt') THEN
                        ALTER TABLE app.submission_summaries ADD COLUMN "ContentSalt" bytea NOT NULL DEFAULT '\x';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'app' AND table_name = 'submission_summaries' AND column_name = 'ContentTag') THEN
                        ALTER TABLE app.submission_summaries ADD COLUMN "ContentTag" bytea NOT NULL DEFAULT '\x';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'app' AND table_name = 'submission_summaries' AND column_name = 'EncryptedContent') THEN
                        ALTER TABLE app.submission_summaries ADD COLUMN "EncryptedContent" bytea NOT NULL DEFAULT '\x';
                    END IF;
                END $$;
                """);
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

            migrationBuilder.AlterColumn<byte[]>(
                name: "Tag",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "Salt",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "Iv",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "EncryptedPdf",
                schema: "app",
                table: "submission_summaries",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);
        }
    }
}
