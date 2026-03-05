import { HttpResponse, http } from "msw";
import { mockApiKeys, mockUser } from "./data/users";
import { mockClaws } from "./data/claws";
import { mockTransactions } from "./data/transactions";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://180.76.244.208:8080/v1";

declare global {
  var __resetMockBalance: (() => void) | undefined;
}

export const handlers = [
  http.post(`${BASE}/auth/send-code`, () => {
    return HttpResponse.json({ code: 0, data: null, message: "verification code sent" });
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { phone: string; code: string };
    if (body.code !== "123456") {
      return HttpResponse.json(
        { code: 40001, data: null, message: "invalid code" },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      code: 0,
      data: {
        token: "mock-jwt-token-xxx",
        user: {
          ...mockUser,
          phone: body.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
        },
      },
      message: "ok",
    });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({ code: 0, data: mockUser, message: "ok" });
  }),

  http.get(`${BASE}/claws`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("page_size") || "12");

    let filtered = [...mockClaws];
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      code: 0,
      data: {
        items: filtered.slice(start, end),
        total: filtered.length,
        page,
        page_size: pageSize,
      },
      message: "ok",
    });
  }),

  http.get(`${BASE}/claws/:id`, ({ params }) => {
    const claw = mockClaws.find((c) => c.id === params.id);
    if (!claw) {
      return HttpResponse.json(
        { code: 40401, data: null, message: "claw not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 0, data: claw, message: "ok" });
  }),

  http.get(`${BASE}/claws/mine`, ({ request }) => {
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer clw_")) {
      return HttpResponse.json(
        { code: 40100, data: null, message: "unauthorized: API Key required" },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      code: 0,
      data: { items: mockClaws.filter((c) => c.owner_id === "user-001"), total: 2, page: 1, page_size: 20 },
      message: "ok",
    });
  }),

  ...(() => {
    const INITIAL_BALANCE = 1000;
    let mockBalance = INITIAL_BALANCE;
    globalThis.__resetMockBalance = () => {
      mockBalance = INITIAL_BALANCE;
    };

    return [
      http.get(`${BASE}/wallets/me`, () => {
        return HttpResponse.json({ code: 0, data: { balance: mockBalance }, message: "ok" });
      }),
      http.post(`${BASE}/wallets/topup`, async ({ request }) => {
        const body = (await request.json()) as { amount: number };
        mockBalance += body.amount;
        return HttpResponse.json({ code: 0, data: { balance: mockBalance }, message: "ok" });
      }),
    ];
  })(),

  http.get(`${BASE}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("page_size") || "20");

    const source = type
      ? mockTransactions.filter((tx) => tx.type === type)
      : mockTransactions;

    return HttpResponse.json({
      code: 0,
      data: {
        items: source.slice((page - 1) * pageSize, page * pageSize),
        total: source.length,
        page,
        page_size: pageSize,
      },
      message: "ok",
    });
  }),

  http.get(`${BASE}/api-keys`, () => {
    return HttpResponse.json({
      code: 0,
      data: {
        items: mockApiKeys,
        total: mockApiKeys.length,
        page: 1,
        page_size: 20,
      },
      message: "ok",
    });
  }),

  http.post(`${BASE}/api-keys`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      code: 0,
      data: {
        id: `key-${Date.now()}`,
        key: "clw_mock_newkey456",
        key_prefix: "clw_mock",
        name: body.name,
        created_at: new Date().toISOString(),
      },
      message: "ok",
    });
  }),

  http.delete(`${BASE}/api-keys/:id`, () => {
    return HttpResponse.json({ code: 0, data: null, message: "ok" });
  }),
];
