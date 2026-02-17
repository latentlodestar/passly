using System.Security.Cryptography;
using Passly.Abstractions.Interfaces;

namespace Passly.Core.Services;

internal sealed class AesGcmEncryptionService : IEncryptionService
{
    private const int KeySizeBytes = 32;
    private const int SaltSizeBytes = 32;
    private const int IvSizeBytes = 12;
    private const int TagSizeBytes = 16;
    private const int Pbkdf2Iterations = 100_000;

    public EncryptionResult Encrypt(byte[] plaintext, string passphrase)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        var iv = RandomNumberGenerator.GetBytes(IvSizeBytes);
        var key = DeriveKey(passphrase, salt);

        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[TagSizeBytes];

        using var aes = new AesGcm(key, TagSizeBytes);
        aes.Encrypt(iv, plaintext, ciphertext, tag);

        return new EncryptionResult(ciphertext, salt, iv, tag);
    }

    public byte[] Decrypt(byte[] ciphertext, string passphrase, byte[] salt, byte[] iv, byte[] tag)
    {
        var key = DeriveKey(passphrase, salt);
        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(key, TagSizeBytes);
        aes.Decrypt(iv, ciphertext, tag, plaintext);

        return plaintext;
    }

    private static byte[] DeriveKey(string passphrase, byte[] salt) =>
        Rfc2898DeriveBytes.Pbkdf2(passphrase, salt, Pbkdf2Iterations, HashAlgorithmName.SHA256, KeySizeBytes);
}
