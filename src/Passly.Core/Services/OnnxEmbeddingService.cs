using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Passly.Abstractions.Interfaces;

namespace Passly.Core.Services;

internal sealed class OnnxEmbeddingService : IEmbeddingService, IDisposable
{
    private const int MaxTokenLength = 128;
    private const int EmbeddingDimension = 384;
    private const int BatchSize = 64;

    private readonly InferenceSession _session;
    private readonly WordPieceTokenizer _tokenizer;

    public OnnxEmbeddingService(string modelPath, string vocabPath)
    {
        var sessionOptions = new SessionOptions
        {
            GraphOptimizationLevel = GraphOptimizationLevel.ORT_ENABLE_ALL,
        };
        sessionOptions.AppendExecutionProvider_CPU();

        _session = new InferenceSession(modelPath, sessionOptions);
        _tokenizer = new WordPieceTokenizer(vocabPath);
    }

    public async Task<float[][]> GenerateEmbeddingsAsync(
        IReadOnlyList<string> texts,
        CancellationToken ct = default)
    {
        if (texts.Count == 0)
            return [];

        var results = new float[texts.Count][];

        for (var batchStart = 0; batchStart < texts.Count; batchStart += BatchSize)
        {
            ct.ThrowIfCancellationRequested();

            var batchEnd = Math.Min(batchStart + BatchSize, texts.Count);
            var batchSize = batchEnd - batchStart;

            var batchResults = await Task.Run(() =>
                RunBatchInference(texts, batchStart, batchSize), ct);

            Array.Copy(batchResults, 0, results, batchStart, batchSize);
        }

        return results;
    }

    private float[][] RunBatchInference(IReadOnlyList<string> texts, int offset, int count)
    {
        var inputIds = new long[count * MaxTokenLength];
        var attentionMask = new long[count * MaxTokenLength];
        var tokenTypeIds = new long[count * MaxTokenLength];

        for (var i = 0; i < count; i++)
        {
            var tokenized = _tokenizer.Tokenize(texts[offset + i], MaxTokenLength);
            Array.Copy(tokenized.InputIds, 0, inputIds, i * MaxTokenLength, MaxTokenLength);
            Array.Copy(tokenized.AttentionMask, 0, attentionMask, i * MaxTokenLength, MaxTokenLength);
            Array.Copy(tokenized.TokenTypeIds, 0, tokenTypeIds, i * MaxTokenLength, MaxTokenLength);
        }

        var inputIdsTensor = new DenseTensor<long>(inputIds, [count, MaxTokenLength]);
        var attentionMaskTensor = new DenseTensor<long>(attentionMask, [count, MaxTokenLength]);
        var tokenTypeIdsTensor = new DenseTensor<long>(tokenTypeIds, [count, MaxTokenLength]);

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input_ids", inputIdsTensor),
            NamedOnnxValue.CreateFromTensor("attention_mask", attentionMaskTensor),
            NamedOnnxValue.CreateFromTensor("token_type_ids", tokenTypeIdsTensor),
        };

        using var outputs = _session.Run(inputs);

        // Output shape: [batch_size, sequence_length, hidden_size]
        var tokenEmbeddings = outputs.First().AsTensor<float>();

        var results = new float[count][];
        for (var i = 0; i < count; i++)
        {
            results[i] = MeanPoolAndNormalize(tokenEmbeddings, attentionMask, i);
        }

        return results;
    }

    private static float[] MeanPoolAndNormalize(
        Tensor<float> tokenEmbeddings, long[] attentionMask, int batchIndex)
    {
        var embedding = new float[EmbeddingDimension];
        var maskSum = 0f;

        for (var t = 0; t < MaxTokenLength; t++)
        {
            var mask = attentionMask[batchIndex * MaxTokenLength + t];
            if (mask == 0) continue;

            maskSum += mask;
            for (var d = 0; d < EmbeddingDimension; d++)
            {
                embedding[d] += tokenEmbeddings[batchIndex, t, d] * mask;
            }
        }

        if (maskSum > 0)
        {
            for (var d = 0; d < EmbeddingDimension; d++)
                embedding[d] /= maskSum;
        }

        // L2 normalize
        var norm = 0f;
        for (var d = 0; d < EmbeddingDimension; d++)
            norm += embedding[d] * embedding[d];
        norm = MathF.Sqrt(norm);

        if (norm > 0)
        {
            for (var d = 0; d < EmbeddingDimension; d++)
                embedding[d] /= norm;
        }

        return embedding;
    }

    public void Dispose() => _session.Dispose();
}
