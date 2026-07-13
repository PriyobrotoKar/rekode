import { useEffect, useState } from 'react';

import Editor, { type Monaco, type OnChange } from '@monaco-editor/react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightFilled,
  IconX,
} from '@tabler/icons-react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { Tabs, TabsList, TabsTrigger } from '@rekode/ui/components/tabs';
import { Toggle } from '@rekode/ui/components/toggle';
import { cn } from '@rekode/ui/lib/utils';

import { oklchToHex } from '@/lib/utis';

import {
  type EditorTab,
  currentPathAtom,
  editorTabsAtom,
  lastClosedTabPathAtom,
  maximizePreviewAtom,
  pathStackAtom,
  showPreviewAtom,
} from '../lib/atoms';
import Houston from '../lib/themes/houston.json';
import { useSocket } from '../providers/socket-provider';
import { WelcomeScreen } from './welcome-screen';

export function CodeEditor() {
  const [editorTabs, setEditorTabs] = useAtom(editorTabsAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [pathStack, setPathStack] = useAtom(pathStackAtom);
  const setLastClosedTabPath = useSetAtom(lastClosedTabPathAtom);
  const [showPreview, setShowPreview] = useAtom(showPreviewAtom);
  const maximizePreview = useAtomValue(maximizePreviewAtom);

  const handleTabClose = (tab: EditorTab) => {
    console.log('close tab', tab.path);
    if (tab.path === currentPath) {
      const prevPath = pathStack[pathStack.length - 2];

      if (!prevPath) {
        setLastClosedTabPath(tab.path);
        setPathStack([]);
        setCurrentPath('');
        setEditorTabs([]);
        return;
      }

      setCurrentPath(prevPath);
      setPathStack(pathStack.slice(0, -1));
    }
    const updatedTabs = editorTabs.filter((t) => t.path !== tab.path);
    setEditorTabs(updatedTabs);
  };

  if (!currentPath) return <WelcomeScreen />;

  return (
    currentPath && (
      <div
        className={cn('bg-card flex min-h-0 min-w-0 flex-1 flex-col', maximizePreview && 'hidden')}
      >
        <Tabs
          className={'gap-0'}
          value={currentPath}
          onValueChange={(value) => {
            const index = pathStack.findIndex((p) => p === value);
            pathStack.splice(index, 1);
            setPathStack([...pathStack, value]);
            setCurrentPath(value);
          }}
        >
          <div className="bg-card flex items-center justify-between border-b">
            <div className="flex items-center min-w-0 flex-1">
              <EditorActions />
              <TabsList variant={'line'} className={'gap-0 min-w-0 overflow-y-auto no-scrollbar'}>
                {editorTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.path}
                    value={tab.path}
                    className={
                      'border-border group border-0 border-r px-2 text-xs after:w-[calc(100%+1px)]'
                    }
                  >
                    <div className="flex size-3 items-center justify-center">
                      {tab.hasUnsavedChanges && (
                        <span className="inline-block size-1.5 bg-white"></span>
                      )}
                    </div>

                    {tab.path.slice(tab.path.lastIndexOf('/') + 1)}
                    <div className="flex size-3 items-center justify-center">
                      <Button
                        variant={'ghost'}
                        size={'icon-xs'}
                        className={'hidden group-hover:inline-flex'}
                        onClick={() => handleTabClose(tab)}
                      >
                        <IconX className="size-3" />
                      </Button>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="h-6 px-0.5">
              <Toggle
                size={'xs'}
                variant="default"
                pressed={showPreview}
                onPressedChange={(pressed) => setShowPreview(pressed)}
                aria-label="Toggle preview"
              >
                <IconLayoutSidebarRight className="block group-aria-pressed/toggle:hidden" />
                <IconLayoutSidebarRightFilled className="hidden group-aria-pressed/toggle:block" />
              </Toggle>
            </div>
          </div>
        </Tabs>
        <div className="min-h-0 flex-1">
          <MonacoEditor />
        </div>
      </div>
    )
  );
}

function EditorActions() {
  return (
    <div className="flex items-center border-r px-1">
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconArrowLeft />
      </Button>
      <Button size={'icon-xs'} variant={'ghost'} disabled>
        <IconArrowRight />
      </Button>
    </div>
  );
}

const FILE_READY_EVENT = 'file.read';
const FILE_WRITE_EVENT = 'file.write';

function MonacoEditor() {
  const { subscribe, send } = useSocket();
  const setEditorTabs = useSetAtom(editorTabsAtom);
  const currentPath = useAtomValue(currentPathAtom);

  const [fileContent, setFileContent] = useState<string | null>(null);

  const rootStyles = getComputedStyle(document.body);
  const bgColor = rootStyles.getPropertyValue('--sidebar').trim();

  useHotkey('Mod+S', () => save());

  const save = () => {
    send(FILE_WRITE_EVENT, { path: currentPath, content: fileContent });
    setEditorTabs((prev) => {
      return prev.map((tab) => {
        if (tab.path === currentPath) {
          return { ...tab, hasUnsavedChanges: false };
        }
        return tab;
      });
    });
  };

  const handleEditorDidMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('houston', {
      base: 'vs-dark',
      inherit: true,
      ...Houston,
      colors: {
        ...Houston.colors,
        'editor.background': oklchToHex(bgColor),
        'editorGutter.background': oklchToHex(bgColor),
      },
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      baseUrl: 'file:///workspace',
    });
  };

  const handleEditorChange: OnChange = (value) => {
    setFileContent(value ?? '');
    if (!value) return;
    setEditorTabs((prev) => {
      return prev.map((tab) => {
        if (tab.path === currentPath) {
          return { ...tab, hasUnsavedChanges: true };
        }
        return tab;
      });
    });
  };

  useEffect(() => {
    const unsubscribe = subscribe(FILE_READY_EVENT, (data) => {
      setFileContent(data);
    });

    return () => unsubscribe();
  }, [subscribe]);

  if (fileContent === null) return null;

  return (
    <Editor
      theme="houston"
      height="100%"
      beforeMount={handleEditorDidMount}
      value={fileContent}
      path={'file:///workspace/' + currentPath}
      onChange={handleEditorChange}
      options={{
        fontSize: 14,
        lineHeight: 1.8,
        fontFamily: "'Geist Mono Variable', 'Fira Code', 'Courier New', monospace",
        fontLigatures: true,
        wordWrap: 'on',
        minimap: {
          enabled: false,
        },
        bracketPairColorization: {
          enabled: true,
        },
        formatOnPaste: true,
        suggest: {
          showFields: false,
          showFunctions: false,
        },
      }}
    />
  );
}
