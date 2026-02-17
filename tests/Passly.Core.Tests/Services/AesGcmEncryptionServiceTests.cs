using System.Text;
using Passly.Core.Services;

namespace Passly.Core.Tests.Services;

public sealed class AesGcmEncryptionServiceTests
{
    private readonly AesGcmEncryptionService _sut = new();

    [Fact]
    public void Encrypt_Decrypt_RoundTrip_ReturnsOriginalPlaintext()
    {
        var plaintext = Encoding.UTF8.GetBytes("Hello, WhatsApp evidence!");
        const string passphrase = "test-passphrase-12345";

        var encrypted = _sut.Encrypt(plaintext, passphrase);
        var decrypted = _sut.Decrypt(encrypted.Ciphertext, passphrase, encrypted.Salt, encrypted.Iv, encrypted.Tag);

        decrypted.Should().BeEquivalentTo(plaintext);
    }

    [Fact]
    public void Decrypt_WithWrongPassphrase_Throws()
    {
        var plaintext = Encoding.UTF8.GetBytes("Secret data");
        var encrypted = _sut.Encrypt(plaintext, "correct-passphrase");

        var act = () => _sut.Decrypt(encrypted.Ciphertext, "wrong-passphrase", encrypted.Salt, encrypted.Iv, encrypted.Tag);

        act.Should().Throw<Exception>();
    }

    [Fact]
    public void Encrypt_ProducesUniqueSaltAndIvPerCall()
    {
        var plaintext = Encoding.UTF8.GetBytes("Same data");
        const string passphrase = "same-passphrase-12345";

        var first = _sut.Encrypt(plaintext, passphrase);
        var second = _sut.Encrypt(plaintext, passphrase);

        first.Salt.Should().NotBeEquivalentTo(second.Salt);
        first.Iv.Should().NotBeEquivalentTo(second.Iv);
    }

    [Fact]
    public void Encrypt_ProducesCorrectFieldSizes()
    {
        var plaintext = Encoding.UTF8.GetBytes("Test data");
        var result = _sut.Encrypt(plaintext, "test-passphrase-12345");

        result.Salt.Should().HaveCount(32);
        result.Iv.Should().HaveCount(12);
        result.Tag.Should().HaveCount(16);
        result.Ciphertext.Should().HaveCount(plaintext.Length);
    }
}
