module.exports = {
  root: true,
  extends: [
    'sobird/react.cjs',
    'plugin:@next/next/recommended',
  ],
  plugins: [
    '@next/next',
  ],
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      extends: [
        'sobird/typescript-react.cjs',
      ],
    },
  ],
  rules: {
  },
};
