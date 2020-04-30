const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

const mediaSchema = new Schema(
  {
    url: { type: String, unique: true, required: true },
    description: { type: String, default: "" },
    keywords: { type: Array, deafult: [] },
    hash: { type: String, unique: true, required: true },
    type: { type: String, default: "photo" }, // photo, music, video, etc
    license: { type: Schema.Types.ObjectId, ref: "License" },
    price: { type: Number, default: 0 },
    annotations: { type: Array, default: [] },
    attribution: { type: Boolean, default: true }, // publisher gives credit to photographer
    owner: { type: String }, // user hash
    rights: { type: Array, default: [] }, // array of user hashes
    rightsTime: { type: String }, // Usage rights time (how long?)
    rightsRegion: { type: String }, // Usage rights region (where in the world?)
    analytics: { type: Object }, // not sure if this will be updated here, maybe different table for analytics
    geo: { type: Object }, // geocoordinates
    metadata: { type: Object }, // Image metadata
    createdAtUTC: Date
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(mediaSchema);

mediaSchema.virtual("ownerUser", {
  ref: "User",
  localField: "owner",
  foreignField: "hash",
  justOne: true // for many-to-1 relationships
});

mediaSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "hash",
  foreignField: "mediaHash",
  justOne: false // for many-to-1 relationships
});

mediaSchema.virtual("versions", {
  ref: "Version",
  localField: "_id",
  foreignField: "objectId",
  justOne: false // for many-to-1 relationships
});

mediaSchema.virtual("myTransaction", {
  ref: "Transaction",
  localField: "hash",
  foreignField: "mediaHash",
  justOne: true // for many-to-1 relationships
});

/**
 * @typedef Media
 * @property {string} url.required - The media file URL
 * @property {string} description - Description of the media resource
 * @property {Array.<string>} keywords - keywords describing the media resource
 * @property {string} hash.required - Unique hash of the media resource
 * @property {string} type - Description of the resource, default is "photo"
 * @property {integer} price - Price of the media resource, default is 0
 * @property {boolean} attribution - Uploader wants credit for media resource usage
 * @property {string} owner - Hash of media resource owner
 * @property {Array.<string>} rights - Array of user hashes that can use the media resource
 * @property {string} rightsTime - Usage rights time (how long?)
 * @property {string} rightsRegion - Usage rights region (where in the world?)
 * @property {object} analytics - Not sure if this will be updated here, maybe different table for analytics
 * @property {object} geo - Geo coordinates
 * @property {object} metadata - Media metadata (width, height, size, duration, etc)
 * @property {string} createdAtUTC - When media resource was uploaded (type: Date)
 */
const Media = mongoose.model("Media", mediaSchema, "media");

module.exports = Media;
