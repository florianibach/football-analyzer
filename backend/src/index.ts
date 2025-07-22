import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { parseTCX } from './tcxParser';

const app = express();
app.use(cors());
app.use(fileUpload());

app.post('/api/upload-tcx', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send('No file uploaded');
    }
    const file = req.files.file as fileUpload.UploadedFile;
    try {
        const analysis = await parseTCX(file.data.toString());
        res.json(analysis);
    } catch (err) {
        res.status(500).send('Failed to parse TCX');
    }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));