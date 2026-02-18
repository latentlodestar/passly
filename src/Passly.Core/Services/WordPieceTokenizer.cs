namespace Passly.Core.Services;

internal sealed class WordPieceTokenizer
{
    private const string UnknownToken = "[UNK]";
    private const int MaxWordLength = 200;

    private readonly Dictionary<string, int> _vocab;

    public int ClsTokenId { get; }
    public int SepTokenId { get; }
    public int PadTokenId { get; }

    public WordPieceTokenizer(string vocabPath)
    {
        _vocab = new Dictionary<string, int>();
        var lines = File.ReadAllLines(vocabPath);
        for (var i = 0; i < lines.Length; i++)
            _vocab[lines[i]] = i;

        ClsTokenId = _vocab["[CLS]"];
        SepTokenId = _vocab["[SEP]"];
        PadTokenId = _vocab["[PAD]"];
    }

    public TokenizedInput Tokenize(string text, int maxLength = 128)
    {
        var tokens = new List<int> { ClsTokenId };

        var words = BasicTokenize(text);
        foreach (var word in words)
        {
            var subTokens = WordPieceTokenize(word);
            foreach (var subToken in subTokens)
            {
                if (tokens.Count >= maxLength - 1)
                    break;
                tokens.Add(subToken);
            }
            if (tokens.Count >= maxLength - 1)
                break;
        }

        tokens.Add(SepTokenId);

        var inputIds = new long[maxLength];
        var attentionMask = new long[maxLength];
        var tokenTypeIds = new long[maxLength];

        for (var i = 0; i < tokens.Count; i++)
        {
            inputIds[i] = tokens[i];
            attentionMask[i] = 1;
        }

        for (var i = tokens.Count; i < maxLength; i++)
        {
            inputIds[i] = PadTokenId;
            attentionMask[i] = 0;
        }

        return new TokenizedInput(inputIds, attentionMask, tokenTypeIds);
    }

    private List<string> BasicTokenize(string text)
    {
        text = text.ToLowerInvariant();
        var result = new List<string>();
        var current = new System.Text.StringBuilder();

        foreach (var c in text)
        {
            if (char.IsWhiteSpace(c))
            {
                if (current.Length > 0)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
            }
            else if (char.IsPunctuation(c) || char.IsSymbol(c))
            {
                if (current.Length > 0)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                result.Add(c.ToString());
            }
            else
            {
                current.Append(c);
            }
        }

        if (current.Length > 0)
            result.Add(current.ToString());

        return result;
    }

    private List<int> WordPieceTokenize(string word)
    {
        if (word.Length > MaxWordLength)
            return [_vocab.GetValueOrDefault(UnknownToken, 0)];

        var tokens = new List<int>();
        var start = 0;

        while (start < word.Length)
        {
            var end = word.Length;
            var found = false;

            while (start < end)
            {
                var substr = start > 0 ? "##" + word[start..end] : word[start..end];

                if (_vocab.TryGetValue(substr, out var id))
                {
                    tokens.Add(id);
                    found = true;
                    start = end;
                    break;
                }

                end--;
            }

            if (!found)
            {
                tokens.Add(_vocab.GetValueOrDefault(UnknownToken, 0));
                break;
            }
        }

        return tokens;
    }
}

internal sealed record TokenizedInput(long[] InputIds, long[] AttentionMask, long[] TokenTypeIds);
