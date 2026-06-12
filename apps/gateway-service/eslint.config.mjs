import config from '@rekode/eslint-config/base';

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
