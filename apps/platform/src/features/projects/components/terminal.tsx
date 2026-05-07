import { useEffect, useRef } from 'react';

import {
  IconLayoutBoardSplit,
  IconLayoutColumns,
  IconPlus,
  IconTerminal,
} from '@tabler/icons-react';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal as XTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

import { Button } from '@rekode/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rekode/ui/components/tabs';

import { useSocket } from '../providers/socket-provider';

const TERMINAL_OUTPUT_NAMESPACE = 'terminal.output';
const TERMINAL_INPUT_NAMESPACE = 'terminal.input';
const TERMINAL_RESIZE_NAMESPACE = 'terminal.resize';

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const rootStyles = getComputedStyle(document.body);
  const bgColor = rootStyles.getPropertyValue('--background').trim();

  const { subscribe, send } = useSocket();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: bgColor,
      },
    });

    const fitAddon = new FitAddon();
    const webglAddon = new WebglAddon();

    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    try {
      term.loadAddon(webglAddon);
    } catch (error) {
      console.warn('WebGL addon failed to load, falling back to canvas renderer.', error);
    }

    send(TERMINAL_RESIZE_NAMESPACE, {
      cols: term.cols,
      rows: term.rows,
    });

    subscribe(TERMINAL_OUTPUT_NAMESPACE, (data) => {
      term.write(data);
    });

    term.onData((data) => {
      send(TERMINAL_INPUT_NAMESPACE, data);
    });

    const handleResize = () => {
      fitAddon.fit();
      send(TERMINAL_RESIZE_NAMESPACE, {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose(); // cleanup
    };
  }, []);

  return <div ref={terminalRef} className="h-60 w-full bg-transparent px-3" />;
}

export function Terminals() {
  return (
    <Tabs className={'h-72'}>
      <div className="flex justify-between border-y">
        <TabsList variant={'line'}>
          <TabsTrigger value={'tty-1'} className={'px-3 text-xs'}>
            <IconTerminal /> Terminal
          </TabsTrigger>
        </TabsList>
        <TerminalActions />
      </div>
      <TabsContent value={'tty-1'}>
        <Terminal />
      </TabsContent>
    </Tabs>
  );
}

export function TerminalActions() {
  return (
    <div className="flex items-center border-l px-1">
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconLayoutColumns />
      </Button>
      <Button size={'icon-xs'} variant={'ghost'}>
        <IconPlus />
      </Button>
    </div>
  );
}
