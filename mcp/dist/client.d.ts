import { Config } from "./config.js";
export declare class TcpClient {
    private config;
    constructor(config: Config);
    private headers;
    request(method: string, path: string, body?: unknown): Promise<unknown>;
    get(path: string): Promise<unknown>;
    post(path: string, body?: unknown): Promise<unknown>;
    put(path: string, body?: unknown): Promise<unknown>;
    patch(path: string, body?: unknown): Promise<unknown>;
    delete(path: string): Promise<unknown>;
}
