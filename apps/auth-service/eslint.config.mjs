import config from '@rekode/eslint-config/nest-js';

const __dirname = process.cwd();

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
];
