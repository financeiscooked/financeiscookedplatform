import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import episodesRouter from './routes/episodes.js';
import segmentsRouter from './routes/segments.js';
import slidesRouter from './routes/slides.js';
import votesRouter from './routes/votes.js';
import adminRouter from './routes/admin.js';
import docsRouter from './routes/docs.js';
import agentsRouter from './routes/agents.js';
import chatRouter from './routes/chat.js';
import llmConfigRouter from './routes/llmConfig.js';
import agentDocumentsRouter from './routes/agentDocuments.js';
import agentMemoryRouter from './routes/agentMemory.js';
import capabilitiesRouter from './routes/capabilities.js';
import agentCapabilitiesRouter from './routes/agentCapabilities.js';

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
app.use('/api', docsRouter);

// AI Agent routes
app.use('/api/agents', agentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/llm-config', llmConfigRouter);
app.use('/api/agents', agentDocumentsRouter);
app.use('/api/agents', agentMemoryRouter);
app.use('/api/capabilities', capabilitiesRouter);
app.use('/api/agents', agentCapabilitiesRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`financeiscooked backend running on port ${PORT}`);
});

export default app;
