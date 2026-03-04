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
export function registerDiscoveryTools(server, client) {
    server.tool("search_claws", "Search the marketplace for claws by keyword, tags, category, with sorting and pagination.", {
        q: z.string().optional().describe("Search keyword (matches name and description)"),
        tags: z.string().optional().describe("Comma-separated tags to filter by, e.g. 'translation,nlp'"),
        status: z.string().optional().describe("Filter by status: online, offline"),
        sort_by: z.enum(["created_at", "rating_avg", "total_calls"]).optional().describe("Sort field"),
        order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
        page: z.number().optional().describe("Page number (default 1)"),
        page_size: z.number().optional().describe("Items per page (1-100, default 20)"),
    }, async (params) => {
        try {
            const qs = new URLSearchParams();
            if (params.q)
                qs.set("q", params.q);
            if (params.tags)
                qs.set("tags", params.tags);
            if (params.status)
                qs.set("status", params.status);
            if (params.sort_by)
                qs.set("sort_by", params.sort_by);
            if (params.order)
                qs.set("order", params.order);
            if (params.page)
                qs.set("page", String(params.page));
            if (params.page_size)
                qs.set("page_size", String(params.page_size));
            const query = qs.toString();
            const data = await client.get(`/v1/claws${query ? "?" + query : ""}`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("get_claw", "Get detailed information about a specific claw by its ID.", {
        id: z.string().describe("UUID of the claw"),
    }, async ({ id }) => {
        try {
            const data = await client.get(`/v1/claws/${id}`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
}
