namespace Passly.Abstractions.Interfaces;

public interface IEmbeddingService
{
    Task<float[][]> GenerateEmbeddingsAsync(
        IReadOnlyList<string> texts,
        CancellationToken ct = default);
}
