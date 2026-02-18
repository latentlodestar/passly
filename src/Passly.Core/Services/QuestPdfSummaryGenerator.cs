using Passly.Abstractions.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Passly.Core.Services;

internal sealed class QuestPdfSummaryGenerator : ISummaryPdfGenerator
{
    public byte[] Generate(SummaryPdfData data)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(c => ComposeHeader(c, data));
                page.Content().Element(c => ComposeContent(c, data));
                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Page ");
                    t.CurrentPageNumber();
                    t.Span(" of ");
                    t.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, SummaryPdfData data)
    {
        container.Column(col =>
        {
            col.Item().Text("Communication Summary Report")
                .FontSize(18).Bold().FontColor(Colors.Blue.Darken3);
            col.Item().PaddingTop(4).Text(data.SubmissionLabel)
                .FontSize(12).SemiBold();
            col.Item().PaddingTop(2).Text(
                $"{data.EarliestMessage:yyyy-MM-dd} to {data.LatestMessage:yyyy-MM-dd}")
                .FontSize(10).FontColor(Colors.Grey.Darken1);
            col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
        });
    }

    private static void ComposeContent(IContainer container, SummaryPdfData data)
    {
        container.PaddingTop(12).Column(col =>
        {
            col.Spacing(16);

            // Section 1: Overview
            col.Item().Element(c => ComposeOverview(c, data));

            // Section 2: Communication Gaps
            if (data.Gaps.Count > 0)
                col.Item().Element(c => ComposeGaps(c, data));

            // Section 3: Representative Messages
            col.Item().Element(c => ComposeMessages(c, data));
        });
    }

    private static void ComposeOverview(IContainer container, SummaryPdfData data)
    {
        container.Column(col =>
        {
            col.Item().Text("Communication Overview").FontSize(14).Bold();
            col.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(3);
                });

                table.Cell().Border(0.5f).Padding(6).Text("Total Messages").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text(data.TotalMessages.ToString("N0"));

                table.Cell().Border(0.5f).Padding(6).Text("Selected Messages").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text(data.RepresentativeMessages.Count.ToString("N0"));

                table.Cell().Border(0.5f).Padding(6).Text("Communication Gaps").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text(data.Gaps.Count.ToString("N0"));

                table.Cell().Border(0.5f).Padding(6).Text("Date Range").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text(
                    $"{data.EarliestMessage:yyyy-MM-dd} — {data.LatestMessage:yyyy-MM-dd}");

                foreach (var (window, count) in data.MessageCountByTimeWindow.OrderBy(kv => kv.Key))
                {
                    table.Cell().Border(0.5f).Padding(6).Text(window).SemiBold();
                    table.Cell().Border(0.5f).Padding(6).Text(count.ToString("N0"));
                }
            });
        });
    }

    private static void ComposeGaps(IContainer container, SummaryPdfData data)
    {
        container.Column(col =>
        {
            col.Item().Text("Communication Gaps").FontSize(14).Bold();
            col.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                table.Cell().Border(0.5f).Padding(6).Text("Start").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text("End").SemiBold();
                table.Cell().Border(0.5f).Padding(6).Text("Duration").SemiBold();

                foreach (var gap in data.Gaps.OrderBy(g => g.Start))
                {
                    table.Cell().Border(0.5f).Padding(6).Text(gap.Start.ToString("yyyy-MM-dd"));
                    table.Cell().Border(0.5f).Padding(6).Text(gap.End.ToString("yyyy-MM-dd"));
                    table.Cell().Border(0.5f).Padding(6).Text($"{gap.Duration.Days} days");
                }
            });
        });
    }

    private static void ComposeMessages(IContainer container, SummaryPdfData data)
    {
        container.Column(col =>
        {
            col.Item().Text("Representative Messages").FontSize(14).Bold();

            var grouped = data.RepresentativeMessages
                .GroupBy(m => m.TimeWindow)
                .OrderBy(g => g.Min(m => m.Timestamp));

            foreach (var group in grouped)
            {
                col.Item().PaddingTop(10).Text(group.Key)
                    .FontSize(11).SemiBold().FontColor(Colors.Blue.Darken2);

                foreach (var msg in group.OrderBy(m => m.Timestamp))
                {
                    col.Item().PaddingTop(4).Row(row =>
                    {
                        row.AutoItem().MinWidth(80).Text(msg.Timestamp.ToString("yyyy-MM-dd"))
                            .FontSize(9).FontColor(Colors.Grey.Darken1);
                        row.AutoItem().MinWidth(80).Text(msg.SenderName)
                            .FontSize(9).SemiBold();
                        row.RelativeItem().Text(msg.Content).FontSize(9);
                    });
                }
            }
        });
    }
}
