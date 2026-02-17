using Rebus.Handlers;
using Passly.Abstractions.Contracts;

namespace Passly.Core.Ingest;

public sealed class ChatImportCreatedHandler(ParseChatImportHandler parser) : IHandleMessages<ChatImportCreated>
{
    public Task Handle(ChatImportCreated message) =>
        parser.HandleAsync(message.ChatImportId, message.Passphrase);
}
