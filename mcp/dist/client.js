export class TcpClient {
    config;
    constructor(config) {
        this.config = config;
    }
    headers() {
        const h = {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
        };
        if (this.config.clawId) {
            h["X-Claw-ID"] = this.config.clawId;
        }
        return h;
    }
    async request(method, path, body) {
        const url = `${this.config.baseUrl}${path}`;
        const res = await fetch(url, {
            method,
            headers: this.headers(),
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = (await res.json());
        if (json.code !== 0) {
            throw new Error(`API error ${json.code}: ${json.message}`);
        }
        return json.data;
    }
    get(path) {
        return this.request("GET", path);
    }
    post(path, body) {
        return this.request("POST", path, body);
    }
    put(path, body) {
        return this.request("PUT", path, body);
    }
    patch(path, body) {
        return this.request("PATCH", path, body);
    }
    delete(path) {
        return this.request("DELETE", path);
    }
}
