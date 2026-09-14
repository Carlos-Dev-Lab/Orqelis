import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = (): Buffer => {
  let key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY is required in production');
    }
    // Insecure fallback for development only
    return Buffer.from('dev-key-must-be-32-bytes-exactly!!').subarray(0, 32);
  }

  try {
    const keyBuffer = Buffer.from(key, key.length === 64 ? 'hex' : 'base64');
    if (keyBuffer.length !== 32) {
      throw new Error(`Invalid key length: ${keyBuffer.length} bytes. Must be 32 bytes.`);
    }
    return keyBuffer;
  } catch (error: any) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be a 32-byte string (base64 or hex encoded): ' + error.message);
  }
};

export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

export function decrypt(encrypted: string, ivHex: string, authTagHex: string): string {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
