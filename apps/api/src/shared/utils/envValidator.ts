/**
 * Utility to validate required environment variables in production
 */

interface EnvRequirement {
  name: string;
  requiredInProd: boolean;
  description: string;
}

const REQUIRED_VARS: EnvRequirement[] = [
  {
    name: 'JWT_SECRET',
    requiredInProd: true,
    description: 'Secret key for Access Tokens'
  },
  {
    name: 'REFRESH_TOKEN_SECRET',
    requiredInProd: true,
    description: 'Secret key for Refresh Tokens'
  },
  {
    name: 'CREDENTIAL_ENCRYPTION_KEY',
    requiredInProd: true,
    description: '32-character key for encrypting database credentials'
  },
  {
    name: 'SETUP_TOKEN',
    requiredInProd: true,
    description: 'Security token for initial setup wizard'
  },
  {
    name: 'FRONTEND_ORIGIN',
    requiredInProd: true,
    description: 'CORS allowed origin (e.g., https://orqelis.io)'
  },
  {
    name: 'DATABASE_URL',
    requiredInProd: true,
    description: 'Database connection string'
  }
];

export const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const req of REQUIRED_VARS) {
    const value = process.env[req.name];

    if (!value || value.trim() === '') {
      if (isProd && req.requiredInProd) {
        errors.push(`- ${req.name}: Missing required variable. ${req.description}`);
      } else {
        warnings.push(`- ${req.name}: Not set. Using default or being unsecure.`);
      }
    } else if (req.name === 'CREDENTIAL_ENCRYPTION_KEY' && value.length < 32) {
      if (isProd) {
        errors.push(`- ${req.name}: Must be at least 32 characters long for production security.`);
      } else {
        warnings.push(`- ${req.name}: Too short. Recommended 32 characters.`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ CRITICAL ERROR: Missing or invalid environment variables for production:');
    errors.forEach(err => console.error(err));
    console.error('\nRefer to GUIA_DESPLIEGUE.md for configuration instructions.\n');
    
    // In production, we exit to prevent insecure or broken state
    if (isProd) {
      process.exit(1);
    }
  }

  if (warnings.length > 0 && !isProd) {
    console.warn('\n⚠️  Environment Warnings (Development):');
    warnings.forEach(warn => console.warn(warn));
    console.log('');
  }
};
