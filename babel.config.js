export default {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '>=12',  // Updated to match package.json
        browsers: ['>0.25%', 'not dead']
      },
      useBuiltIns: 'usage',
      corejs: 3,
      shippedProposals: true
    }]
  ]
};
