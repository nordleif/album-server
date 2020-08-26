
export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: any;
  id?: any;
}

export interface JsonRpcResponse {
    jsonrpc: string;
    result?: any;
    error?: JsonRpcError;
    id?: any;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}
