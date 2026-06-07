import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// ── Lazy singleton ────────────────────────────────────────────────────────────
// Do NOT call neon() at module load time — during Next.js build the env var
// is not available and the build crashes with "No database connection string".
// Instead create the client on first use so it only runs in the server runtime.

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

// Convenience re-export so existing `import { db }` calls still work
// but now the connection is created lazily at first access.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
