module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '>=10' // Support Node.js 10 and above
	browsers: ['>0.25%', 'not dead']
      },
      useBuiltIns: 'usage', // Automatically include only the necessary polyfills
      corejs: 3, // Use the latest version of core-js for polyfills
      shippedProposals: true // Include support for modern JavaScript proposals
    }]
  ]
};

