import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Read DATABASE_URL from .env.local manually
const env = readFileSync(".env.local", "utf-8");
const match = env.match(/DATABASE_URL=(.+)/);
if (!match) { console.error("DATABASE_URL not found in .env.local"); process.exit(1); }
const url = match[1].trim();

const sql = neon(url);

console.log("Connecting to Neon...\n");

try {
  // List all tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  if (tables.length === 0) {
    console.log("❌  No tables found — run: npm run db:push");
  } else {
    console.log(`✅  ${tables.length} table(s) found:\n`);
    for (const t of tables) {
      const count = await sql.query(`SELECT COUNT(*) as n FROM "${t.table_name}"`);
      const n = count.rows?.[0]?.n ?? count[0]?.n ?? "?";
      console.log(`   📋  ${t.table_name.padEnd(22)} ${n} rows`);
    }
  }

  // Quick connection test
  const pg = await sql`SELECT version()`;
  console.log(`\n🔗  Connected to: ${pg[0].version.split(" ").slice(0, 2).join(" ")}`);

} catch (e) {
  console.error("Connection failed:", e.message);
}
