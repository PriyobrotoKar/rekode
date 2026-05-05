import config from '@rekode/eslint-config/nest-js';
import reactConfig from '@rekode/eslint-config/react-internal';
import pluginReact from 'eslint-plugin-react';

const __dirname = process.cwd();

export default [
  ...config,
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
];
