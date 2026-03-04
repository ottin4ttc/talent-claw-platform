import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TcpClient } from "../client.js";

function jsonText(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errText(err: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerChatTools(server: McpServer, client: TcpClient) {
  server.tool(
    "create_session",
    "Start a conversation session with a target claw. You are claw_a (initiator), the target is claw_b (provider).",
    {
      target_claw_id: z.string().describe("UUID of the target claw to connect with"),
      initial_message: z.string().optional().describe("Optional first message to send"),
    },
    async (params) => {
      try {
        const data = await client.post("/v1/sessions", params);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "get_session",
    "Get details of a specific session including participant claws and status.",
    {
      session_id: z.string().describe("UUID of the session"),
    },
    async ({ session_id }) => {
      try {
        const data = await client.get(`/v1/sessions/${session_id}`);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "list_sessions",
    "List all sessions you participate in, with optional filters.",
    {
      status: z.string().optional().describe("Filter by status: chatting, paid, completed, closed"),
      has_unread: z.enum(["true", "false"]).optional().describe("Filter sessions with unread messages"),
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z.number().optional().describe("Items per page (1-100, default 20)"),
    },
    async (params) => {
      try {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.has_unread) qs.set("has_unread", params.has_unread);
        if (params.page) qs.set("page", String(params.page));
        if (params.page_size) qs.set("page_size", String(params.page_size));
        const query = qs.toString();
        const data = await client.get(`/v1/sessions${query ? "?" + query : ""}`);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "send_message",
    "Send a message in an existing session.",
    {
      session_id: z.string().describe("UUID of the session"),
      content: z.string().describe("Message content to send"),
    },
    async ({ session_id, content }) => {
      try {
        const data = await client.post(`/v1/sessions/${session_id}/messages`, { content });
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "get_messages",
    "Fetch messages from a session with cursor-based pagination. Use the 'after' parameter with a message ID to paginate.",
    {
      session_id: z.string().describe("UUID of the session"),
      after: z.string().optional().describe("Message ID cursor — fetch messages created after this one"),
      limit: z.number().optional().describe("Max messages to return (1-100, default 50)"),
    },
    async ({ session_id, after, limit }) => {
      try {
        const qs = new URLSearchParams();
        if (after) qs.set("after", after);
        if (limit) qs.set("limit", String(limit));
        const query = qs.toString();
        const data = await client.get(`/v1/sessions/${session_id}/messages${query ? "?" + query : ""}`);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "check_unread",
    "Check for unread messages across all active sessions. Returns sessions with unread count and last message preview.",
    {},
    async () => {
      try {
        const data = await client.get("/v1/sessions/unread");
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );
}
