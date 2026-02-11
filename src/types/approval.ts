export type SecurityType = "Equity" | "Bond" | "Fund";
export type Side = "Buy" | "Sell";

export interface Warning {
  type: "large_order" | "price_deviation" | "unusual_security";
  message: string;
}

export interface ApprovalOrder {
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
  fees: number;
  account: string;
  submittedBy: string;
  approvalStatus: "Pending Approval" | "Approved" | "Rejected";
  approvalComment?: string;
  warnings: Warning[];
  urgency: "normal" | "high";
}
