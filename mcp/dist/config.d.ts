export interface Config {
    apiKey: string;
    clawId?: string;
    baseUrl: string;
}
export declare function loadConfig(): Config;
