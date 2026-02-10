import { useState } from "react";
import CreateOrderDialog from "@/components/CreateOrderDialog";
import { Plus } from "lucide-react";

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <button
        onClick={() => setOrderOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
      >
        <Plus className="h-4 w-4" />
        New Order
      </button>
      <CreateOrderDialog open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
};

export default Index;
