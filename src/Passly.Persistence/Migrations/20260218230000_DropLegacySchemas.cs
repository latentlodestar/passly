using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Passly.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacySchemas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP SCHEMA IF EXISTS ingest CASCADE;");
            migrationBuilder.Sql("DROP SCHEMA IF EXISTS modeling CASCADE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "ingest");
            migrationBuilder.EnsureSchema(name: "modeling");
        }
    }
}
