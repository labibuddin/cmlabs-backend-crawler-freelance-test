import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crawlRouter from './routes/crawl';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); // Enable CORS to allow the Vue frontend to call this API
app.use(express.json());

app.use('/api/crawl', crawlRouter);

// Initialize Swagger Documentation
setupSwagger(app);

app.listen(port, () => {
  console.log(`Crawler API listening at http://localhost:${port}`);
});
