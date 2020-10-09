import bodyParser from 'body-parser';
import { exec } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import hasha from 'hasha';
import path from 'path';
import request from 'request';
import { JsonRpcFuncSet, JsonRpcRequest } from './json-rpc';

dotenv.config();
const port = (process.env.SERVER_PORT || 8080) as number;
const clientId = process.env.CLIENT_ID || '2914b90321254148b57f41438e31d7b3';
const clientSecret = process.env.CLIENT_SECRET || '3d275f3a9f704c0484b4af6ef5456c89';
const moviePath = process.env.MOVIE_PATH || '/home/pi/album/movie';
const movieTempPath = process.env.MOVIE_TEMP_PATH || '/home/pi/album/movie';

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

app.get('/api/movie/next-frame', (req, res) => {

  

  readFile(`${moviePath}\\movie.json`).then(data => {
    return JSON.parse(data.toString()) as { fileName: string, startTime: string, speed: number };
  }).then(movie => {
    var start = Date.parse(movie.startTime);
    var now = Date.now();
    let seconds = (now - start) / 1000 * movie.speed;
    if (seconds < 0) {
      seconds = 0;
    }
    return readMovieFrame(movie.fileName, seconds);
  }).then(data => {
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Frame-Hash': hasha(data) });
    res.end(data);
  }).catch(err => {
    res.status(500).json({
      status: 'error',
      message: err,
    });
  });
});

app.get('/api/movie/frame/:seconds', (req, res) => {
  const seconds = Number.parseInt(req.params.seconds, 10);
  readFile(`${moviePath}\\movie.json`).then(data => {
    return JSON.parse(data.toString()) as { fileName: string, seconds: number };
  }).then(movie => {
    return readMovieFrame(movie.fileName, seconds);
  }).then(data => {
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Frame-Hash': hasha(data) });
    res.end(data);
  }).catch(err => {
    res.status(500).json({
      status: 'error',
      message: err,
    });
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
        reject({ ...err, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

function readMovieFrame(fileName: string, seconds: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    return ffmpeg()
      .input(`${moviePath}\\${fileName}`)
      .inputOptions([`-ss ${seconds}`])
      .outputOptions(['-frames:v 1'])
      .output(`${movieTempPath}\\temp.jpg`)
      .on('end', resolve)
      .on('error', reject)
      .run();
  }).then(() => {
    return readFile(`${movieTempPath}\\temp.jpg`);
  });
}

function readFile(fileName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// function getVideoInfo(inputPath: string): Promise<{ size: number, durationInSeconds: number }> {
//   return new Promise((resolve, reject) => {
//     return ffmpeg.ffprobe(inputPath, (error, videoInfo) => {
//       if (error) {
//         return reject(error);
//       }
//       const { duration, size } = videoInfo.format;
//       return resolve({
//         size: size as number,
//         durationInSeconds: Math.floor(duration as number),
//       });
//     });
//   });
// }
