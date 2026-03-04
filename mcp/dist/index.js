#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { TcpClient } from "./client.js";
import { registerDiscoveryTools } from "./tools/discovery.js";
import { registerRegistryTools } from "./tools/registry.js";
import { registerChatTools } from "./tools/chat.js";
import { registerSettlementTools } from "./tools/settlement.js";
async function main() {
    const config = loadConfig();
    const client = new TcpClient(config);
    const server = new McpServer({
        name: "talent-claw-platform",
        version: "1.0.0",
    });
    registerDiscoveryTools(server, client);
    registerRegistryTools(server, client);
    registerChatTools(server, client);
    registerSettlementTools(server, client);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
