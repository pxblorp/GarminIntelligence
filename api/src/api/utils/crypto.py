
import os
import base64
from cryptography.fernet import Fernet

class CryptoManager:
    
    def __init__(self):
        """
        Initialize CryptoManager with an encryption key.
        
        Args:
            key: Base64-encoded Fernet key. If None, loads from SECRET_KEY env var.
        """
        key = os.getenv("SECRET_KEY")
        if not key:
            raise ValueError(
                "SECRET_KEY environment variable must be set. "
                "Generate one with: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
                )
        
        self.cipher_suite = Fernet(key.encode() )

    def hash_password(self, password: str) -> str:
        """
        Hash a password using Fernet symmetric encryption.
        
        Args:
            password: Plain text password to hash.
            
        Returns:
            Base64-encoded hashed password.
        """
        hashed = self.cipher_suite.encrypt(password.encode())
        return base64.b64encode(hashed).decode()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verify a password against a hashed value.
        
        Args:
            password: Plain text password to verify.
            hashed: Base64-encoded hashed password.
            
        Returns:
            True if the password matches the hash, False otherwise.
        """
        try:
            decoded_hashed = base64.b64decode(hashed.encode())
            decrypted = self.cipher_suite.decrypt(decoded_hashed).decode()
            return decrypted == password
        except Exception:
            return False
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt a string using Fernet symmetric encryption.
        
        Args:
            data: Plain text string to encrypt.
            
        Returns:
            Base64-encoded encrypted string.
        """
        encrypted = self.cipher_suite.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt a Fernet-encrypted string.
        
        Args:
            encrypted_data: Base64-encoded encrypted string.
            
        Returns:
            Decrypted plain text string.
        """
        try:
            encrypted = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher_suite.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {e}")


crypto_manager = CryptoManager()