import { useEffect, useRef, useState } from 'react';

import { FileTree, useFileTree, useFileTreeSelection } from '@pierre/trees/react';
import { IconFilePlus, IconFolderPlus, IconLayoutSidebarRight } from '@tabler/icons-react';

import { Button } from '@rekode/ui/components/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from '@rekode/ui/components/sidebar';

import { useSocket } from '../providers/socket-provider';

const FILES_LOADED_EVENT = 'files.loaded';
const FILE_REQUESTED_EVENT = 'file.requested';

export function ExplorerSidebar() {
  const [paths, setPaths] = useState([]);
  const { subscribe, send } = useSocket();
  const { model } = useFileTree({
    paths,
    density: 'compact',
    icons: {
      set: 'complete',
    },
  });

  const selectedPaths = useFileTreeSelection(model);

  useEffect(() => {
    subscribe(FILES_LOADED_EVENT, (payload) => {
      setPaths(payload);
    });
  }, [subscribe, model]);

  useEffect(() => {
    console.log(selectedPaths);
    send(FILE_REQUESTED_EVENT, {
      path: selectedPaths[0],
    });
  }, [selectedPaths, send]);

  return (
    <Sidebar>
      <SidebarHeader className="flex-row items-center justify-between">
        <h2 className="text-muted-foreground px-1 text-xs">Explorer</h2>
        <ExplorerActions />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="gap-0 pt-0.5">
        <FileTree
          model={model}
          style={
            {
              '--trees-padding-inline': 'var(--spacing) * 0.5',
              '--trees-scrollbar-gutter-override': '0px',
              '--trees-border-radius': '0px',
              '--trees-item-margin-x-override': '0px',
              '--trees-bg-muted-override':
                'color-mix(in oklab, var(--sidebar-accent) 50%, transparent)',
              '--trees-selected-fg-override': 'var(--primary-foreground)',
              '--trees-selected-bg-override': 'var(--sidebar-accent)',
              '--trees-theme-focus-ring': 'var(--border)',
            } as React.CSSProperties
          }
        />
      </SidebarContent>
    </Sidebar>
  );
}

function ExplorerActions() {
  return (
    <div className="flex items-center">
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconFilePlus />
      </Button>
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconFolderPlus />
      </Button>
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconLayoutSidebarRight />
      </Button>
    </div>
  );
}
