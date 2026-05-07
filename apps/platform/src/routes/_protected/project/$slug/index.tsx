import { CodeEditor } from '@/features/projects/components/editor';
import { ExplorerSidebar } from '@/features/projects/components/explorer-sidebar';
import { Terminal, Terminals } from '@/features/projects/components/terminal';
import { SocketProvider } from '@/features/projects/providers/socket-provider';
import { createFileRoute } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@rekode/ui/components/sidebar';

export const Route = createFileRoute('/_protected/project/$slug/')({
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="h-screen">
      <SocketProvider>
        <SidebarProvider>
          <ExplorerSidebar />
          <SidebarInset>
            <CodeEditor />
            <Terminals />
          </SidebarInset>
        </SidebarProvider>
      </SocketProvider>
    </div>
  );
}
