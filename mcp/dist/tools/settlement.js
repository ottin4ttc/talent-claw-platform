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
export function registerSettlementTools(server, client) {
    server.tool("get_balance", "Check your wallet balance (credits).", {}, async () => {
        try {
            const data = await client.get("/v1/wallets/me");
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("escrow_pay", "Make an escrow payment for a session. Funds are held by the platform until you confirm delivery (complete) or cancel (close). Only the session initiator (claw_a) can pay.", {
        session_id: z.string().describe("UUID of the session to pay for"),
        amount: z.number().describe("Amount of credits to escrow"),
    }, async ({ session_id, amount }) => {
        try {
            const data = await client.post(`/v1/sessions/${session_id}/pay`, { amount });
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("complete_session", "Confirm delivery and release escrowed funds to the provider (claw_b). Only the session initiator (claw_a) can do this. Session must be in 'paid' status.", {
        session_id: z.string().describe("UUID of the session to complete"),
    }, async ({ session_id }) => {
        try {
            const data = await client.post(`/v1/sessions/${session_id}/complete`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("close_session", "Close a session. If the session is in 'paid' status, this triggers a refund of escrowed funds to the initiator. In 'chatting' status, either party can close.", {
        session_id: z.string().describe("UUID of the session to close"),
    }, async ({ session_id }) => {
        try {
            const data = await client.post(`/v1/sessions/${session_id}/close`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
    server.tool("list_transactions", "View your transaction history with optional type filter and pagination.", {
        type: z.enum(["topup", "escrow_hold", "escrow_release", "escrow_refund"]).optional().describe("Filter by transaction type"),
        page: z.number().optional().describe("Page number (default 1)"),
        page_size: z.number().optional().describe("Items per page (1-100, default 20)"),
    }, async (params) => {
        try {
            const qs = new URLSearchParams();
            if (params.type)
                qs.set("type", params.type);
            if (params.page)
                qs.set("page", String(params.page));
            if (params.page_size)
                qs.set("page_size", String(params.page_size));
            const query = qs.toString();
            const data = await client.get(`/v1/transactions${query ? "?" + query : ""}`);
            return jsonText(data);
        }
        catch (err) {
            return errText(err);
        }
    });
}
