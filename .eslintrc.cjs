module.exports = {
  root: true,
  extends: [
    'sobird/typescript-react.cjs',
    'sobird/typescript.cjs',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
  ],
  plugins: [
    '@next/next',
  ],
  overrides: [],
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'react/prop-types': ['off', {
      ignore: [],
      customValidators: [],
      skipUndeclared: false,
    }],
  },
};
