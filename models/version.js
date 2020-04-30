const mongoose = require('mongoose');
// const db = require('../helpers/db');

const Schema = mongoose.Schema;

const versionSchema = new Schema(
  {
    objectId: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: Object, required: true },
    modifiedAtUTC: { type: Date }
  },
  { minimize: false }
);

// db.errorHandler(versionSchema);

const Version = mongoose.model('Version', versionSchema, 'versions');

module.exports = Version;
