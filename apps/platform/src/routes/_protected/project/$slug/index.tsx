import { useEffect } from 'react';

import { BottomPanel } from '@/features/projects/components/bottom-panel';
import { CodeEditor } from '@/features/projects/components/editor';
import { ExplorerSidebar } from '@/features/projects/components/explorer-sidebar';
import { Terminals } from '@/features/projects/components/terminal';
import { WorkspaceLoader } from '@/features/projects/components/workspace-loader';
import { SocketProvider } from '@/features/projects/providers/socket-provider';
import { getProjectBySlugQueryOptions } from '@/features/projects/queries';
import { Header } from '@/features/shared/components/header';
import { IconCode } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@rekode/ui/components/sidebar';

export const Route = createFileRoute('/_protected/project/$slug/')({
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();

  const { data, refetch } = useQuery({
    ...getProjectBySlugQueryOptions(slug),
  });

  useEffect(() => {
    if (!data) return;
    let interval: NodeJS.Timeout | null = null;

    if (!data.containerUrl) {
      interval = setInterval(refetch, 500);
    } else {
      if (interval) clearInterval(interval);
      interval = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [data]);

  if (typeof window === 'undefined' || !data) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden [--bottom-panel-height:calc(--spacing(6))]">
      <SocketProvider socketUrl={data?.containerUrl?.replace('http', 'ws') ?? null}>
        <SidebarProvider defaultOpen={false} className="flex flex-col">
          <Header Icon={IconCode} title="Drafts/sweet-monkey" />
          <div className="flex flex-1">
            <ExplorerSidebar />
            <SidebarInset>
              <div className="flex flex-1 flex-col">
                <WorkspaceLoader />
                <CodeEditor />
              </div>
              <Terminals />
            </SidebarInset>
          </div>
          <BottomPanel />
        </SidebarProvider>
      </SocketProvider>
    </div>
  );
}
