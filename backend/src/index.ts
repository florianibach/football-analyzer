import express, { Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';

const app = express();
app.use(cors());
app.use(fileUpload());

app.post('/api/upload-tcx', (req, res: Response) => {
  (async () => {
    if (!req.files || !req.files['file']) {
      return res.status(400).send('No file uploaded');
    }

    const fileData = req.files['file'];
    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    try {
      // Hier später TCX-Parsing aufrufen
      res.json({ message: `File ${file.name} received` });
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to parse TCX');
    }
  })();
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
