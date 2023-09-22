
import crypto from 'crypto'

// Function to generate a random salt
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Function to hash a password with a salt using SHA-256
function sha256WithSalt(password:string, salt:string) {
  const hash = crypto.createHash('sha256');
  hash.update(password + '25f58563b560f8261d65c13448e0c32f');
  return hash.digest('hex');
}

export {
  generateSalt,
  sha256WithSalt
}
