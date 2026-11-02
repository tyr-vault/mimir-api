import type { Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connection = process.env.DATABASE_URL ?? 'postgres://mimir:mimir@localhost:5432/budgetter';

const config: Knex.Config = {
    client: 'pg',
    connection,
    migrations: {
        directory: path.join(__dirname, 'src/db/migrations'),
        extension: 'ts',
    },
    pool: { min: 2, max: 10 },
};

export default config;
