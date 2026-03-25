import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import duesRoutes from './routes/duesRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import configRoutes from './routes/configRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();

// Support multiple origins (comma-separated in CLIENT_ORIGIN)
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',         authRoutes);
app.use('/api/members',      memberRoutes);
app.use('/api/expenses',     expenseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dues',         duesRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/files',        fileRoutes);
app.use('/api/config',       configRoutes);
app.use('/api/dashboard',    dashboardRoutes);

app.use(errorHandler);

export default app;
