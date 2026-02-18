namespace Passly.Persistence.Models;

public sealed class SubmissionSummary
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid ChatImportId { get; set; }
    public required byte[] EncryptedPdf { get; set; }
    public required byte[] Salt { get; set; }
    public required byte[] Iv { get; set; }
    public required byte[] Tag { get; set; }
    public int TotalMessages { get; set; }
    public int SelectedMessages { get; set; }
    public int GapCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Submission Submission { get; set; } = null!;
    public ChatImport ChatImport { get; set; } = null!;
}
