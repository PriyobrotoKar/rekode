import { useEffect, useState } from 'react';

import Editor, { type Monaco, type OnChange } from '@monaco-editor/react';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { Tabs, TabsList, TabsTrigger } from '@rekode/ui/components/tabs';

import { oklchToHex } from '@/lib/utis';

import { currentPathAtom, editorTabsAtom } from '../lib/atoms';
import Houston from '../lib/themes/houston.json';
import { useSocket } from '../providers/socket-provider';

export function CodeEditor() {
  const editorTabs = useAtomValue(editorTabsAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);

  return (
    currentPath && (
      <div className="bg-card flex flex-1 flex-col">
        <Tabs
          className={'gap-0'}
          value={currentPath}
          onValueChange={(value) => setCurrentPath(value)}
        >
          <div className="bg-card flex items-stretch border-b">
            <EditorActions />
            <TabsList variant={'line'} className={'gap-0'}>
              {editorTabs.map((tab) => (
                <TabsTrigger
                  key={tab.path}
                  value={tab.path}
                  className={
                    'border-border border-0 border-r px-5 pr-2 text-xs after:w-[calc(100%+1px)]'
                  }
                >
                  {tab.path.slice(tab.path.lastIndexOf('/') + 1)}
                  <div className="flex size-2 items-center justify-center">
                    {tab.hasUnsavedChanges && (
                      <span className="inline-block size-1.5 bg-white"></span>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <div className="flex-1">
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
