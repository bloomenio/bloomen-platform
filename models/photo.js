const mongoose = require('mongoose');
const db = require('../helpers/db');

const Schema = mongoose.Schema;

// hides password, privateKey, kyc
const photoSchema = new Schema(
  {
    url: { type: String, unique: true, required: true },
    description: { type: String, default: '' },
    keywords: { type: Array, deafult: [] },
    hash: { type: String, unique: true, required: true },
    type: { type: String, default: 'photo' }, // UGC, photo, special photo
    price: { type: Number, default: 0 },
    attribution: { type: Boolean, default: true }, // publisher gives credit to photographer
    owner: { type: String }, // user hash
    rights: { type: Array, default: [] }, // array of user hashes
    rightsTime: { type: String }, // Usage rights time (how long?)
    rightsRegion: { type: String }, // Usage rights region (where in the world?)
    analytics: { type: Object }, // not sure if this will be updated here, maybe different table for analytics
    geo: { type: Object }, // geocoordinates
    createdAtUTC: Date
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(photoSchema);

photoSchema.virtual('ownerUser', {
  ref: 'User',
  localField: 'owner',
  foreignField: 'hash',
  justOne: true // for many-to-1 relationships
});

photoSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: 'hash',
  foreignField: 'photoHash',
  justOne: false // for many-to-1 relationships
});

photoSchema.virtual('myTransaction', {
  ref: 'Transaction',
  localField: 'hash',
  foreignField: 'photoHash',
  justOne: true // for many-to-1 relationships
});

/**
 * @typedef Photo
 * @property {string} url.required - The photo URL
 * @property {string} description - Description of the photo
 * @property {Array.<string>} keywords - keywords describing the photo
 * @property {string} hash.required - Unique hash of the photo
 * @property {string} type - Description of the resource, default is "photo"
 * @property {integer} price - Price of the photo, default is 0
 * @property {boolean} attribution - Photographer wants credit for photo usage
 * @property {string} owner - Hash of photo owner
 * @property {Array.<string>} rights - Array of user hashes that can use the photo
 * @property {string} rightsTime - Usage rights time (how long?)
 * @property {string} rightsRegion - Usage rights region (where in the world?)
 * @property {object} analytics - Not sure if this will be updated here, maybe different table for analytics
 * @property {object} geo - Geo coordinates
 * @property {string} createdAtUTC - When photo was uploaded (type: Date)
 */
const Photo = mongoose.model('Photo', photoSchema, 'photos');

module.exports = Photo;
