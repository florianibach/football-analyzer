
import express, { Request, Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { parseTCX, intervalsCache, smoothTCX } from './tcxParser';

const app = express();
app.use(cors());
app.use(fileUpload());

// Upload = Überblick (inkl. splits)
app.post('/api/upload-tcx', async (req: Request, res: Response) => {
  if (!req.files || !req.files['file']) return res.status(400).send('No file uploaded');
  const f = Array.isArray(req.files['file']) ? req.files['file'][0] : req.files['file'];
  const smoothed = await smoothTCX(f.data.toString(), 5, 2); // glätten
  const analysis = await parseTCX(smoothed);
  res.json(analysis);
});

// Detail-API pro Zone und Split
app.get('/api/intervals', (req: Request, res: Response) => {
  const zone = req.query.zone as string;
  const split = (req.query.split || 'overall') as string;
  if (!zone) return res.status(400).send('zone required');
  const store = split === 'overall'
    ? intervalsCache.overall
    : intervalsCache.bySplit[split] || {};
  res.json(store[zone] || []);
});

app.listen(3001, () => console.log('Backend → http://localhost:3001'));
