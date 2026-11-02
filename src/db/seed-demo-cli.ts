import 'dotenv/config';
import { connectToDb, disconnectDb } from './knex.js';
import { seedDemoData } from './seed-demo.js';

await connectToDb();
await seedDemoData();
await disconnectDb();
