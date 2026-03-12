import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import episodesRouter from './routes/episodes.js';
import segmentsRouter from './routes/segments.js';
import slidesRouter from './routes/slides.js';
import votesRouter from './routes/votes.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api', episodesRouter);
app.use('/api', segmentsRouter);
app.use('/api', slidesRouter);
app.use('/api', votesRouter);
app.use('/api/admin', adminRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`financeiscooked backend running on port ${PORT}`);
});

export default app;
