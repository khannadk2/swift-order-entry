import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

type OrderStatus = "Pending" | "Working" | "Partially Filled" | "Filled" | "Cancelled" | "Rejected";
type Side = "Buy" | "Sell";
type SecurityType = "Equity" | "Bond" | "Fund";

interface Order {
  id: string;
  timestamp: Date;
  symbol: string;
  name: string;
  securityType: SecurityType;
  side: Side;
  orderType: string;
  tif: string;
  qty: number;
  filledQty: number;
  price: number;
  limitPrice?: number;
  status: OrderStatus;
  account: string;
  fees: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "bg-muted text-muted-foreground",
  Working: "bg-primary/15 text-primary",
  "Partially Filled": "bg-amber-100 text-amber-700",
  Filled: "bg-buy-muted text-buy",
  Cancelled: "bg-secondary text-muted-foreground",
  Rejected: "bg-sell-muted text-sell",
};

const STATUSES: OrderStatus[] = ["Pending", "Working", "Partially Filled", "Filled", "Cancelled", "Rejected"];

function generateMockOrders(): Order[] {
  const securities = [
    { symbol: "AAPL", name: "Apple Inc.", type: "Equity" as SecurityType, price: 189.84 },
    { symbol: "MSFT", name: "Microsoft Corp.", type: "Equity" as SecurityType, price: 378.91 },
    { symbol: "GOOGL", name: "Alphabet Inc.", type: "Equity" as SecurityType, price: 141.80 },
    { symbol: "US10Y", name: "US Treasury 10Y", type: "Bond" as SecurityType, price: 97.25 },
    { symbol: "CORP5Y", name: "IG Corporate 5Y", type: "Bond" as SecurityType, price: 101.50 },
    { symbol: "VFIAX", name: "Vanguard 500 Index", type: "Fund" as SecurityType, price: 431.20 },
    { symbol: "TSLA", name: "Tesla Inc.", type: "Equity" as SecurityType, price: 248.42 },
    { symbol: "FXAIX", name: "Fidelity 500 Index", type: "Fund" as SecurityType, price: 182.55 },
  ];
  const sides: Side[] = ["Buy", "Sell"];
  const types = ["Market", "Limit", "Stop Loss"];
  const tifs = ["Day", "GTC", "IOC", "FOK"];
  const accounts = ["INV-001 Main", "INV-002 Growth", "INV-003 Retirement"];
  const statuses: OrderStatus[] = ["Pending", "Working", "Partially Filled", "Filled", "Cancelled"];

  return Array.from({ length: 18 }, (_, i) => {
    const sec = securities[i % securities.length];
    const side = sides[i % 2];
    const qty = Math.floor(Math.random() * 500) + 10;
    const status = statuses[i % statuses.length];
    const filledQty = status === "Filled" ? qty : status === "Partially Filled" ? Math.floor(qty * (0.3 + Math.random() * 0.5)) : 0;
    const orderType = types[i % 3];
    const amount = qty * sec.price;

    return {
      id: `ORD-${String(1000 + i).slice(1)}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 2),
      symbol: sec.symbol,
      name: sec.name,
      securityType: sec.type,
      side,
      orderType,
      tif: tifs[i % 4],
      qty,
      filledQty,
      price: sec.price,
      limitPrice: orderType === "Limit" ? +(sec.price * (side === "Buy" ? 0.98 : 1.02)).toFixed(2) : undefined,
      status,
      account: accounts[i % 3],
      fees: amount * 0.001,
    };
  });
}

export default function OrderBook() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => generateMockOrders());
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [sideFilter, setSideFilter] = useState<Side | "All">("All");

  // Simulate live status updates
  const simulateUpdates = useCallback(() => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.status === "Filled" || order.status === "Cancelled" || order.status === "Rejected") return order;

        const rand = Math.random();
        if (order.status === "Pending" && rand < 0.3) {
          return { ...order, status: "Working" as OrderStatus };
        }
        if (order.status === "Working" && rand < 0.25) {
          const newFilled = Math.min(order.qty, order.filledQty + Math.floor(order.qty * 0.2));
          return {
            ...order,
            filledQty: newFilled,
            status: newFilled >= order.qty ? "Filled" as OrderStatus : "Partially Filled" as OrderStatus,
          };
        }
        if (order.status === "Partially Filled" && rand < 0.3) {
          const newFilled = Math.min(order.qty, order.filledQty + Math.floor(order.qty * 0.25));
          return {
            ...order,
            filledQty: newFilled,
            status: newFilled >= order.qty ? "Filled" as OrderStatus : "Partially Filled" as OrderStatus,
          };
        }
        if (rand < 0.05) {
          return { ...order, status: "Cancelled" as OrderStatus };
        }
        return order;
      })
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateUpdates, 2000);
    return () => clearInterval(interval);
  }, [simulateUpdates]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (sideFilter !== "All" && o.side !== sideFilter) return false;
    return true;
  });

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
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
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Order Book</h1>
              <p className="text-xs text-muted-foreground">{orders.length} orders · Live updating</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <span className="inline-block h-2 w-2 rounded-full bg-buy animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOrders(generateMockOrders())}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Status summary chips */}
      <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="label-text">Status</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}{s !== "All" && counts[s] ? ` (${counts[s]})` : s === "All" ? ` (${orders.length})` : ""}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {(["All", "Buy", "Sell"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                sideFilter === s
                  ? s === "Buy" ? "bg-buy text-buy-foreground" : s === "Sell" ? "bg-sell text-sell-foreground" : "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="px-6 py-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="w-[90px]">Order ID</TableHead>
                <TableHead className="w-[150px]">Time</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="w-[60px] text-center">Side</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[50px] text-center">TIF</TableHead>
                <TableHead className="w-[90px] text-right">Qty</TableHead>
                <TableHead className="w-[90px] text-right">Filled</TableHead>
                <TableHead className="w-[90px] text-right">Price</TableHead>
                <TableHead className="w-[80px] text-right">Fees</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[110px]">Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((order) => (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-mono text-xs font-medium text-foreground">{order.id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {order.timestamp.toLocaleString("en-US", {
                          month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
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
                      <TableCell className="text-center text-xs text-muted-foreground">{order.tif}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-foreground">
                        {order.qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={order.filledQty > 0 ? "text-buy font-semibold" : "text-muted-foreground"}>
                          {order.filledQty.toLocaleString()}
                        </span>
                        {order.filledQty > 0 && order.filledQty < order.qty && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({Math.round((order.filledQty / order.qty) * 100)}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-foreground">
                        ${order.limitPrice?.toFixed(2) ?? order.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        ${order.fees.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[11px] px-2 py-0.5 font-medium ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status === "Working" && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
                          )}
                          {order.status === "Partially Filled" && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" />
                          )}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.account}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
