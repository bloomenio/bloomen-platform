const Version = require('../models/version');

function saveVersion(id, type, value) {
  var version = new Version();
  version.objectId = id;
  version.type = type;
  version.value = value;
  version.modifiedAtUTC = new Date();
  return version.save();
}

function retrieveVersions(id) {
  return Version.find({ objectId: id });
  // todo -> convert json to array of models
}

module.exports = {
  saveVersion: saveVersion,
  retrieveVersions: retrieveVersions
};
