import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { JsonRpcRequest, JsonRpcResponse } from './json-rpc';
import request from 'request';
import https from 'https';

dotenv.config();

const port = process.env.SERVER_PORT;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.post('/api/token', (req, res) => {

  const rpcReq = req.body as JsonRpcRequest;

  // TODO: request spotify...

  console.log(clientId);
  console.log(clientSecret);

  const response = request.post('https://accounts.spotify.com/api/token', {
    json: true,
    form: {
      grant_type: 'authorization_code',
      code: rpcReq.params.code,
      redirect_uri: rpcReq.params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    },
    callback: (error, response, body) => {
      const rpcRes: JsonRpcResponse = { jsonrpc: rpcReq.jsonrpc, id: rpcReq.id };
      if (error) {
        rpcRes.error = { code: -32603, message: 'Internal error', data: error };
      } else if (body.error) {
        rpcRes.error = { code: -32603, message: 'Internal error', data: body.error };
      } else {
        rpcRes.result = body;
      }

      console.log('error', error);
      console.log('statusCode', response.statusCode);
      console.log('error', body.error);
      console.log('access_token', body.access_token);
      console.log('token_type', body.token_type);
      console.log('expires_in', body.expires_in);
      console.log('refresh_token', body.refresh_token);
      console.log('scope', body.scope);

      res.send(rpcRes);
    },
  });



});

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
