import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load dotenv manually to avoid external dependencies during first check
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();

console.log("🌸 Running IS TWO System Doctor Diagnostics... 🌸");
console.log("================================================");

let hasErrors = false;
let hasWarnings = false;

// 1. Check files existence
console.log("\n📁 Checking crucial project files:");
const requiredFiles = [
  { name: '.env', required: true, desc: 'Environment variables configuration' },
  { name: 'package.json', required: true, desc: 'Project dependencies and scripts' },
  { name: 'prisma/schema.prisma', required: true, desc: 'Database schema configuration' },
  { name: 'src/bot-polling.ts', required: true, desc: 'Telegram Bot polling entrypoint' }
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file.name);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file.name} - Found (${file.desc})`);
  } else {
    if (file.required) {
      console.log(`  ❌ ${file.name} - MISSING! (${file.desc})`);
      hasErrors = true;
    } else {
      console.log(`  ⚠️ ${file.name} - Missing (Optional: ${file.desc})`);
      hasWarnings = true;
    }
  }
}

// 2. Check environment variables
console.log("\n🔑 Validating environment configuration (.env):");

const checkEnvVar = (name, placeholder, isRequired = true) => {
  const val = env[name];
  if (!val) {
    if (isRequired) {
      console.log(`  ❌ ${name} is NOT set in .env`);
      hasErrors = true;
    } else {
      console.log(`  ⚠️ ${name} is not set (Optional)`);
      hasWarnings = true;
    }
    return null;
  }
  
  if (val === placeholder) {
    console.log(`  ❌ ${name} is set to the default placeholder: "${placeholder}"`);
    hasErrors = true;
    return null;
  }
  
  console.log(`  ✅ ${name} is configured`);
  return val;
};

const botToken = checkEnvVar('TELEGRAM_BOT_TOKEN', 'YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER');
const botUsername = checkEnvVar('NEXT_PUBLIC_BOT_USERNAME', 'YOUR_BOT_USERNAME_WITHOUT_AT');
const allowedIds = checkEnvVar('ALLOWED_TELEGRAM_IDS', '123456789,987654321');
const dbUrl = checkEnvVar('DATABASE_URL', 'postgres://postgres.xxxxxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
const directUrl = checkEnvVar('DIRECT_URL', 'postgres://postgres.xxxxxx:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres');

if (allowedIds) {
  const ids = allowedIds.split(',').map(id => id.trim()).filter(Boolean);
  if (ids.length !== 2) {
    console.log(`  ⚠️ ALLOWED_TELEGRAM_IDS has ${ids.length} ID(s) configured. App is designed for exactly 2 partners.`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ ALLOWED_TELEGRAM_IDS whitelist contains exactly 2 partners: ${ids.join(', ')}`);
  }
}

// 3. Test Telegram Bot Connection
if (botToken) {
  console.log("\n🤖 Testing Telegram Bot connection...");
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    if (data.ok) {
      console.log(`  ✅ Connected successfully to Telegram API!`);
      console.log(`     Bot Name: ${data.result.first_name}`);
      console.log(`     Bot Username: @${data.result.username}`);
      
      if (botUsername && botUsername !== data.result.username) {
        console.log(`  ⚠️ NEXT_PUBLIC_BOT_USERNAME in .env ("${botUsername}") does not match the actual bot username ("${data.result.username}")`);
        hasWarnings = true;
      }
    } else {
      console.log(`  ❌ Telegram API returned error: ${data.description}`);
      hasErrors = true;
    }
  } catch (error) {
    console.log(`  ⚠️ Failed to connect to Telegram API (offline or network issue): ${error.message}`);
    hasWarnings = true;
  }
}

// 4. Test Database Connection
if (dbUrl) {
  console.log("\n💾 Testing Database Connection (Prisma)...");
  
  // Set env dynamically for Prisma test
  process.env.DATABASE_URL = dbUrl;
  process.env.DIRECT_URL = directUrl || dbUrl;
  
  let pool;
  try {
    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { PrismaClient } = await import('@prisma/client');

    pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    // Attempt connection check
    await prisma.$connect();
    console.log(`  ✅ Database connection established via Prisma Client.`);
    
    // Check if tables are migrated
    try {
      const userCount = await prisma.user.count();
      const coupleCount = await prisma.couple.count();
      console.log(`     Data check: ${coupleCount} couples and ${userCount} users found in database.`);
    } catch (dbError) {
      console.log(`  ❌ Connected to database but failed to query tables: ${dbError.message}`);
      console.log(`     This usually means you need to run migrations: npm run db:migrate`);
      hasErrors = true;
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } catch (prismaError) {
    if (pool) {
      try { await pool.end(); } catch (e) {}
    }
    if (prismaError.code === 'ERR_MODULE_NOT_FOUND' || prismaError.message.includes('Cannot find module')) {
      console.log(`  ⚠️ Prisma Client not generated yet. Try running: npm run db:generate`);
      hasWarnings = true;
    } else {
      console.log(`  ❌ Failed to connect to database: ${prismaError.message}`);
      hasErrors = true;
    }
  }
}

console.log("\n================================================");
if (hasErrors) {
  console.log("❌ Doctor Diagnostics: FAILED. Please resolve the errors above before running the app.");
  process.exit(1);
} else if (hasWarnings) {
  console.log("⚠️ Doctor Diagnostics: PASSED WITH WARNINGS. Review the warnings above, but you're mostly good to go!");
  process.exit(0);
} else {
  console.log("✨ Doctor Diagnostics: ALL PASSED! Your IS TWO mini app is fully ready. ✨");
  process.exit(0);
}
