using Passly.Core.Services;

namespace Passly.Core.Tests.Services;

public sealed class OnnxEmbeddingServiceTests : IDisposable
{
    private const int EmbeddingDimension = 384;

    private readonly OnnxEmbeddingService? _sut;
    private readonly bool _modelAvailable;

    public OnnxEmbeddingServiceTests()
    {
        var modelDir = Path.Combine(AppContext.BaseDirectory, "Models");
        var modelPath = Path.Combine(modelDir, "all-MiniLM-L6-v2.onnx");
        var vocabPath = Path.Combine(modelDir, "vocab.txt");

        _modelAvailable = File.Exists(modelPath) && File.Exists(vocabPath);

        if (_modelAvailable)
            _sut = new OnnxEmbeddingService(modelPath, vocabPath);
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_EmptyList_ReturnsEmpty()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var result = await _sut!.GenerateEmbeddingsAsync([]);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_SingleText_Returns384Dimensions()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var result = await _sut!.GenerateEmbeddingsAsync(["Hello world"]);

        result.Should().HaveCount(1);
        result[0].Should().HaveCount(EmbeddingDimension);
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_OutputIsNormalized()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var result = await _sut!.GenerateEmbeddingsAsync(["This is a test sentence."]);

        var norm = 0f;
        foreach (var v in result[0])
            norm += v * v;
        norm = MathF.Sqrt(norm);

        norm.Should().BeApproximately(1.0f, 0.01f);
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_SimilarTextsProduceSimilarEmbeddings()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var result = await _sut!.GenerateEmbeddingsAsync([
            "I love spending time with you",
            "I enjoy being with you",
            "The quantum mechanics of black holes",
        ]);

        var simSimilar = CosineSimilarity(result[0], result[1]);
        var simDifferent = CosineSimilarity(result[0], result[2]);

        simSimilar.Should().BeGreaterThan(0.6f, "similar sentences should have high similarity");
        simDifferent.Should().BeLessThan(simSimilar, "unrelated sentences should be less similar");
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_BatchProducesSameResultsAsSingle()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var texts = new[] { "First sentence", "Second sentence", "Third sentence" };

        var batchResult = await _sut!.GenerateEmbeddingsAsync(texts);

        for (var i = 0; i < texts.Length; i++)
        {
            var singleResult = await _sut.GenerateEmbeddingsAsync([texts[i]]);
            var sim = CosineSimilarity(batchResult[i], singleResult[0]);
            sim.Should().BeGreaterThan(0.99f,
                $"batch and single results should be nearly identical for text[{i}]");
        }
    }

    [Fact]
    public async Task GenerateEmbeddingsAsync_MultipleTexts_ReturnsCorrectCount()
    {
        Assert.SkipWhen(!_modelAvailable, "ONNX model not downloaded. Run scripts/download-model.sh");

        var texts = Enumerable.Range(0, 10).Select(i => $"Message number {i}").ToList();
        var result = await _sut!.GenerateEmbeddingsAsync(texts);

        result.Should().HaveCount(10);
        foreach (var embedding in result)
            embedding.Should().HaveCount(EmbeddingDimension);
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        var dot = 0f;
        var normA = 0f;
        var normB = 0f;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (MathF.Sqrt(normA) * MathF.Sqrt(normB));
    }

    public void Dispose() => _sut?.Dispose();
}
