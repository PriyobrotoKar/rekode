import { useEffect, useState } from 'react';

import Editor, { type BeforeMount, DiffEditor, loader, useMonaco } from '@monaco-editor/react';
import { shikiToMonaco } from '@shikijs/monaco';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { createHighlighter } from 'shiki';

import { Button } from '@rekode/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rekode/ui/components/tabs';

import { useSocket } from '../providers/socket-provider';

export function CodeEditor() {
  return (
    <div className="bg-card flex flex-1 flex-col">
      <Tabs className={'gap-0'}>
        <div className="flex items-stretch border-b">
          <EditorActions />
          <TabsList variant={'line'}>
            <TabsTrigger value={'index.js'} className={'px-3 text-xs'}>
              index.js
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      <div className="flex-1">
        <MonacoEditor />
      </div>
    </div>
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

function MonacoEditor() {
  const { subscribe } = useSocket();
  const [fileContent, setFileContent] = useState('');

  const handleEditorWillMount: BeforeMount = async (monaco) => {
    // Create the highlighter, it can be reused
    const highlighter = await createHighlighter({
      themes: [
        'vitesse-dark',
        'dark-plus',
        'gruvbox-dark-hard',
        'houston',
        'material-theme-darker',
      ],
      langs: ['javascript', 'typescript', 'css', 'html', 'json'],
    });
    // Register the languageIds first. Only registered languages will be highlighted.
    monaco.languages.register({ id: 'typescript' });
    monaco.languages.register({ id: 'javascript' });
    monaco.languages.register({ id: 'css' });
    monaco.languages.register({ id: 'html' });
    monaco.languages.register({ id: 'json' });
    // Register the themes from Shiki, and provide syntax highlighting for Monaco.
    shikiToMonaco(highlighter, monaco);
  };

  useEffect(() => {
    subscribe(FILE_READY_EVENT, (data) => {
      console.log(data);
      setFileContent(data);
    });
  }, [subscribe]);

  return (
    <Editor
      theme="houston"
      height="100%"
      defaultLanguage="javascript"
      beforeMount={handleEditorWillMount}
      value={fileContent}
      options={{
        lineHeight: 1.75,
        fontSize: 14,
        minimap: {
          enabled: false,
        },
      }}
    />
  );
}
