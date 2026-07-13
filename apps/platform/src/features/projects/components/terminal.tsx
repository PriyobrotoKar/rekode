import {
  type ForwardedRef,
  type MutableRefObject,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react';

import { IconLayoutColumns, IconPlus, IconTerminal } from '@tabler/icons-react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal as XTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useAtom, useAtomValue } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rekode/ui/components/tabs';
import { cn } from '@rekode/ui/lib/utils';

import { showTerminalAtom, workspaceTasksAtom } from '../lib/atoms';
import { useSocket } from '../providers/socket-provider';

const TERMINAL_OUTPUT_NAMESPACE = 'terminal.output';
const TERMINAL_INPUT_NAMESPACE = 'terminal.input';
const TERMINAL_RESIZE_NAMESPACE = 'terminal.resize';

type TerminalProps = object;

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const Terminal = forwardRef<XTerminal, TerminalProps>(function Terminal(_, forwardedRef) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerminal | null>(null);
  const rootStyles = getComputedStyle(document.body);
  const bgColor = rootStyles.getPropertyValue('--background').trim();

  const { subscribe, send } = useSocket();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      fontSize: 12,
      theme: {
        background: bgColor,
      },
    });
    termRef.current = term;
    assignRef(forwardedRef, term);

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
      console.log('terminal reized');
      fitAddon.fit();
      send(TERMINAL_RESIZE_NAMESPACE, {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    term.focus();

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      termRef.current = null;
      assignRef(forwardedRef, null);
      term.dispose(); // cleanup
    };
  }, [bgColor, forwardedRef, send, subscribe]);

  return <div ref={terminalRef} className="h-56 w-full min-w-0 bg-transparent px-3" />;
});

export function Terminals() {
  const [terminalOpen, setTerminalOpen] = useAtom(showTerminalAtom);
  const workspaceStatus = useAtomValue(workspaceTasksAtom);
  const terminalRef = useRef<XTerminal | null>(null);

  const isWorkspaceReady = Object.values(workspaceStatus).every(
    ({ status }) => status === 'completed' || status === 'failed',
  );

  useHotkey(
    'Mod+J',
    () => {
      if (terminalOpen) {
        setTerminalOpen(false);
        terminalRef.current?.blur();
      } else {
        setTerminalOpen(true);
        terminalRef.current?.focus();
      }
    },
    { preventDefault: true },
  );

  if (!isWorkspaceReady) return null;

  return (
    <Tabs className={cn('min-w-0 flex-none overflow-hidden', terminalOpen ? 'h-68' : 'h-0')}>
      <div className="bg-card flex justify-between border-y">
        <TabsList variant={'line'}>
          <TabsTrigger value={'tty-1'} className={'px-3 text-xs'}>
            <IconTerminal /> Terminal
          </TabsTrigger>
        </TabsList>
        <TerminalActions />
      </div>
      <TabsContent value={'tty-1'} className="min-w-0">
        <Terminal ref={terminalRef} />
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
