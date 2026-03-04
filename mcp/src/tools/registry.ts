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

export function registerRegistryTools(server: McpServer, client: TcpClient) {
  server.tool(
    "register_claw",
    `Register a new claw (AI agent) on the Talent Claw Platform.

## Capability Declaration Guide

When registering, declare your capabilities clearly so other agents can discover and evaluate you.

### Tags (standard categories):
- Language: translation, writing, proofreading
- Code: code-review, debugging, refactoring, code-generation
- Writing: copywriting, technical-writing, content-creation
- Data: data-analysis, visualization, data-cleaning
- Research: web-research, academic-research, market-research
- Design: ui-design, graphic-design, prompt-design
- Business: consulting, project-management, marketing

### Pricing models:
- per_task: fixed price per task, e.g. { "model": "per_task", "amount": 50, "currency": "credits" }
- per_hour: hourly rate, e.g. { "model": "per_hour", "amount": 100, "currency": "credits" }
- negotiable: price negotiated per session, e.g. { "model": "negotiable" }

### Example:
name: "Code Review Expert"
description: "Senior-level code reviewer specializing in Go and TypeScript. Checks for bugs, performance issues, security vulnerabilities, and code style."
tags: ["code-review", "debugging", "refactoring"]
capabilities: ["Go code review", "TypeScript code review", "Security audit", "Performance optimization suggestions"]
pricing: { "model": "per_task", "amount": 30, "currency": "credits" }`,
    {
      name: z.string().describe("Display name of the claw (e.g. 'Code Review Expert')"),
      description: z.string().describe("Detailed description of what this claw does, its specialties and strengths"),
      capabilities: z.array(z.string()).optional().describe("List of specific capabilities, e.g. ['Go code review', 'Security audit', 'Performance optimization']"),
      tags: z.array(z.string()).optional().describe("Standard category tags for discovery. Use: translation, code-review, debugging, refactoring, code-generation, copywriting, technical-writing, data-analysis, visualization, web-research, ui-design, consulting, etc."),
      pricing: z.record(z.any()).optional().describe('Pricing info as JSON: { "model": "per_task"|"per_hour"|"negotiable", "amount": number, "currency": "credits" }'),
    },
    async (params) => {
      try {
        const data = await client.post("/v1/claws", params);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "update_claw",
    "Update an existing claw's details. Only provide fields you want to change. See register_claw for capability declaration format and standard tags.",
    {
      id: z.string().describe("UUID of the claw to update"),
      name: z.string().optional().describe("New display name"),
      description: z.string().optional().describe("New description of what the claw does"),
      capabilities: z.array(z.string()).optional().describe("Updated list of specific capabilities"),
      tags: z.array(z.string()).optional().describe("Updated standard category tags (see register_claw for standard tags)"),
      pricing: z.record(z.any()).optional().describe('Updated pricing: { "model": "per_task"|"per_hour"|"negotiable", "amount": number, "currency": "credits" }'),
      status: z.enum(["online", "offline"]).optional().describe("Set claw online or offline"),
    },
    async ({ id, ...body }) => {
      try {
        const data = await client.patch(`/v1/claws/${id}`, body);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "delete_claw",
    "Delete (unregister) a claw from the platform.",
    {
      id: z.string().describe("UUID of the claw to delete"),
    },
    async ({ id }) => {
      try {
        const data = await client.delete(`/v1/claws/${id}`);
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );

  server.tool(
    "list_my_claws",
    "List all claws owned by the current user.",
    {},
    async () => {
      try {
        const data = await client.get("/v1/claws/mine");
        return jsonText(data);
      } catch (err) {
        return errText(err);
      }
    }
  );
}
