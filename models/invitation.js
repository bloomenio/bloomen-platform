const mongoose = require('mongoose');
const db = require('../helpers/db');

const Schema = mongoose.Schema;

const invSchema = new Schema(
  {
    organisation: { type: String, required: true },
    email: { type: String, required: true },
    accepted: { type: Boolean, required: true, default: false },
    user: { type: Object },
    invitedBy: { type: Object },
    createdAtUTC: { type: Date }
  },
  { minimize: false }
);

db.errorHandler(invSchema);

/**
 * @typedef Invitation
 * @property {string} organisation.required - Organisation name where the user is invited in
 * @property {string} email.required - User email where invitation is sent
 * @property {boolean} accepted.required - User accepted the invitation, default: false
 * @property {User.model} user - User object, gets filled after user accepts invitation
 * @property {User.model} invitedBy - User object, the user that sent the invitation
 * @property {string} createdAtUTC - When invitation was sent
 */
const Invitation = mongoose.model('Invitation', invSchema, 'invitations');

module.exports = Invitation;
