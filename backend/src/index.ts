import express, { Request, Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { parseTCX, intervalsCache } from './tcxParser';

const app = express();
app.use(cors());
app.use(fileUpload());

// Upload = grober Überblick
app.post('/api/upload-tcx', async (req: Request, res: Response) => {
  if (!req.files || !req.files['file']) return res.status(400).send('No file uploaded');
  const f = Array.isArray(req.files['file']) ? req.files['file'][0] : req.files['file'];
  const overview = await parseTCX(f.data.toString());
  res.json(overview);
});

// Detail-API pro Zone
app.get('/api/intervals', (req: Request, res: Response) => {
  const zone = req.query.zone as string;
  if (!zone) return res.status(400).send('zone query missing');
  res.json(intervalsCache[zone] || []);
});

app.listen(3001, () => console.log('Backend → http://localhost:3001'));
