using Passly.Core.ChatImports;

namespace Passly.Core.Tests.ChatImports;

public sealed class WhatsAppChatParserTests
{
    private readonly WhatsAppChatParser _sut = new();

    [Fact]
    public void Parse_StandardMessages_ReturnsCorrectCount()
    {
        var input = """
            [06/15/23, 9:41:23 AM] Alex Johnson: Hey! I just landed
            [06/15/23, 9:42:01 AM] Sam Rivera: How was the flight?
            [06/15/23, 9:42:45 AM] Alex Johnson: Long but worth it
            """;

        var result = _sut.Parse(input);

        result.Should().HaveCount(3);
    }

    [Fact]
    public void Parse_StandardMessage_ExtractsSenderAndContent()
    {
        var input = "[06/15/23, 9:41:23 AM] Alex Johnson: Hey! I just landed";

        var result = _sut.Parse(input);

        result.Should().ContainSingle();
        result[0].SenderName.Should().Be("Alex Johnson");
        result[0].Content.Should().Be("Hey! I just landed");
    }

    [Fact]
    public void Parse_StandardMessage_ParsesTimestamp()
    {
        var input = "[06/15/23, 9:41:23 AM] Alex Johnson: Hey!";

        var result = _sut.Parse(input);

        result[0].Timestamp.Month.Should().Be(6);
        result[0].Timestamp.Day.Should().Be(15);
        result[0].Timestamp.Year.Should().Be(2023);
        result[0].Timestamp.Hour.Should().Be(9);
        result[0].Timestamp.Minute.Should().Be(41);
        result[0].Timestamp.Second.Should().Be(23);
    }

    [Fact]
    public void Parse_PmTimestamp_ParsesCorrectly()
    {
        var input = "[07/04/23, 11:45:22 PM] Alex Johnson: Best fireworks ever";

        var result = _sut.Parse(input);

        result[0].Timestamp.Hour.Should().Be(23);
        result[0].Timestamp.Minute.Should().Be(45);
    }

    [Fact]
    public void Parse_SystemMessage_IsSkipped()
    {
        var input = """
            [06/15/23, 9:41:23 AM] Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.
            [06/15/23, 9:41:23 AM] Alex Johnson: Hey!
            """;

        var result = _sut.Parse(input);

        result.Should().ContainSingle();
        result[0].SenderName.Should().Be("Alex Johnson");
    }

    [Fact]
    public void Parse_AttachmentMessage_IsSkipped()
    {
        var input = """
            [06/15/23, 9:41:23 AM] Alex Johnson: Hey!
            [06/17/23, 6:47:03 PM] Alex Johnson: <attached: 00000001-PHOTO-2023-06-17-18-47-03.jpg>
            [06/17/23, 6:48:00 PM] Sam Rivera: Nice photo!
            """;

        var result = _sut.Parse(input);

        result.Should().HaveCount(2);
        result[0].Content.Should().Be("Hey!");
        result[1].Content.Should().Be("Nice photo!");
    }

    [Fact]
    public void Parse_AssignsSequentialMessageIndex()
    {
        var input = """
            [06/15/23, 9:41:23 AM] Alex Johnson: First
            [06/15/23, 9:42:01 AM] Sam Rivera: Second
            [06/15/23, 9:42:45 AM] Alex Johnson: Third
            """;

        var result = _sut.Parse(input);

        result[0].MessageIndex.Should().Be(0);
        result[1].MessageIndex.Should().Be(1);
        result[2].MessageIndex.Should().Be(2);
    }

    [Fact]
    public void Parse_MultilineMessage_CombinesLines()
    {
        var input = """
            [06/15/23, 9:41:23 AM] Alex Johnson: Line one
            continued on next line
            [06/15/23, 9:42:01 AM] Sam Rivera: Reply
            """;

        var result = _sut.Parse(input);

        result.Should().HaveCount(2);
        result[0].Content.Should().Be("Line one\ncontinued on next line");
    }

    [Fact]
    public void Parse_EmptyInput_ReturnsEmptyList()
    {
        var result = _sut.Parse("");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_SampleFile_ParsesExpectedMessages()
    {
        var input = File.ReadAllText("../../../../../samples/whatsapp-export-sample.txt");

        var result = _sut.Parse(input);

        // Sample has 52 lines; system message and 3 attachment lines should be skipped
        result.Should().HaveCountGreaterThan(30);
        result[0].SenderName.Should().Be("Alex Johnson");
        result.Should().OnlyContain(m => m.SenderName == "Alex Johnson" || m.SenderName == "Sam Rivera");
    }

    [Fact]
    public void Parse_TwoDigitHour_ParsesCorrectly()
    {
        var input = "[06/15/23, 12:41:23 PM] Alex Johnson: Noon message";

        var result = _sut.Parse(input);

        result.Should().ContainSingle();
        result[0].Timestamp.Hour.Should().Be(12);
    }
}
