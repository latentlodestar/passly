namespace Passly.Abstractions.Contracts;

public sealed record GenerateSubmissionSummaryRequest(string Passphrase, string? SignatureBase64);
