module.exports = {
  env: {
    browser: true,  // For browser-based code
    node: true,     // For Node.js-based code
    es2021: true    // Use modern JavaScript features
  },
  extends: [
    'eslint:recommended', // Use recommended rules by ESLint
    'plugin:node/recommended' // Add rules specific to Node.js (optional)
  ],
  parserOptions: {
    ecmaVersion: 12, // Support ES2021 features
    sourceType: 'module' // Use ES Modules (import/export)
  },
  rules: {
    'semi': ['error', 'always'],          // Enforce semicolons
    'quotes': ['error', 'single'],       // Enforce single quotes
    'no-console': 'off',                 // Allow console.log (turn off this rule)
    'indent': ['error', 2],              // Enforce 2-space indentation
    'linebreak-style': ['error', 'unix'] // Enforce Unix line endings
  }
};

