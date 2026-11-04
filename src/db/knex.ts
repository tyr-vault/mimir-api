import knex, { type Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connection = process.env.DATABASE_URL;
if (!connection) {
    throw new Error('DATABASE_URL is not configured');
}

const isProduction = process.env.NODE_ENV === 'production';
const migrationsDir = isProduction
    ? path.join(__dirname, 'migrations')
    : path.join(process.cwd(), 'src/db/migrations');

const db: Knex = knex({
    client: 'pg',
    connection,
    pool: { min: 2, max: 10 },
    migrations: {
        directory: migrationsDir,
        extension: isProduction ? 'js' : 'ts',
    },
});

const isMigrationSkipError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error);
    return (
        message.includes('corrupt') ||
        message.includes('already exists') ||
        message.includes('duplicate key')
    );
};

export default db;

/** Dev runs record `*.ts` in knex_migrations; prod loads compiled `*.js`. Align names once. */
const reconcileMigrationNamesForProduction = async (): Promise<void> => {
    if (!isProduction) return;

    const hasTable = await db.schema.hasTable('knex_migrations');
    if (!hasTable) return;

    const rows = await db<{ name: string }>('knex_migrations').select('name');
    for (const row of rows) {
        if (!row.name.endsWith('.ts')) continue;
        const jsName = row.name.replace(/\.ts$/, '.js');
        const exists = await db('knex_migrations').where({ name: jsName }).first();
        if (exists) {
            await db('knex_migrations').where({ name: row.name }).delete();
        } else {
            await db('knex_migrations').where({ name: row.name }).update({ name: jsName });
        }
    }
};

export const connectToDb = async (): Promise<void> => {
    try {
        await db.raw('SELECT 1');

        try {
            await reconcileMigrationNamesForProduction();
            await db.migrate.latest();
            console.info('PostgreSQL connected and migrations applied');
        } catch (migrateError: unknown) {
            if (!isProduction && isMigrationSkipError(migrateError)) {
                console.info('PostgreSQL connected (schema already up to date)');
            } else {
                throw migrateError;
            }
        }
    } catch (error: unknown) {
        console.error('PostgreSQL connection failed!', error);
        process.exit(1);
    }
};

export const disconnectDb = async (): Promise<void> => {
    await db.destroy();
};
