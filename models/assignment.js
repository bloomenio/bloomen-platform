const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

const assignmentSchema = new Schema(
  {
    organisation: { type: String },
    emailBody: { type: String},
    status: { type: String },
    photographer: { type: Object },
    assignedBy: { type: Object },
    createdAtUTC: { type: Date }
  },
  { minimize: false }
);

db.errorHandler(assignmentSchema);

/**
 * @typedef Assignment
 * @property {string} organisation.required - Organisation name where the user is invited in
 * @property {string} email.required - User email where invitation is sent
 * @property {boolean} accepted.required - User accepted the invitation, default: false
 * @property {User.model} user - User object, gets filled after user accepts invitation
 * @property {User.model} invitedBy - User object, the user that sent the invitation
 * @property {string} createdAtUTC - When invitation was sent
 */
const Assignment = mongoose.model(
  "Assignment",
  assignmentSchema,
  "assignments"
);

module.exports = Assignment;
