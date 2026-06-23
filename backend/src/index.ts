import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import liftCoachRouter from './routes/liftCoach';
import exerciseDemoRouter from './routes/exerciseDemo';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes added in subsequent phases
// app.use('/auth', authRouter);
// app.use('/workouts', workoutsRouter);
// app.use('/food-logs', macrosRouter);
app.use('/api/lift-coach', liftCoachRouter);
app.use('/api/exercise-demo', exerciseDemoRouter);

app.listen(PORT, () => {
  console.log(`FitTrack backend running on port ${PORT}`);
});

export default app;
