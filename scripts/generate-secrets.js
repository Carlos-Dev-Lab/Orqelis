const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const generateSecret = (length = 32) => crypto.randomBytes(length).toString('hex');

const secrets = {
  JWT_SECRET: generateSecret(),
  REFRESH_TOKEN_SECRET: generateSecret(),
  CREDENTIAL_ENCRYPTION_KEY: generateSecret(),
  SETUP_TOKEN: generateSecret(16),
};

console.log('--- GENERATED SECRETS ---');
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}="${value}"`);
});
console.log('-------------------------');

const envPath = path.join(process.cwd(), '.env');
const templatePath = path.join(process.cwd(), '.env.template');

if (!fs.existsSync(envPath) && fs.existsSync(templatePath)) {
  let content = fs.readFileSync(templatePath, 'utf8');

  // Inyectar secretos generados
  Object.entries(secrets).forEach(([key, value]) => {
    const regex = new RegExp(`${key}=""`, 'g');
    content = content.replace(regex, `${key}="${value}"`);
  });

  // Asegurar que existan variables mínimas de base de datos en el .env raíz
  if (!/\nDATABASE_URL=/.test(content)) {
    content += `\n# Database (por defecto SQLite local)\nDATABASE_URL="file:./dev.db"\nDB_PROVIDER="sqlite"\n`;
  }

  // También establecer NODE_ENV a production si se usa para despliegue
  content = content.replace(/NODE_ENV="development"/g, 'NODE_ENV="production"');

  fs.writeFileSync(envPath, content);
  console.log('\n✅ Creado .env con secretos generados y configuraciones básicas (incluye DATABASE_URL y DB_PROVIDER si faltaban).');
} else if (fs.existsSync(envPath)) {
  console.log('\n⚠️  .env file already exists. Copy the secrets manually if needed.');
} else {
  console.log('\n⚠️  .env.template not found. Secrets generated but not saved to file.');
}
