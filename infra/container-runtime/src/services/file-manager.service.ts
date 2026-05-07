import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const ROOT_DIR = '/workspace';

export class FileManager {
  async getAllFiles() {
    try {
      const files = await readdir(join(process.cwd(), '..', ROOT_DIR), {
        recursive: true,
        withFileTypes: true,
      });
      console.log(files);
      return files
        .filter((file) => file.isFile())
        .map((file) => {
          const fullPath = file.parentPath + '/' + file.name;
          const normalizedPath = fullPath.replace(`${ROOT_DIR}/`, '');
          return normalizedPath;
        });
    } catch (error) {
      console.error(error);
    }
  }

  async getFile(path: string) {
    try {
      const content = await readFile(join(process.cwd(), '..', ROOT_DIR, path), 'utf8');
      return content;
    } catch (error) {
      console.error(error);
    }
  }
}
