import bodyParser from 'body-parser';
import { exec } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import request from 'request';
import { JsonRpcFuncSet, JsonRpcRequest } from './json-rpc';

dotenv.config();
const port = (process.env.SERVER_PORT || 8080) as number;
const clientId = process.env.CLIENT_ID || '2914b90321254148b57f41438e31d7b3';
const clientSecret = process.env.CLIENT_SECRET || '3d275f3a9f704c0484b4af6ef5456c89';

const funcSet = new JsonRpcFuncSet();
funcSet.add('screenOff', screenOff);
funcSet.add('screenOn', screenOn);

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

app.post('/api/rpc', (req, res) => {
  const request = req.body as JsonRpcRequest;
  funcSet.invoke(request).then(response => {
    res.send(response.id ? response : 200);
  });
});

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist/index.html')));

app.listen(port, '0.0.0.0', () => {
  console.log(`server started at http://localhost:${port}`);
});

function screenOff(params: any) {
  return new Promise((resolve, reject) => {
    exec('sudo bash -c "echo 1 > /sys/class/backlight/rpi_backlight/bl_power"', (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
       resolve(null);
      }
    });
  });
}

function screenOn(params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    exec('sudo bash -c "echo 0 > /sys/class/backlight/rpi_backlight/bl_power"', (err, stdout, stderr) => {
      if (err) {
        reject({...err, stderr});
      } else {
       resolve(stdout);
      }
    });
  });
}
