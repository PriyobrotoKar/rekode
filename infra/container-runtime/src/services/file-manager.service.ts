import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { ROOT_DIR } from '../lib/constants';

export class FileManager {
  constructor() {}

  async getAllFiles(dir: string) {
    try {
      const files = await readdir(join(process.cwd(), ROOT_DIR, dir), {
        withFileTypes: true,
      });

      return files.map((file) => {
        const root = ROOT_DIR.replaceAll('.', '');
        const fullPath = file.parentPath + file.name + (file.isDirectory() ? '/' : '');
        const normalizedPath = fullPath.replace(`${root}/`, '');
        return normalizedPath;
      });
    } catch (error) {
      console.error(error);
    }
  }

  async getFile(path: string) {
    try {
      const content = await readFile(join(process.cwd(), ROOT_DIR, path), 'utf8');
      return content;
    } catch (error) {
      console.error(error);
    }
  }

  async writeFile(path: string, content: string) {
    try {
      await writeFile(join(process.cwd(), ROOT_DIR, path), content, 'utf8');
    } catch (error) {
      console.error(error);
    }
  }
}
