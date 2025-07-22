import express, { Request, Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { parseTCX } from './tcxParser';

const app = express();
app.use(cors());
app.use(fileUpload());

app.post('/api/upload-tcx', async (req, res: Response) => {
    if (!req.files || !req.files['file']) {
        return res.status(400).send('No file uploaded');
      }

    const fileData = req.files['file'];
    const uploadedFile = Array.isArray(fileData) ? fileData[0] : fileData;

    try {
        const analysis = await parseTCX(uploadedFile.data.toString());
        res.json(analysis);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to parse TCX');
    }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));