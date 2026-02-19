namespace Passly.Persistence.Models;

public sealed class SubmissionSummary
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid ChatImportId { get; set; }
    public byte[]? EncryptedPdf { get; set; }
    public byte[]? Salt { get; set; }
    public byte[]? Iv { get; set; }
    public byte[]? Tag { get; set; }
    public required byte[] EncryptedContent { get; set; }
    public required byte[] ContentSalt { get; set; }
    public required byte[] ContentIv { get; set; }
    public required byte[] ContentTag { get; set; }
    public byte[]? EncryptedSignature { get; set; }
    public byte[]? SignatureSalt { get; set; }
    public byte[]? SignatureIv { get; set; }
    public byte[]? SignatureTag { get; set; }
    public int TotalMessages { get; set; }
    public int SelectedMessages { get; set; }
    public int GapCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public bool HasPdf => EncryptedPdf is not null;
    public bool HasSignature => EncryptedSignature is not null;

    public Submission Submission { get; set; } = null!;
    public ChatImport ChatImport { get; set; } = null!;
}
