import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Clock,
  Bell, Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import TradeDetailSheet from "@/components/TradeDetailSheet";
import type { ApprovalOrder, Warning } from "@/types/approval";

function generateWarnings(order: Omit<ApprovalOrder, "warnings" | "urgency">): Warning[] {
  const warnings: Warning[] = [];
  const totalValue = order.qty * order.price;

  if (totalValue > 100000) {
    warnings.push({
      type: "large_order",
      message: `Order value $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} exceeds $100,000 threshold.`,
    });
  }
  if (order.limitPrice && Math.abs(order.limitPrice - order.price) / order.price > 0.03) {
    warnings.push({
      type: "price_deviation",
      message: `Limit price deviates ${(Math.abs(order.limitPrice - order.price) / order.price * 100).toFixed(1)}% from market price.`,
    });
  }
  const unusual = ["CORP5Y", "US10Y"];
  if (unusual.includes(order.symbol)) {
    warnings.push({
      type: "unusual_security",
      message: `${order.symbol} is a fixed-income instrument requiring additional review.`,
    });
  }
  return warnings;
}

function generateMockApprovals(): ApprovalOrder[] {
  const securities = [
    { symbol: "AAPL", name: "Apple Inc.", type: "Equity" as const, price: 189.84 },
    { symbol: "MSFT", name: "Microsoft Corp.", type: "Equity" as const, price: 378.91 },
    { symbol: "TSLA", name: "Tesla Inc.", type: "Equity" as const, price: 248.42 },
    { symbol: "US10Y", name: "US Treasury 10Y", type: "Bond" as const, price: 97.25 },
    { symbol: "CORP5Y", name: "IG Corporate 5Y", type: "Bond" as const, price: 101.50 },
    { symbol: "VFIAX", name: "Vanguard 500 Index", type: "Fund" as const, price: 431.20 },
    { symbol: "GOOGL", name: "Alphabet Inc.", type: "Equity" as const, price: 141.80 },
    { symbol: "FXAIX", name: "Fidelity 500 Index", type: "Fund" as const, price: 182.55 },
  ];
  const sides = ["Buy", "Sell"] as const;
  const types = ["Market", "Limit", "Stop Loss"];
  const tifs = ["Day", "GTC", "IOC", "FOK"];
  const accounts = ["INV-001 Main", "INV-002 Growth", "INV-003 Retirement"];
  const traders = ["J. Smith", "A. Patel", "M. Chen", "R. Johnson", "S. Williams"];
  const statuses = ["Pending Approval", "Pending Approval", "Pending Approval", "Approved", "Rejected"] as const;

  return Array.from({ length: 12 }, (_, i) => {
    const sec = securities[i % securities.length];
    const side = sides[i % 2];
    const qty = Math.floor(Math.random() * 800) + 50;
    const orderType = types[i % 3];
    const limitPrice = orderType === "Limit"
      ? +(sec.price * (side === "Buy" ? 0.95 : 1.05)).toFixed(2)
      : undefined;

    const base = {
      id: `APR-${String(2000 + i).slice(1)}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      symbol: sec.symbol,
      name: sec.name,
      securityType: sec.type,
      side,
      orderType,
      tif: tifs[i % 4],
      qty,
      filledQty: 0,
      price: sec.price,
      limitPrice,
      fees: qty * sec.price * 0.001,
      account: accounts[i % 3],
      submittedBy: traders[i % traders.length],
      approvalStatus: statuses[i % statuses.length],
      approvalComment: statuses[i % statuses.length] === "Rejected"
        ? "Order exceeds risk limits for this account."
        : statuses[i % statuses.length] === "Approved"
          ? "Reviewed and approved."
          : undefined,
    };

    const warnings = generateWarnings(base);
    return {
      ...base,
      warnings,
      urgency: warnings.length >= 2 ? "high" as const : "normal" as const,
    };
  });
}

type FilterStatus = "All" | "Pending Approval" | "Approved" | "Rejected";

export default function Approvals() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApprovalOrder[]>(() => generateMockApprovals());
  const [filter, setFilter] = useState<FilterStatus>("Pending Approval");
  const [selectedOrder, setSelectedOrder] = useState<ApprovalOrder | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleApprove = useCallback((orderId: string, comment: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, approvalStatus: "Approved" as const, approvalComment: comment || "Approved." }
          : o
      )
    );
    toast({ title: "Order Approved", description: `${orderId} has been approved.` });
  }, []);

  const handleReject = useCallback((orderId: string, comment: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, approvalStatus: "Rejected" as const, approvalComment: comment }
          : o
      )
    );
    toast({ title: "Order Rejected", description: `${orderId} has been rejected.`, variant: "destructive" });
  }, []);

  const filtered = orders.filter((o) => filter === "All" || o.approvalStatus === filter);
  const pendingCount = orders.filter((o) => o.approvalStatus === "Pending Approval").length;
  const highUrgencyCount = orders.filter((o) => o.approvalStatus === "Pending Approval" && o.urgency === "high").length;

  const counts: Record<string, number> = orders.reduce((acc, o) => {
    acc[o.approvalStatus] = (acc[o.approvalStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Approvals</h1>
                {pendingCount > 0 && (
                  <Badge className="bg-warning-muted text-warning-foreground text-[11px] px-1.5 py-0">
                    {pendingCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingCount} pending · {highUrgencyCount > 0 && (
                  <span className="text-warning-foreground font-medium">{highUrgencyCount} require attention</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {highUrgencyCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-muted">
                <Bell className="h-3.5 w-3.5 text-warning" />
                <span className="text-[11px] font-medium text-warning-foreground">
                  {highUrgencyCount} urgent
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-4">
        <span className="label-text">Status</span>
        <div className="flex gap-1.5">
          {(["All", "Pending Approval", "Approved", "Rejected"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "All" ? `All (${orders.length})` : `${s} (${counts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="w-[40px]" />
                <TableHead className="w-[90px]">Order ID</TableHead>
                <TableHead className="w-[130px]">Submitted</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="w-[60px] text-center">Side</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[90px] text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-right">Value</TableHead>
                <TableHead className="w-[100px]">Trader</TableHead>
                <TableHead className="w-[130px] text-center">Status</TableHead>
                <TableHead className="w-[70px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
                    No orders match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered
                  .sort((a, b) => {
                    if (a.approvalStatus === "Pending Approval" && b.approvalStatus !== "Pending Approval") return -1;
                    if (b.approvalStatus === "Pending Approval" && a.approvalStatus !== "Pending Approval") return 1;
                    if (a.urgency === "high" && b.urgency !== "high") return -1;
                    if (b.urgency === "high" && a.urgency !== "high") return 1;
                    return b.timestamp.getTime() - a.timestamp.getTime();
                  })
                  .map((order) => {
                    const totalValue = order.qty * order.price;
                    return (
                      <TableRow
                        key={order.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          order.approvalStatus === "Pending Approval" && order.urgency === "high"
                            ? "border-l-2 border-l-warning"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedOrder(order);
                          setSheetOpen(true);
                        }}
                      >
                        <TableCell className="px-2">
                          {order.warnings.length > 0 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {order.id}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {order.timestamp.toLocaleString("en-US", {
                            month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{order.symbol}</span>
                            <span className="text-[11px] text-muted-foreground hidden lg:inline">{order.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-bold ${order.side === "Buy" ? "text-buy" : "text-sell"}`}>
                            {order.side}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-foreground">{order.orderType}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-foreground">
                          {order.qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-foreground">
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{order.submittedBy}</TableCell>
                        <TableCell className="text-center">
                          <ApprovalStatusBadge status={order.approvalStatus} />
                        </TableCell>
                        <TableCell className="text-center">
                          {order.approvalStatus === "Pending Approval" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setSheetOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Review
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TradeDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

function ApprovalStatusBadge({ status }: { status: ApprovalOrder["approvalStatus"] }) {
  const config = {
    "Pending Approval": { className: "bg-warning-muted text-warning-foreground", icon: Clock },
    Approved: { className: "bg-buy-muted text-buy", icon: CheckCircle2 },
    Rejected: { className: "bg-sell-muted text-sell", icon: XCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 font-medium ${c.className}`}>
      {status === "Pending Approval" && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning animate-pulse mr-1.5" />
      )}
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}
