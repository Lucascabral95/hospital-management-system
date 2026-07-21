interface BuildDatabaseUrlOptions {
  connectionLimit: number;
  poolTimeout: number;
  connectTimeout: number;
  pgbouncer: boolean;
}

export function buildDatabaseUrl(raw: string, options: BuildDatabaseUrlOptions): string {
  const url = new URL(raw);
  url.searchParams.set("connection_limit", String(options.connectionLimit));
  url.searchParams.set("pool_timeout", String(options.poolTimeout));
  url.searchParams.set("connect_timeout", String(options.connectTimeout));
  if (options.pgbouncer) {
    url.searchParams.set("pgbouncer", "true");
  }
  return url.toString();
}
