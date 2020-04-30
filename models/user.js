const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

// hides password, privateKey, kyc
const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true },
    hash: { type: String, unique: true, required: true },
    password: { type: String, select: false, required: true },
    email: { type: String, unique: true, required: true },
    role: { type: Array, default: ["photographer"], required: true }, //photographer, publisher
    organisation: { type: String },
    available: { type: Boolean, default: true },
    reputation: {
      type: Object,
      default: { positive: 0, negative: 0 },
      required: true,
    },
    settings: { type: Object, default: { attribution: true }, required: true },
    kyc: {
      type: Object,
      default: {
        address: "",
        phone: "",
        firstname: "",
        lastname: "",
        id1: "",
        id2: "",
        status: 0, // 0: not uploaded, 1: uploaded, 2: declined, 3: approved
        reviewedBy: "", // hash of user that did the last status update (for statuses 2 or 3)
      },
      required: true,
    },
    createdAtUTC: Date,
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(userSchema);

userSchema.virtual("org", {
  ref: "Organisation",
  localField: "organisation",
  foreignField: "name",
  justOne: true, // for 1-to-1 relationships
});

/**
 * @typedef User
 * @property {string} username.required - Username
 * @property {string} hash.required - Unique hash of the user
 * @property {string} password.required - Password
 * @property {string} email - Email
 * @property {Array} role - Role of the user, default: "photographer"
 * @property {string} organisation - User organisation, if user if photographer this is the same as the username
 * @property {reputation.model} reputation - Photographer reputation
 * @property {object} settings - User settings
 * @property {kyc.model} kyc.required - KYC info, for photographers only
 * @property {string} createdAtUTC - When user first registered
 */

/**
 * @typedef reputation
 * @property {integer} positive - Upvotes
 * @property {integer} negative - Downvotes
 */

/**
 * @typedef kyc
 * @property {string} address - Physical address
 * @property {string} phone - Phone number
 * @property {string} firstname - Legal firstname
 * @property {string} lastname - Legal lastname
 * @property {string} id1 - ID photo
 * @property {string} id2 - ID photo
 * @property {string} status - 0: not uploaded, 1: uploaded, 2: declined, 3: approved
 * @property {string} reviewedBy - Hash of user that did the last status update (for statuses 2 or 3)
 */
const User = mongoose.model("User", userSchema, "users");

module.exports = User;
