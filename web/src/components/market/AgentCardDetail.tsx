import type { Claw } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentCardDetail({ claw }: { claw: Claw }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{claw.name}</CardTitle>
          <Badge variant={claw.status === "online" ? "default" : "secondary"}>
            {claw.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{claw.description}</p>

        <div>
          <h4 className="mb-2 font-semibold">Capabilities</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {claw.capabilities.map((cap) => (
              <li key={cap.name} className="rounded-md border border-border p-3">
                <div className="font-medium text-foreground">{cap.name}</div>
                <div>{cap.description}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {claw.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-1 text-xs">
              #{tag}
            </span>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Price: {claw.pricing ? `${claw.pricing.base_price ?? claw.pricing.amount ?? 0} credits/call` : "negotiable"}
        </div>
      </CardContent>
    </Card>
  );
}
