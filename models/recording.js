const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

const recordingSchema = new Schema(
  {
    ISRC: {
      type: "String"
    },
    mainArtist: {
      type: "String"
    },
    featuredArtists: {
      type: ["String"]
    },
    title: {
      type: "String"
    },
    versionTitle: {
      type: "Mixed"
    },
    duration: {
      type: "Number"
    },
    yearOfRecording: {
      type: "Number"
    },
    territoryOfRecording: {
      type: "String"
    },
    languageOfPerformance: {
      type: "Mixed"
    },
    originalReleaseDate: {
      type: "Date"
    },
    originalReleaseLabel: {
      type: "String"
    },
    creators: {
      type: ["String"]
    },
    isVideo: {
      type: "Boolean"
    },
    releases: {
      type: ["Mixed"]
    },
    group: {
      type: "String"
    }
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(recordingSchema);

recordingSchema.virtual("versions", {
  ref: "Version",
  localField: "_id",
  foreignField: "objectId",
  justOne: false // for many-to-1 relationships
});

/**
 * @typedef Recording
 * @property {string} ISRC - ISRC code
 * @property {string} mainArtist - Main artist
 * @property {Array.<string>} featuredArtists - List of featured artists
 * @property {string} title - Recording title
 * @property {number} duration - Duration of recording
 * @property {number} yearOfRecording - Year of the recording
 * @property {string} territoryOfRecording - Territory of the recording
 * @property {object} languageOfPerformance - Language of the recording
 * @property {string} originalReleaseDate - Original release date of the recording
 * @property {string} originalReleaseLabel - Original release label of the recording
 * @property {Array.<string>} creators - Creators of the recording
 * @property {boolean} isVideo - Is the recording a video?
 * @property {Array.<object>} releases - Territory of the recording
 * @property {string} group - Sound recording collection
 */
const Recording = mongoose.model("Recording", recordingSchema, "recording");

module.exports = Recording;
