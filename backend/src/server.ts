import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { ReminderScheduler } from './services/ReminderScheduler.js';

await connectDatabase();

const scheduler = new ReminderScheduler(30); // check every 30 minutes
scheduler.start();

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
