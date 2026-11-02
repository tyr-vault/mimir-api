import 'dotenv/config';
import { app } from './app.js';
import { connectToDb } from './db/knex.js';
import { seedDemoData } from './db/seed-demo.js';

const PORT = process.env.PORT as string;

connectToDb()
    .then(async () => {
        if (process.env.SEED_DEMO === 'true') {
            await seedDemoData();
        }

        const server = app.listen(PORT, () => {
            console.log(`Server Listen at PORT ${PORT}`);
        });

        server.on('error', (error: Error) => {
            console.log('Error on Express App', error);
            throw error;
        });
    })
    .catch((err: unknown) => {
        console.log('Connection Failed!!', err);
        throw err;
    });
