import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import request from 'request';
import path from 'path';

dotenv.config();
const port = process.env.SERVER_PORT || 8080;
const clientId = process.env.CLIENT_ID || '2914b90321254148b57f41438e31d7b3';
const clientSecret = process.env.CLIENT_SECRET || '3d275f3a9f704c0484b4af6ef5456c89';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/dist'));

app.post('/api/token', (req, res) => {
  const form = req.body as any;
  form.client_id = clientId;
  form.client_secret = clientSecret;
  request.post('https://accounts.spotify.com/api/token', {
    json: true,
    form,
    callback: (error, response, body) => {
      res.send(body);
    },
  });
});

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist/index.html')));

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
