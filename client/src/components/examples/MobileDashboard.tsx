import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { MobileDashboard } from '../MobileDashboard';

const queryClient = new QueryClient();

export default function MobileDashboardExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MobileDashboard onLogout={() => console.log('Logout triggered')} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}