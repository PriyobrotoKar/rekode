import { useEffect, useRef, useState } from 'react';

import {
  IconCircle,
  IconCircleCheckFilled,
  IconLoader2,
  type IconProps,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';

import { Badge } from '@rekode/ui/components/badge';
import { DotmSquare7 } from '@rekode/ui/components/dotm-square-7';
import { cn } from '@rekode/ui/lib/utils';

import { type LoaderStepId, useWorkspaceStatus } from '../hooks/use-workspace-status';
import type { WorkspaceTasks } from '../lib/atoms';

interface Step {
  id: LoaderStepId;
  label: string;
  startTime?: number;
  endTime?: number;
}

const LOADER_STEPS: Array<Step> = [
  { id: 'create_workspace', label: 'Creating Workspace' },
  { id: 'clone_repo', label: 'Cloning Repository' },
  { id: 'install_deps', label: 'Installing Dependencies' },
  { id: 'start_development_server', label: 'Starting Development Server' },
];

interface StepStatus {
  status: 'completed' | 'pending' | 'active';
  icon: React.FC<IconProps>;
  rule: (activeStepIndex: number, index: number) => boolean;
}

const stepStatus: Array<StepStatus> = [
  {
    status: 'completed',
    icon: IconCircleCheckFilled,
    rule: (activeStepIndex, index) => index < activeStepIndex,
  },
  {
    status: 'pending',
    icon: IconCircle,
    rule: (activeStepIndex, index) => index > activeStepIndex,
  },
  {
    status: 'active',
    icon: IconLoader2,
    rule: (activeStepIndex, index) => index === activeStepIndex,
  },
];

const calculateTaskTiming = (tasks: WorkspaceTasks, currentStepId: LoaderStepId) => {
  const currentTask = tasks[currentStepId];

  if (!currentTask) {
    if (Object.keys(tasks).length === 0)
      return {
        startTime: 0,
        endTime: undefined,
      };

    const firstTask = Object.values(tasks)[0];
    return {
      startTime: firstTask.startTime - 2000,
      endTime: firstTask.startTime,
    };
  }

  return {
    startTime: currentTask.startTime,
    endTime: currentTask.endTime,
  };
};

export function WorkspaceLoader() {
  const { workspaceTasks, activeStepId, isWorkspaceReady, installLogs } = useWorkspaceStatus();
  const logsRef = useRef<HTMLPreElement>(null);
  const [loadingTimer, setLoadingTimer] = useState(Date.now() - (workspaceTasks.clone_repo.startTime ?? Date.now()));

  useEffect(() => {
    const el = logsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [installLogs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTimer((prev) => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (isWorkspaceReady) return null;

  return (
    <div className="bg-background flex flex-1 items-center justify-center">
      <div className="bg-card w-full max-w-sm rounded-2xl border p-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <h3 className="text-md-medium">Sandbox</h3>
          <Badge variant={'outline'}>javascript</Badge>
        </div>

        <div className="bg-background rounded-xl p-2">
          <div className="flex flex-col gap-2 p-1">
            {LOADER_STEPS.map((step, index) => {
              const activeStepIndex = LOADER_STEPS.findIndex((s) => s.id === activeStepId);
              const stepStat = stepStatus.find((status) => status.rule(activeStepIndex, index));
              const { startTime, endTime } = calculateTaskTiming(workspaceTasks, step.id);

              if (!stepStat) return null;
              const Icon = stepStat.icon;
              const status = stepStat.status;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'text-foreground flex items-center gap-2 text-sm transition-colors',
                    status === 'pending' && 'text-muted-foreground',
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={status === 'completed' ? 'completed' : 'normal'}
                      initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.7, rotate: 90 }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 10,
                      }}
                      className=""
                    >
                      <Icon
                        className={cn(
                          'size-4 text-green-500',
                          status === 'pending' && 'text-muted-foreground',
                          status === 'active' && 'animate-spin',
                        )}
                        stroke={1.8}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <span className="flex-1">{step.label}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {endTime !== undefined && startTime !== undefined
                      ? `${endTime - startTime}ms`
                      : '...'}
                  </span>
                </div>
              );
            })}
          </div>

          {installLogs && (
            <pre
              ref={logsRef}
              className="text-muted-foreground no-scrollbar bg-card mt-2 max-h-32 overflow-y-auto rounded-lg p-2 font-mono text-xs whitespace-pre-wrap transition-[height]"
            >
              {installLogs}
            </pre>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className="text-muted-foreground font-mono text-xs">{(loadingTimer / 1000).toFixed(1)}s</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Executing</span>{' '}
            <DotmSquare7 size={20} dotSize={2.5} opacityPeak={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
