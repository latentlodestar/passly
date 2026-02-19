namespace Passly.Abstractions.Contracts;

public sealed record GenerateSubmissionSummaryRequest(string DeviceId, string Passphrase, string? SignatureBase64);
