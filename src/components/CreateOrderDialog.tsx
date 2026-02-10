import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";

type SecurityType = "Equity" | "Bond" | "Fund";
type Side = "Buy" | "Sell";
type OrderType = "Market" | "Limit" | "Stop Loss";
type TIF = "Day" | "GTC" | "IOC" | "FOK";
type OrderBy = "Amount" | "Units";

interface Security {
  symbol: string;
  name: string;
  type: SecurityType;
  price: number;
  ytm?: number;
  maturity?: string;
  nav?: number;
  coupon?: number;
}

const MOCK_SECURITIES: Security[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "Equity", price: 189.84 },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "Equity", price: 378.91 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Equity", price: 141.80 },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Equity", price: 248.42 },
  { symbol: "US10Y", name: "US Treasury 10Y", type: "Bond", price: 97.25, ytm: 4.28, maturity: "2034-11-15", coupon: 4.0 },
  { symbol: "CORP5Y", name: "IG Corporate 5Y", type: "Bond", price: 101.50, ytm: 5.12, maturity: "2029-06-01", coupon: 5.25 },
  { symbol: "MUNI7Y", name: "Municipal Bond 7Y", type: "Bond", price: 98.80, ytm: 3.45, maturity: "2031-03-15", coupon: 3.5 },
  { symbol: "VFIAX", name: "Vanguard 500 Index", type: "Fund", price: 431.20, nav: 431.20 },
  { symbol: "FXAIX", name: "Fidelity 500 Index", type: "Fund", price: 182.55, nav: 182.55 },
  { symbol: "SWPPX", name: "Schwab S&P 500", type: "Fund", price: 73.88, nav: 73.88 },
];

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SecurityType | "All">("All");
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);
  const [side, setSide] = useState<Side>("Buy");
  const [orderType, setOrderType] = useState<OrderType>("Market");
  const [tif, setTif] = useState<TIF>("Day");
  const [orderBy, setOrderBy] = useState<OrderBy>("Amount");
  const [inputValue, setInputValue] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [investmentAccount, setInvestmentAccount] = useState("");
  const [cashAccount, setCashAccount] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_SECURITIES.filter((s) => {
      const matchType = typeFilter === "All" || s.type === typeFilter;
      const matchSearch =
        !searchQuery ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [searchQuery, typeFilter]);

  const effectivePrice = orderType === "Limit" && limitPrice ? parseFloat(limitPrice) : selectedSecurity?.price ?? 0;
  const units = orderBy === "Units" ? parseFloat(inputValue) || 0 : (parseFloat(inputValue) || 0) / effectivePrice;
  const orderAmount = orderBy === "Amount" ? parseFloat(inputValue) || 0 : (parseFloat(inputValue) || 0) * effectivePrice;
  const fees = orderAmount * 0.001;
  const total = side === "Buy" ? orderAmount + fees : orderAmount - fees;

  const canSubmit = selectedSecurity && inputValue && parseFloat(inputValue) > 0 && investmentAccount && cashAccount;

  const typeFilters: (SecurityType | "All")[] = ["All", "Equity", "Bond", "Fund"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[820px] p-0 gap-0 bg-card border-border overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Create New Order</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_260px] divide-x divide-border">
          {/* Left: Inputs */}
          <div className="p-4 space-y-3">
            {/* Security Search */}
            <div>
              <label className="label-text block mb-1.5">Security</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by symbol or name…"
                  className="w-full h-8 pl-8 pr-3 rounded-md bg-input border border-border text-sm text-foreground placeholder:field-hint focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {/* Type filter pills */}
                <div className="flex gap-1 mt-1.5">
                  {typeFilters.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setShowDropdown(true); }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        typeFilter === t
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "All" ? "All" : t === "Equity" ? "Stocks" : t === "Bond" ? "Bonds" : "Funds"}
                    </button>
                  ))}
                </div>
                {/* Dropdown */}
                {showDropdown && filtered.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-36 overflow-auto">
                    {filtered.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => { setSelectedSecurity(s); setShowDropdown(false); setSearchQuery(s.symbol); }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-accent text-left"
                      >
                        <span>
                          <span className="font-medium text-foreground">{s.symbol}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{s.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{s.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Security Details */}
            {selectedSecurity && (
              <div className="flex gap-3 items-center bg-secondary/50 rounded-md px-3 py-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{selectedSecurity.symbol}</div>
                  <div className="text-[11px] text-muted-foreground">{selectedSecurity.name}</div>
                </div>
                {selectedSecurity.type === "Equity" && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Live Price</div>
                    <div className="text-sm font-mono font-semibold text-buy">${selectedSecurity.price.toFixed(2)}</div>
                  </div>
                )}
                {selectedSecurity.type === "Bond" && (
                  <>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground">YTM</div>
                      <div className="text-xs font-mono text-foreground">{selectedSecurity.ytm}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground">Coupon</div>
                      <div className="text-xs font-mono text-foreground">{selectedSecurity.coupon}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground">Maturity</div>
                      <div className="text-xs font-mono text-foreground">{selectedSecurity.maturity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Price</div>
                      <div className="text-sm font-mono font-semibold text-foreground">{selectedSecurity.price.toFixed(2)}</div>
                    </div>
                  </>
                )}
                {selectedSecurity.type === "Fund" && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">NAV</div>
                    <div className="text-sm font-mono font-semibold text-foreground">${selectedSecurity.nav?.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Buy/Sell */}
            <div>
              <label className="label-text block mb-1.5">Side</label>
              <div className="grid grid-cols-2 gap-1 bg-input rounded-md p-0.5 w-1/2">
                <button
                  onClick={() => setSide("Buy")}
                  className={`flex items-center justify-center gap-1.5 h-8 rounded text-sm font-semibold transition-all ${
                    side === "Buy" ? "bg-buy text-buy-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Buy
                </button>
                <button
                  onClick={() => setSide("Sell")}
                  className={`flex items-center justify-center gap-1.5 h-8 rounded text-sm font-semibold transition-all ${
                    side === "Sell" ? "bg-sell text-sell-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> Sell
                </button>
              </div>
            </div>

            {/* Order Type + Limit Price (if applicable) + TIF in one row */}
            <div className={`grid gap-3 ${orderType !== "Market" ? "grid-cols-3" : "grid-cols-2"}`}>
              <div>
                <label className="label-text block mb-1.5">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full h-8 px-2.5 rounded-md bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Market</option>
                  <option>Limit</option>
                  <option>Stop Loss</option>
                </select>
              </div>
              {orderType !== "Market" && (
                <div>
                  <label className="label-text block mb-1.5">{orderType === "Limit" ? "Limit Price" : "Stop Price"}</label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Enter price…"
                    className="w-full h-8 px-3 rounded-md bg-input border border-border text-sm font-mono text-foreground placeholder:field-hint focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
              <div>
                <label className="label-text block mb-1.5">Time in Force</label>
                <select
                  value={tif}
                  onChange={(e) => setTif(e.target.value as TIF)}
                  className="w-full h-8 px-2 rounded-md bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Day</option>
                  <option>GTC</option>
                  <option>IOC</option>
                  <option>FOK</option>
                </select>
              </div>
            </div>

            {/* Accounts Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text block mb-1.5">Investment A/C</label>
                <select
                  value={investmentAccount}
                  onChange={(e) => setInvestmentAccount(e.target.value)}
                  className="w-full h-8 px-2 rounded-md bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select…</option>
                  <option>INV-001 Main</option>
                  <option>INV-002 Growth</option>
                  <option>INV-003 Retirement</option>
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5">Cash A/C</label>
                <select
                  value={cashAccount}
                  onChange={(e) => setCashAccount(e.target.value)}
                  className="w-full h-8 px-2 rounded-md bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select…</option>
                  <option>CASH-001 USD</option>
                  <option>CASH-002 EUR</option>
                </select>
              </div>
            </div>

            {/* Order By + Value */}
            <div>
              <label className="label-text block mb-1.5">Order Value</label>
              <div className="flex gap-2">
                <div className="grid grid-cols-2 gap-0.5 bg-input rounded-md p-0.5 shrink-0">
                  {(["Amount", "Units"] as OrderBy[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrderBy(o)}
                      className={`px-3 h-7 rounded text-xs font-medium transition-colors ${
                        orderBy === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {orderBy === "Amount" ? "$" : <ArrowUpDown className="h-3.5 w-3.5" />}
                  </span>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={orderBy === "Amount" ? "Enter amount…" : "Enter units…"}
                    className="w-full h-8 pl-7 pr-3 rounded-md bg-input border border-border text-sm font-mono text-foreground placeholder:field-hint focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="p-4 flex flex-col bg-secondary/30">
            <h3 className="label-text mb-3">Order Summary</h3>

            {canSubmit ? (
              <div className="space-y-3 flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Security</span>
                    <span className="font-medium text-foreground">{selectedSecurity?.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Side</span>
                    <span className={`font-semibold ${side === "Buy" ? "text-buy" : "text-sell"}`}>{side}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-foreground">{orderType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">TIF</span>
                    <span className="text-foreground">{tif}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-2 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-mono text-foreground">${effectivePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Units</span>
                    <span className="font-mono text-foreground">{units.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Order Amount</span>
                    <span className="font-mono text-foreground">${orderAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fees (0.1%)</span>
                    <span className="font-mono text-foreground">${fees.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className={`font-mono font-bold ${side === "Buy" ? "text-buy" : "text-sell"}`}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Fill in order details to see the summary
                </p>
              </div>
            )}

            <button
              disabled={!canSubmit}
              className={`mt-3 w-full h-9 rounded-md text-sm font-semibold transition-all ${
                canSubmit
                  ? side === "Buy"
                    ? "bg-buy text-buy-foreground hover:opacity-90 shadow-md"
                    : "bg-sell text-sell-foreground hover:opacity-90 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {canSubmit ? `${side} ${selectedSecurity?.symbol}` : "Complete Order Details"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
