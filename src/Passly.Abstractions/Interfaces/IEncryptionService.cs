namespace Passly.Abstractions.Interfaces;

public record EncryptionResult(byte[] Ciphertext, byte[] Salt, byte[] Iv, byte[] Tag);

public interface IEncryptionService
{
    EncryptionResult Encrypt(byte[] plaintext, string passphrase);
    byte[] Decrypt(byte[] ciphertext, string passphrase, byte[] salt, byte[] iv, byte[] tag);
}
