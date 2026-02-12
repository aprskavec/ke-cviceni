import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DesignSystem from "./pages/DesignSystem";
import PromptImage from "./pages/PromptImage";
import DatoCmsDebug from "./pages/DatoCmsDebug";
import KubaEnglish from "./pages/KubaEnglish";
import Marketing from "./pages/Marketing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/promptimage" element={<PromptImage />} />
          <Route path="/datocms" element={<DatoCmsDebug />} />
          <Route path="/kuba" element={<KubaEnglish />} />
          <Route path="/marketing" element={<Marketing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
