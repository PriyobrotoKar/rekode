import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

import '@pierre/trees/react';
import { FileTree, useFileTree, useFileTreeSelector } from '@pierre/trees/react';
import { IconFilePlus, IconFolderPlus, IconLayoutSidebarRight } from '@tabler/icons-react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
} from '@rekode/ui/components/sidebar';

import { areArraysEqual } from '@/lib/utis';

import {
  currentPathAtom,
  editorTabsAtom,
  lastClosedTabPathAtom,
  maximizePreviewAtom,
  pathStackAtom,
  workspaceTasksAtom,
} from '../lib/atoms';
import { useSocket } from '../providers/socket-provider';

const TASK_STATE_UPDATED = 'task.state.updated';
const TASK_STATE_REQUESTED_EVENT = 'task.state.requested';

const DIR_REQUESTED_EVENT = 'dir.requested';
const DIRS_WATCHED_EVENT = 'dirs.watched';

const FILES_LOADED_EVENT = 'files.loaded';
const FILE_REQUESTED_EVENT = 'file.requested';
const FILE_CREATED_EVENT = 'file.created';

const GIT_STATUS_UPDATED_EVENT = 'git.status.updated';

type ChangedFileEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

interface ChangedFilePayload {
  event: ChangedFileEvent;
  path: string;
}

const isDirectory = (path: string) => path.endsWith('/');

const FILE_TREE_STYLE: CSSProperties = {
  '--trees-padding-inline': 'var(--spacing) * 0.5',
  '--trees-scrollbar-gutter-override': '0px',
  '--trees-border-radius': '0px',
  '--trees-item-margin-x-override': '0px',
  '--trees-bg-override': 'var(--sidebar)',
  '--trees-bg-muted-override': 'color-mix(in oklab, var(--sidebar-accent) 50%, transparent)',
  '--trees-selected-fg-override': 'var(--primary-foreground)',
  '--trees-selected-bg-override': 'var(--sidebar-accent)',
  '--trees-theme-focus-ring': 'var(--border)',
} as CSSProperties;

const FILE_EXCLUSIONS = [
  '.git/',
  '.svn/',
  '.hg/',
  'CVS/',
  '.DS_Store/',
  'Thumbs.db/',
  '.classpath/',
  '/.settings',
];

export function ExplorerSidebar() {
  const { setOpen, toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(true);
  const workspaceTasks = useAtomValue(workspaceTasksAtom);
  const [editorTabs, setEditorTabs] = useAtom(editorTabsAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [pathStack, setPathStack] = useAtom(pathStackAtom);
  const setMaximizePreview = useSetAtom(maximizePreviewAtom);
  const currentPathRef = useRef<string>('');
  const selectedPathRef = useRef<string | undefined>(undefined);
  const isSyncingSelectionRef = useRef(false);
  const syncTargetPathRef = useRef<string | null>(null);
  const lastRequestedPathRef = useRef<string | null>(null);
  const expandedDirsRef = useRef<string[]>([]);
  const requestedDirsRef = useRef<Set<string>>(new Set());
  const paths = useRef<string[]>([]);
  const gitStatus = useRef([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { subscribe, send, isReady } = useSocket();
  const { model } = useFileTree({
    paths: paths.current,
    gitStatus: gitStatus.current,
    density: 'compact',
    icons: {
      set: 'complete',
    },
  });

  const getSelectedPaths = useCallback((m: typeof model) => m.getSelectedPaths(), []);
  const selectedPaths = useFileTreeSelector(model, getSelectedPaths, areArraysEqual);

  const isExpandedDirectoryItem = (
    item: ReturnType<typeof model.getItem>,
  ): item is NonNullable<ReturnType<typeof model.getItem>> & {
    collapse: () => void;
    isExpanded: () => boolean;
  } => !!item && item.isDirectory() && 'isExpanded' in item && 'collapse' in item;

  const getAncestorDirs = (dirPath: string): string[] => {
    const normalized = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
    const hasLeadingSlash = normalized.startsWith('/');
    const parts = normalized.split('/').filter(Boolean);
    const ancestors: string[] = [];
    let current = hasLeadingSlash ? '/' : '';

    for (let i = 0; i < parts.length - 1; i += 1) {
      current += `${parts[i]}/`;
      ancestors.push(current);
    }

    return ancestors;
  };

  const collectExpandedDirs = (currentModel: typeof model): string[] => {
    const raw = paths.current.filter((path) => {
      if (!isDirectory(path)) return false;

      const item = currentModel.getItem(path);

      return isExpandedDirectoryItem(item) && item.isExpanded();
    });

    const rawSet = new Set(raw);

    return raw.filter((dir) => getAncestorDirs(dir).every((ancestor) => rawSet.has(ancestor)));
  };

  const expandedDirs = useFileTreeSelector(model, collectExpandedDirs, areArraysEqual);

  const requestFile = useCallback(
    (path: string) => {
      if (lastRequestedPathRef.current === path) return;

      send(FILE_REQUESTED_EVENT, { path });
      lastRequestedPathRef.current = path;
    },
    [send],
  );

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    setOpen(workspaceTasks.clone_repo.status !== 'pending');
  }, [workspaceTasks.clone_repo]);

  useEffect(() => {
    selectedPathRef.current = selectedPaths[0];
  }, [selectedPaths]);

  useEffect(() => {
    if (!isReady) return;

    if (workspaceTasks.clone_repo.status === 'completed') {
      send(DIR_REQUESTED_EVENT, { path: '/' });
    }

    const unsubscribeTaskStateUpdated = subscribe(TASK_STATE_UPDATED, (payload) => {
      const status: string = payload.task?.status;
      const taskId: string = payload.taskId;

      if (taskId === 'clone_repo' && status === 'completed') {
        send(DIR_REQUESTED_EVENT, { path: '/' });
      }
    });

    const unsubscribeFilesLoaded = subscribe(FILES_LOADED_EVENT, (payload) => {
      setLoading(false);
      const filteredPaths = payload.filter(
        (path: string) => !FILE_EXCLUSIONS.some((exclusion) => path.includes(exclusion)),
      );
      const mergePaths = Array.from(new Set([...paths.current, ...filteredPaths]));
      const expandedBeforeReset = collectExpandedDirs(model);
      expandedDirsRef.current = expandedBeforeReset;

      model.resetPaths(mergePaths, {
        initialExpandedPaths: expandedBeforeReset,
      });

      paths.current = mergePaths;
    });

    const unsubscribeGitStatus = subscribe(GIT_STATUS_UPDATED_EVENT, (payload) => {
      model.setGitStatus(payload);
      gitStatus.current = payload;
    });

    const unsubscribeFileCreated = subscribe(FILE_CREATED_EVENT, (payload) => {
      const isExcluded = FILE_EXCLUSIONS.some((exclusion) => payload.includes(exclusion));
      if (isExcluded) return;
      model.add(payload);
    });

    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      unsubscribeTaskStateUpdated();
      unsubscribeFilesLoaded();
      unsubscribeGitStatus();
      unsubscribeFileCreated();
    };
  }, [subscribe, model, isReady, send, workspaceTasks]);

  const lastClosedTabPath = useAtomValue(lastClosedTabPathAtom);
  const setLastClosedTabPath = useSetAtom(lastClosedTabPathAtom);

  useEffect(() => {
    if (!currentPath || isDirectory(currentPath)) return;

    requestFile(currentPath);

    const selectedPath = selectedPathRef.current;

    if (selectedPath === currentPath) return;

    isSyncingSelectionRef.current = true;
    syncTargetPathRef.current = currentPath;

    if (selectedPath) {
      model.getItem(selectedPath)?.deselect();
    }

    model.getItem(currentPath)?.select();
  }, [currentPath, model, requestFile]);

  useEffect(() => {
    if (!lastClosedTabPath) return;

    const item = model.getItem(lastClosedTabPath);
    item?.deselect();
    setLastClosedTabPath(null);
  }, [lastClosedTabPath, model, setLastClosedTabPath]);

  useEffect(() => {
    const path = selectedPaths[0];

    console.log(path);

    if (!path) return;
    const item = model.getItem(path);

    if (item?.isDirectory()) return;

    // Return early if tabs are being swichted
    if (isSyncingSelectionRef.current) {
      if (path === syncTargetPathRef.current) {
        isSyncingSelectionRef.current = false;
        syncTargetPathRef.current = null;
      }

      return;
    }

    // On filetree selection only
    console.log('Updated tabs', editorTabs);
    setEditorTabs((prev) => {
      console.log('Prev', prev);
      return prev.map((tab) => tab.path).includes(path)
        ? prev
        : [...prev, { path, hasUnsavedChanges: false }];
    });

    // if (currentPathRef.current === path) return;

    setCurrentPath(path);
    setMaximizePreview((prev) => prev ? false : prev);
    const index = pathStack.findIndex((p) => p === path);
    if (index !== -1) pathStack.splice(index, 1);
    setPathStack([...pathStack, path]);
  }, [selectedPaths, setCurrentPath, setEditorTabs]);

  useEffect(() => {
    if (!isReady) return;

    const prev = new Set(expandedDirsRef.current);
    const next = new Set(expandedDirs);

    const collapsedDirs = expandedDirsRef.current.filter((dir) => !next.has(dir));

    for (const collapsedDir of collapsedDirs) {
      for (const path of paths.current) {
        if (!isDirectory(path) || path === collapsedDir || !path.startsWith(collapsedDir)) continue;

        const item = model.getItem(path);
        if (!isExpandedDirectoryItem(item) || !item.isExpanded()) continue;

        item.collapse();
      }

      const requestedDescendants = Array.from(requestedDirsRef.current).filter((requestedDir) =>
        requestedDir.startsWith(collapsedDir),
      );

      for (const requestedDescendant of requestedDescendants) {
        requestedDirsRef.current.delete(requestedDescendant);
      }
    }

    for (const dir of next) {
      if (!prev.has(dir) && !requestedDirsRef.current.has(dir)) {
        requestedDirsRef.current.add(dir);
        send(DIR_REQUESTED_EVENT, { path: dir });
      }
    }

    const nextExpandedDirs = collectExpandedDirs(model);

    if (!areArraysEqual(expandedDirsRef.current, nextExpandedDirs)) {
      send(DIRS_WATCHED_EVENT, { paths: nextExpandedDirs });
    }

    expandedDirsRef.current = nextExpandedDirs;
  }, [expandedDirs, isReady, model, send]);

  return (
    <Sidebar className="top-(--header-height) bottom-(--bottom-panel-height) h-[calc(100svh-var(--bottom-panel-height)-var(--header-height))]!">
      <SidebarHeader className="bg-card flex-row items-center justify-between p-0.5">
        <h2 className="text-muted-foreground px-1 text-xs">Explorer</h2>
        <ExplorerActions />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="gap-0 pt-0.5">
        {loading && <ExplorerItemsLoader />}
        <FileTree model={model} style={FILE_TREE_STYLE} className={loading ? 'hidden!' : ''} />
      </SidebarContent>
    </Sidebar>
  );
}

function ExplorerActions() {
  const { setOpen, open } = useSidebar();

  return (
    <div className="flex items-center">
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconFilePlus />
      </Button>
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconFolderPlus />
      </Button>
      <Button size={'icon-xs'} onClick={() => setOpen(!open)} variant={'ghost'}>
        <IconLayoutSidebarRight />
      </Button>
    </div>
  );
}

function ExplorerItemsLoader() {
  const itemsLength = 10;

  return (
    <div>
      {Array.from({ length: itemsLength }).map((_, i) => (
        <SidebarMenuSkeleton
          key={i}
          className="h-6"
          style={{
            opacity: (itemsLength - i) / (itemsLength - 1),
          }}
        />
      ))}
    </div>
  );
}
