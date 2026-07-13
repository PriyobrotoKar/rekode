import chokidar, { ChokidarOptions, FSWatcher } from 'chokidar';
import ignore, { Ignore } from 'ignore';
import { readFile } from 'node:fs/promises';
import pathUtils from 'node:path';

import { ROOT_DIR, WATCHER_IGNORED_PATHS } from '../lib/constants';

async function loadGitignoreMatcher(rootDir: string): Promise<Ignore> {
  const matcher = ignore();
  try {
    const contents = await readFile(pathUtils.join(rootDir, '.gitignore'), 'utf-8');
    matcher.add(contents);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to read .gitignore:', err);
    }
  }
  return matcher;
}

type PathHandler = (paths: string[]) => void | Promise<void>;
type WatcherHandlers = {
  onAdd?: PathHandler;
  onChange?: PathHandler;
  onDelete?: PathHandler;
  onAddDir?: PathHandler;
};

export class WatcherService {
  private static instanceOptimized: WatcherService;
  private static instance: WatcherService;
  private readonly watcher: FSWatcher;
  private readonly rootDir: string;
  isPaused: boolean = false;
  watchingDirs: string[] = [];
  private gitignoreMatcher: Ignore | null = null;

  private constructor(rootDir: string, options?: ChokidarOptions) {
    this.rootDir = pathUtils.resolve(rootDir);

    this.watcher = chokidar.watch(this.rootDir, {
      ignoreInitial: true,
      ignored: (rawPath: string) => this.isIgnoredPath(rawPath),
      persistent: true,
      ...options,
    });
  }

  static getInstance(rootDir: string): WatcherService {
    if (!WatcherService.instance) {
      WatcherService.instance = new WatcherService(rootDir);
    }

    return WatcherService.instance;
  }

  static getInstanceOptimized(rootDir: string): WatcherService {
    if (!WatcherService.instanceOptimized) {
      WatcherService.instanceOptimized = new WatcherService(rootDir, { depth: 0 });
    }

    return WatcherService.instanceOptimized;
  }

  private register(event: 'add' | 'change' | 'unlink' | 'addDir', cb: PathHandler): () => void {
    const handler = this.debounce((paths: string[]) => {
      void cb(paths);
    });
    this.watcher.on(event, handler);

    return () => {
      this.watcher.off(event, handler);
    };
  }

  subscribe(handlers: WatcherHandlers): () => void {
    const disposers: Array<() => void> = [];
    if (handlers.onAdd) disposers.push(this.register('add', handlers.onAdd));
    if (handlers.onChange) disposers.push(this.register('change', handlers.onChange));
    if (handlers.onDelete) disposers.push(this.register('unlink', handlers.onDelete));
    if (handlers.onAddDir) disposers.push(this.register('addDir', handlers.onAddDir));

    let disposed = false;

    return () => {
      if (disposed) return;
      disposed = true;
      for (const dispose of disposers) dispose();
    };
  }

  setWatchingDirs(dirs: string[]): void {
    const normalizedDirPaths = dirs.map((dir) => this.normalizeDirPath(dir));

    const prevDirs = this.watchingDirs;
    this.watchingDirs = normalizedDirPaths;

    const dirsAdded = normalizedDirPaths.filter((dir) => !prevDirs.includes(dir));
    const dirsRemoved = prevDirs.filter((dir) => !normalizedDirPaths.includes(dir));

    this.watcher.add(dirsAdded);
    this.watcher.unwatch(dirsRemoved);

    console.log(
      `Watching directories: ${dirsAdded}, Unwatched: ${dirsRemoved}, Final: ${this.watchingDirs}`,
    );
  }

  async loadGitignore(): Promise<void> {
    this.gitignoreMatcher = await loadGitignoreMatcher(this.rootDir);
  }

  dispose(): void {
    this.watcher.close();
  }

  pause(): void {
    this.isPaused = true;
    this.watcher.unwatch(this.rootDir);
  }

  resume(): void {
    this.isPaused = false;
    this.watcher.add(this.rootDir);
  }

  private debounce(cb: (paths: string[]) => void): (path: string) => void {
    let timeout: NodeJS.Timeout;
    const debounceTime = 250;
    const batchedPaths = new Set<string>();

    return (path: string) => {
      if (this.isPaused) return;

      console.log('Event triggered: ', path);
      const normalizedPath = this.normalizePath(path);
      batchedPaths.add(normalizedPath);

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        const paths = Array.from(batchedPaths.values());
        batchedPaths.clear();

        cb(paths);
      }, debounceTime);
    };
  }

  private normalizePath(path: string): string {
    return pathUtils.relative(this.rootDir, path);
  }

  private isIgnoredPath(rawPath: string): boolean {
    const absolutePath = pathUtils.resolve(rawPath);
    const relativePath = pathUtils.relative(this.rootDir, absolutePath).replace(/\\/g, '/');
    const normalizedPath = relativePath.replace(/^\.\//, '');

    const staticMatch = WATCHER_IGNORED_PATHS.some((ignoredPath) => {
      const normalizedIgnoredPath = ignoredPath.replace(/^\.\//, '').replace(/\/+$/, '');
      return (
        normalizedPath === normalizedIgnoredPath ||
        normalizedPath.startsWith(`${normalizedIgnoredPath}/`)
      );
    });

    if (staticMatch) return true;

    if (this.gitignoreMatcher && normalizedPath) {
      try {
        return this.gitignoreMatcher.ignores(normalizedPath);
      } catch {
        return false;
      }
    }

    return false;
  }

  private normalizeDirPath(dir: string): string {
    return `${ROOT_DIR}/${dir}`;
  }

  private isPathWatched(path: string): boolean {
    const isFileInRoot = !path.includes('/');

    if (isFileInRoot) return true;

    const fileDir = pathUtils.dirname(path) + '/';

    return this.watchingDirs.some((dir) => fileDir === dir);
  }
}
