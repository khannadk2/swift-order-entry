import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp,
  Shield, DollarSign, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { ApprovalOrder, Warning } from "@/types/approval";

interface TradeDetailSheetProps {
  order: ApprovalOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (orderId: string, comment: string) => void;
  onReject: (orderId: string, comment: string) => void;
}

const WARNING_CONFIG: Record<Warning["type"], { icon: typeof AlertTriangle; label: string }> = {
  large_order: { icon: DollarSign, label: "Large Order" },
  price_deviation: { icon: TrendingUp, label: "Price Deviation" },
  unusual_security: { icon: Shield, label: "Unusual Security" },
};

export default function TradeDetailSheet({
  order, open, onOpenChange, onApprove, onReject,
}: TradeDetailSheetProps) {
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  if (!order) return null;

  const handleAction = (type: "approve" | "reject") => {
    if (type === "approve") onApprove(order.id, comment);
    else onReject(order.id, comment);
    setComment("");
    setAction(null);
    onOpenChange(false);
  };

  const SideIcon = order.side === "Buy" ? ArrowUpRight : ArrowDownRight;
  const totalValue = order.qty * order.price;
  const isActionable = order.approvalStatus === "Pending Approval";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg">{order.symbol}</SheetTitle>
            <Badge
              className={`text-[11px] ${
                order.side === "Buy"
                  ? "bg-buy-muted text-buy"
                  : "bg-sell-muted text-sell"
              }`}
              variant="secondary"
            >
              <SideIcon className="h-3 w-3 mr-1" />
              {order.side}
            </Badge>
          </div>
          <SheetDescription className="text-xs">
            {order.name} · {order.id} · Submitted by {order.submittedBy}
          </SheetDescription>
        </SheetHeader>

        {/* Warnings */}
        {order.warnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {order.warnings.map((w, i) => {
              const cfg = WARNING_CONFIG[w.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg bg-warning-muted border border-warning/20 px-3 py-2.5"
                >
                  <Icon className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-warning-foreground">{cfg.label}</p>
                    <p className="text-[11px] text-muted-foreground">{w.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator className="mb-4" />

        {/* Trade Details Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
          <DetailRow label="Order Type" value={order.orderType} />
          <DetailRow label="Time in Force" value={order.tif} />
          <DetailRow label="Quantity" value={order.qty.toLocaleString()} />
          <DetailRow label="Price" value={`$${order.price.toFixed(2)}`} />
          {order.limitPrice && (
            <DetailRow label="Limit Price" value={`$${order.limitPrice.toFixed(2)}`} />
          )}
          <DetailRow
            label="Total Value"
            value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            highlight
          />
          <DetailRow label="Fees" value={`$${order.fees.toFixed(2)}`} />
          <DetailRow label="Security Type" value={order.securityType} />
          <DetailRow label="Account" value={order.account} />
          <DetailRow
            label="Submitted"
            value={order.timestamp.toLocaleString("en-US", {
              month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
            })}
          />
        </div>

        <Separator className="mb-4" />

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <span className="label-text">Approval Status</span>
          <ApprovalBadge status={order.approvalStatus} />
        </div>

        {order.approvalComment && (
          <div className="rounded-lg bg-muted px-3 py-2.5 mb-4">
            <p className="text-[11px] text-muted-foreground mb-1">
              {order.approvalStatus === "Approved" ? "Approval" : "Rejection"} Comment
            </p>
            <p className="text-sm text-foreground">{order.approvalComment}</p>
          </div>
        )}

        {/* Action Area */}
        {isActionable && (
          <>
            <Separator className="mb-4" />
            <div className="space-y-3">
              <div>
                <label className="label-text mb-1.5 block">
                  Comment {action === "reject" ? "(required)" : "(optional)"}
                </label>
                <Textarea
                  placeholder="Add a comment for the trader..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-buy text-buy-foreground hover:bg-buy/90"
                  onClick={() => handleAction("approve")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-sell/30 text-sell hover:bg-sell-muted"
                  onClick={() => {
                    if (!comment.trim()) {
                      setAction("reject");
                      return;
                    }
                    handleAction("reject");
                  }}
                  disabled={action === "reject" && !comment.trim()}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              </div>
              {action === "reject" && !comment.trim() && (
                <p className="text-[11px] text-sell">Please add a comment explaining the rejection.</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="label-text mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "font-semibold text-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ApprovalBadge({ status }: { status: ApprovalOrder["approvalStatus"] }) {
  const config = {
    "Pending Approval": { className: "bg-warning-muted text-warning-foreground", icon: Clock },
    Approved: { className: "bg-buy-muted text-buy", icon: CheckCircle2 },
    Rejected: { className: "bg-sell-muted text-sell", icon: XCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 ${c.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}
