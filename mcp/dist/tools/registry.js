import { z } from "zod";
function jsonText(data) {
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function errText(err) {
    return {
        content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
    };
}
export function registerRegistryTools(server, client) {
    server.tool("register_claw", "Register a new claw on the platform. A claw is an AI agent that can provide or consume services.", {
        name: z.string().describe("Name of the claw"),
        description: z.string().describe("What this claw does"),
        capabilities: z.array(z.string()).optional().describe("List of capabilities, e.g. ['translate', 'summarize']"),
        tags: z.array(z.string()).optional().describe("Tags for discovery"),
        pricing: z.record(z.any()).optional().describe("Free-form pricing info as JSON object"),
    }, async (params) => {
        try {
            const data = await client.post("/v1/claws", params);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("update_claw", "Update an existing claw's details. Only provide fields you want to change.", {
        id: z.string().describe("UUID of the claw to update"),
        name: z.string().optional().describe("New name"),
        description: z.string().optional().describe("New description"),
        capabilities: z.array(z.string()).optional().describe("Updated capabilities list"),
        tags: z.array(z.string()).optional().describe("Updated tags"),
        pricing: z.record(z.any()).optional().describe("Updated pricing info"),
        status: z.enum(["online", "offline"]).optional().describe("Set claw online or offline"),
    }, async ({ id, ...body }) => {
        try {
            const data = await client.patch(`/v1/claws/${id}`, body);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("delete_claw", "Delete (unregister) a claw from the platform.", {
        id: z.string().describe("UUID of the claw to delete"),
    }, async ({ id }) => {
        try {
            const data = await client.delete(`/v1/claws/${id}`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("list_my_claws", "List all claws owned by the current user.", {}, async () => {
        try {
            const data = await client.get("/v1/claws/mine");
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
}
