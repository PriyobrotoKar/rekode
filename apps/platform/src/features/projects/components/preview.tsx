import { useEffect, useRef, useState } from 'react';

import { PreviewBridgeClient } from '@rekode/preview-bridge/client';
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconMaximize,
  IconReload,
  IconWorld,
} from '@tabler/icons-react';
import { useParams } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';

import { Button } from '@rekode/ui/components/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@rekode/ui/components/input-group';
import { Separator } from '@rekode/ui/components/separator';
import { Toggle } from '@rekode/ui/components/toggle';

import { maximizePreviewAtom, showPreviewAtom } from '../lib/atoms';

interface PreviewProps {
  projectSlug: string;
}

export function Preview({ projectSlug }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const showPreview = useAtomValue(showPreviewAtom);
  const [url, setUrl] = useState(`http://${projectSlug}.localhost:8081`);

  if (!showPreview) return null;

  return (
    <div className="border-l-border relative flex flex-1 flex-col border-l">
      <PreviewActions iframeRef={iframeRef} url={url} setUrl={setUrl} />
      <Separator className={'bg-sidebar-border'} />
      <iframe
        ref={iframeRef}
        title="Preview"
        loading="lazy"
        allow="location"
        src={`http://${projectSlug}.localhost:8081`}
        width={'100%'}
        className="h-full w-full border-t bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups-to-escape-sandbox allow-pointer-lock allow-popups allow-modals allow-orientation-lock allow-presentation"
      />
    </div>
  );
}

interface PreviewActionsProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  url: string;
  setUrl: (url: string) => void;
}

function PreviewActions({ iframeRef, url }: PreviewActionsProps) {
  const [maximizePreview, setMaximizePreview] = useAtom(maximizePreviewAtom);
  const [currentUrl, setCurrentUrl] = useState(url);
  const { pathname } = new URL(currentUrl);

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src += '';
    }
  };

  useEffect(() => {
    const bridge = new PreviewBridgeClient(url);

    const unsubscribe = bridge.subscribe((data) => {
      if (data.type === 'url_change') {
        setCurrentUrl(data.url);
      }
    });

    return () => {
      unsubscribe();
      bridge.destroy();
    };
  }, [url]);

  return (
    <div className="bg-card flex h-7 items-center justify-between gap-1 p-0.5">
      <div className="flex items-center">
        <Button variant={'ghost'} size={'icon-xs'}>
          <IconChevronLeft />
        </Button>
        <Button variant={'ghost'} size={'icon-xs'}>
          <IconChevronRight />
        </Button>
      </div>

      <InputGroup className="h-6 border-0">
        <InputGroupAddon className="py-0 pl-1.5">
          <IconWorld className="size-3" />
        </InputGroupAddon>
        <InputGroupAddon className="text-muted-foreground py-0 pl-1.5 text-xs">
          {url}
        </InputGroupAddon>
        <InputGroupInput value={pathname} className="h-full sm:text-xs" readOnly />
      </InputGroup>

      <div className="flex items-center">
        <Button size={'icon-xs'} variant={'ghost'} onClick={handleReload}>
          <IconReload />
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size={'icon-xs'} variant={'ghost'}>
            <IconExternalLink />
          </Button>
        </a>
        <Toggle
          size={'xs'}
          variant="default"
          pressed={maximizePreview}
          onPressedChange={(pressed) => setMaximizePreview(pressed)}
          aria-label="Toggle Preview Maximize"
        >
          <IconMaximize />
        </Toggle>
      </div>
    </div>
  );
}
