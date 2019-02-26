var rimraf = require("rimraf");
rimraf("./build", function() {
  console.log("./build folder deleted.");
});
