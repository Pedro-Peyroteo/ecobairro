import config from '../../packages/eslint-config/react.mjs';

export default [
  ...config,
  {
    ignores: [
      'dist/**',
      '.nitro/**',
      '.output/**',
      '.tanstack/**',
      'src/routeTree.gen.ts',
      'src/@layouts/**',
      'src/mocks/**',
    ],
  },
];
