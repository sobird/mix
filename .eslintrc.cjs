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
      rules: {
        'import/prefer-default-export': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],

};
