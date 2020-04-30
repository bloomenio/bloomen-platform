const mongoose = require('mongoose');
const db = require('../helpers/db');

const Schema = mongoose.Schema;

const licenseSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true }
  },
  { minimize: false }
);

db.errorHandler(licenseSchema);

const License = mongoose.model('License', licenseSchema, 'licenses');

module.exports = License;
