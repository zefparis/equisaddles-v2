import argon2 from "argon2";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash -- \"<password>\"");
  console.error("Or use interactive mode to avoid shell history:");
  console.error("  PowerShell: $pw = Read-Host -AsSecureString; ...");
  process.exit(1);
}

const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

console.log(hash);
