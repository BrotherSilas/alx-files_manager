{
  "env": {
    "browser": true,
    "node": true,
    "es2021": true,
    "mocha": true
  },
  "extends": [
    "eslint:recommended",
    "airbnb-base"
  ],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "no-console": "off",
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "always"
      }
    ]
  }
}
