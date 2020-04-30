var rimraf = require('rimraf');
rimraf('./node_modules', function() {
  console.log('./node_modules folder deleted.');
});
