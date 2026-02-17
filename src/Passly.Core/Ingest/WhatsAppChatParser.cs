using System.Globalization;
using System.Text.RegularExpressions;

namespace Passly.Core.Ingest;

public sealed partial class WhatsAppChatParser
{
    // Matches: [MM/DD/YY, H:MM:SS AM/PM] Sender: Message
    [GeneratedRegex(@"^\[(\d{2}/\d{2}/\d{2},\s\d{1,2}:\d{2}:\d{2}\s[AP]M)\]\s(.+?):\s(.+)$")]
    private static partial Regex MessagePattern();

    private static readonly string[] TimestampFormats =
    [
        "MM/dd/yy, h:mm:ss tt",
        "MM/dd/yy, hh:mm:ss tt",
    ];

    public IReadOnlyList<ParsedMessage> Parse(string rawContent)
    {
        var messages = new List<ParsedMessage>();
        var lines = rawContent.Split('\n');
        var index = 0;

        ParsedMessage? current = null;

        foreach (var line in lines)
        {
            var match = MessagePattern().Match(line);
            if (match.Success)
            {
                var timestampStr = match.Groups[1].Value;
                var sender = match.Groups[2].Value;
                var content = match.Groups[3].Value;

                if (!DateTimeOffset.TryParseExact(
                        timestampStr,
                        TimestampFormats,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out var timestamp))
                {
                    continue;
                }

                // Skip system messages (no colon-separated sender in original, but regex requires it)
                // Skip attachment placeholders
                if (content.StartsWith("<attached:", StringComparison.OrdinalIgnoreCase))
                    continue;

                current = new ParsedMessage(sender.Trim(), content.Trim(), timestamp, index);
                messages.Add(current);
                index++;
            }
            else if (current is not null && !string.IsNullOrWhiteSpace(line))
            {
                // Continuation line — append to previous message
                current = current with { Content = current.Content + "\n" + line.Trim() };
                messages[^1] = current;
            }
        }

        return messages;
    }
}

public record ParsedMessage(string SenderName, string Content, DateTimeOffset Timestamp, int MessageIndex);
