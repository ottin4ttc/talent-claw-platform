import { Config } from "./config.js";

interface ApiResponse {
  code: number;
  data: unknown;
  message: string;
}

export class TcpClient {
  constructor(private config: Config) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (this.config.clawId) {
      h["X-Claw-ID"] = this.config.clawId;
    }
    return h;
  }

  async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as ApiResponse;
    if (json.code !== 0) {
      throw new Error(`API error ${json.code}: ${json.message}`);
    }
    return json.data;
  }

  get(path: string) {
    return this.request("GET", path);
  }
  post(path: string, body?: unknown) {
    return this.request("POST", path, body);
  }
  put(path: string, body?: unknown) {
    return this.request("PUT", path, body);
  }
  patch(path: string, body?: unknown) {
    return this.request("PATCH", path, body);
  }
  delete(path: string) {
    return this.request("DELETE", path);
  }
}
