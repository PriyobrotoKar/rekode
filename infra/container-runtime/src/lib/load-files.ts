import { exec } from 'child_process';

export function loadFilesFromRepo(repoUrl: string, targetPath: string = '../workspace') {
  exec(`git clone ${repoUrl} ${targetPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`Git output: ${stderr}`);
    }
    console.log(`Success: ${stdout}`);
  });
}
