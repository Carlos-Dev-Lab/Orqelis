import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const secret = process.env.JWT_SECRET || 'secret';
console.log('Using secret from environment');

const payload = { id: 'test-id', email: 'test@example.com', role: 'admin' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('Generated token:', token);

try {
  const decoded = jwt.verify(token, secret);
  console.log('Decoded payload:', decoded);
  
  if (typeof decoded === 'object' && decoded.id === payload.id) {
    console.log('SUCCESS: Token verified and payload matches.');
  } else {
    console.error('FAILURE: Payload mismatch.');
    process.exit(1);
  }
} catch (err) {
  console.error('FAILURE: Token verification failed.', err);
  process.exit(1);
}

// Test invalid token
try {
  jwt.verify('invalid-token', secret);
  console.error('FAILURE: Invalid token was accepted.');
  process.exit(1);
} catch (err) {
  console.log('SUCCESS: Invalid token rejected as expected.');
}

// Test with wrong secret
try {
  jwt.verify(token, 'wrong-secret');
  console.error('FAILURE: Token accepted with wrong secret.');
  process.exit(1);
} catch (err) {
  console.log('SUCCESS: Token with wrong secret rejected as expected.');
}
