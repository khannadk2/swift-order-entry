import { useMemo } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Severity = "hard" | "soft" | "warning" | "pass";

interface CheckResult {
  name: string;
  severity: Severity;
  message: string;
}

interface PreTradeChecksProps {
  security: { symbol: string; name: string; type: string; price: number } | null;
  side: "Buy" | "Sell";
  orderAmount: number;
  limitPrice: string;
  orderType: string;
  investmentAccount: string;
  cashAccount: string;
}

// Mock portfolio data
const MOCK_PORTFOLIO: Record<string, number> = {
  "INV-001 Main": 500000,
  "INV-002 Growth": 250000,
  "INV-003 Retirement": 800000,
};

const MOCK_CASH: Record<string, number> = {
  "CASH-001 USD": 75000,
  "CASH-002 EUR": 42000,
};

const MOCK_HOLDINGS: Record<string, Record<string, number>> = {
  "INV-001 Main": { AAPL: 80000, MSFT: 120000 },
  "INV-002 Growth": { TSLA: 60000, GOOGL: 40000 },
  "INV-003 Retirement": { US10Y: 200000, VFIAX: 300000 },
};

const RESTRICTED_SECURITIES = ["MUNI7Y"];

// Client residency restricted securities (e.g., US-person restrictions)
const RESIDENCY_RESTRICTED: Record<string, string> = {
  SWPPX: "Security not available for non-US resident clients",
};

function runChecks(props: PreTradeChecksProps): CheckResult[] {
  const { security, side, orderAmount, limitPrice, orderType, investmentAccount, cashAccount } = props;
  const results: CheckResult[] = [];

  if (!security || orderAmount <= 0) return results;

  // 1. Restricted security (HARD)
  if (RESTRICTED_SECURITIES.includes(security.symbol)) {
    results.push({
      name: "Restricted Security",
      severity: "hard",
      message: `${security.symbol} is on the restricted securities list and cannot be traded.`,
    });
  }

  // 2. Client residency check (HARD)
  if (RESIDENCY_RESTRICTED[security.symbol]) {
    results.push({
      name: "Client Residency",
      severity: "hard",
      message: RESIDENCY_RESTRICTED[security.symbol],
    });
  }

  // 3. Cash sufficiency (HARD for Buy)
  if (side === "Buy" && cashAccount) {
    const available = MOCK_CASH[cashAccount] ?? 0;
    if (orderAmount > available) {
      results.push({
        name: "Cash Sufficiency",
        severity: "hard",
        message: `Insufficient funds. Required: $${orderAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} — Available: $${available.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      });
    } else {
      results.push({
        name: "Cash Sufficiency",
        severity: "pass",
        message: `Sufficient funds available ($${available.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
      });
    }
  }

  // 4. Concentration limit (HARD — >20% of portfolio)
  if (investmentAccount) {
    const portfolioValue = MOCK_PORTFOLIO[investmentAccount] ?? 0;
    const currentHolding = MOCK_HOLDINGS[investmentAccount]?.[security.symbol] ?? 0;
    const newExposure = side === "Buy" ? currentHolding + orderAmount : currentHolding - orderAmount;
    const concentration = portfolioValue > 0 ? (newExposure / portfolioValue) * 100 : 0;
    if (concentration > 20) {
      results.push({
        name: "Concentration Limit",
        severity: "hard",
        message: `Post-trade concentration of ${concentration.toFixed(1)}% exceeds 20% limit for ${security.symbol}.`,
      });
    } else {
      results.push({
        name: "Concentration Limit",
        severity: "pass",
        message: `Post-trade concentration: ${concentration.toFixed(1)}% (limit: 20%)`,
      });
    }
  }

  // 5. Order size limit (SOFT — >$100K requires approval)
  if (orderAmount > 100000) {
    results.push({
      name: "Order Size",
      severity: "soft",
      message: `Order value $${orderAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} exceeds $100,000 threshold — requires approval.`,
    });
  } else {
    results.push({
      name: "Order Size",
      severity: "pass",
      message: `Order value within threshold`,
    });
  }

  // 6. Price deviation (WARNING — limit price >3% from market)
  if (orderType === "Limit" && limitPrice) {
    const limit = parseFloat(limitPrice);
    const deviation = Math.abs((limit - security.price) / security.price) * 100;
    if (deviation > 3) {
      results.push({
        name: "Price Deviation",
        severity: "warning",
        message: `Limit price deviates ${deviation.toFixed(1)}% from market price ($${security.price.toFixed(2)}).`,
      });
    } else {
      results.push({
        name: "Price Deviation",
        severity: "pass",
        message: `Limit price within 3% of market`,
      });
    }
  }

  return results;
}

export type OverallOutcome = "hard" | "soft" | "warning" | "pass";

export function usePreTradeOutcome(props: PreTradeChecksProps): { checks: CheckResult[]; outcome: OverallOutcome } {
  const checks = useMemo(() => runChecks(props), [
    props.security?.symbol, props.side, props.orderAmount,
    props.limitPrice, props.orderType, props.investmentAccount, props.cashAccount,
  ]);

  const outcome: OverallOutcome = useMemo(() => {
    if (checks.some((c) => c.severity === "hard")) return "hard";
    if (checks.some((c) => c.severity === "soft")) return "soft";
    if (checks.some((c) => c.severity === "warning")) return "warning";
    return "pass";
  }, [checks]);

  return { checks, outcome };
}

const severityConfig: Record<Severity, { icon: typeof ShieldX; color: string; label: string }> = {
  hard: { icon: ShieldX, color: "text-sell", label: "Blocked" },
  soft: { icon: ShieldAlert, color: "text-warning", label: "Approval Required" },
  warning: { icon: AlertTriangle, color: "text-warning", label: "Warning" },
  pass: { icon: ShieldCheck, color: "text-buy", label: "Pass" },
};

interface PreTradeChecksPanelProps {
  checks: CheckResult[];
  outcome: OverallOutcome;
}

export default function PreTradeChecksPanel({ checks, outcome }: PreTradeChecksPanelProps) {
  const [expanded, setExpanded] = useState(outcome !== "pass");

  if (checks.length === 0) return null;

  const nonPassChecks = checks.filter((c) => c.severity !== "pass");
  const passChecks = checks.filter((c) => c.severity === "pass");

  const summaryConfig = severityConfig[outcome];
  const SummaryIcon = summaryConfig.icon;

  return (
    <div
      className={`rounded-md border overflow-hidden transition-colors ${
        outcome === "hard"
          ? "border-sell/30 bg-sell/5"
          : outcome === "soft"
          ? "border-warning/30 bg-warning/5"
          : outcome === "warning"
          ? "border-warning/20 bg-warning/5"
          : "border-buy/20 bg-buy/5"
      }`}
    >
      {/* Summary header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <SummaryIcon className={`h-4 w-4 ${summaryConfig.color}`} />
          <span className={`text-xs font-semibold ${summaryConfig.color}`}>
            Pre-Trade Check: {outcome === "pass" ? "All Passed" : `${nonPassChecks.length} issue${nonPassChecks.length > 1 ? "s" : ""} found`}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-2.5 space-y-1.5">
          {nonPassChecks.map((check, i) => {
            const cfg = severityConfig[check.severity];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                <div>
                  <span className={`font-medium ${cfg.color}`}>{check.name}</span>
                  <span className="text-muted-foreground ml-1.5">{check.message}</span>
                </div>
              </div>
            );
          })}
          {passChecks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-buy pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>{passChecks.length} check{passChecks.length > 1 ? "s" : ""} passed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
