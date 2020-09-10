
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

export class JsonRpcFuncSet {
  private readonly map = new Map<string, ((params: any) => Promise<any>)>();

  public constructor(methodFuncPairs?: { method: string, func: ((params: any) => Promise<any>) }[]) {
    methodFuncPairs?.forEach(methodFuncPair => this.add(methodFuncPair.method, methodFuncPair.func));
  }

  public add(method: string, func: ((params: any) => Promise<any>)) {
    this.map.set(method, func);
  }

  public delete(method: string) {
    this.map.delete(method);
  }

  public invoke(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const response: JsonRpcResponse = { jsonrpc: '2.0', id: request.id };
      const func = this.map.get(request.method);
      if (!func) {
        response.error = { code: -32601, message: 'Method not found', data: request.method };
        resolve(response);
        return;
      } else {
        func(request.params).then(result => {
          response.result = result;
          resolve(response);
        }).catch(err => {
          response.error = { code: -32603, message: 'Internal error', data: err };
          resolve(response);
        });
      }
    });
  }
}
