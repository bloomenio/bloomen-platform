const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

const musicSchema = new Schema(
  {
    ISWC: {
      type: "String"
    },
    originalTitle: {
      type: "String"
    },
    creators: {
      type: ["Mixed"]
    },
    alternativeTitles: {
      type: ["String"]
    },
    associatedPerformers: {
      type: ["String"]
    },
    associatedISRCs: {
      type: ["String"]
    },
    group: {
      type: "String"
    }
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(musicSchema);

musicSchema.virtual("versions", {
  ref: "Version",
  localField: "_id",
  foreignField: "objectId",
  justOne: false // for many-to-1 relationships
});

/**
 * @typedef Music
 * @property {string} ISWC - ISWC code
 * @property {string} originalTitle - Description of the music resource
 * @property {Array.<object>} creators - Music track creators
 * @property {Array.<string>} alternativeTitles - Other titles of the track
 * @property {Array.<string>} associatedPerformers - Performers associated with the track
 * @property {Array.<string>} associatedISRCs - Associated ISRC codes
 * @property {string} group - Music track collection
 */
const Music = mongoose.model("Music", musicSchema, "music");

module.exports = Music;
