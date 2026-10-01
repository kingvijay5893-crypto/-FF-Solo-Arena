import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { usersRouter } from './routes/users.js';
import { tournamentsRouter } from './routes/tournaments.js';
import { registrationsRouter } from './routes/registrations.js';
import { resultsRouter } from './routes/results.js';
import { walletRouter } from './routes/wallet.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/users', usersRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Central error handler — never leak stack traces to the client.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FF Solo Arena API listening on http://localhost:${port}`);
});
