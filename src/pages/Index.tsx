import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateOrderDialog from "@/components/CreateOrderDialog";
import { Plus, BookOpen, ShieldCheck } from "lucide-react";

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background gap-3">
      <button
        onClick={() => setOrderOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
      >
        <Plus className="h-4 w-4" />
        New Order
      </button>
      <button
        onClick={() => navigate("/order-book")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
      >
        <BookOpen className="h-4 w-4" />
        Order Book
      </button>
      <button
        onClick={() => navigate("/approvals")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
      >
        <ShieldCheck className="h-4 w-4" />
        Approvals
      </button>
      <CreateOrderDialog open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
};

export default Index;
