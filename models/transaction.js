const mongoose = require('mongoose');
const db = require('../helpers/db');

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    hash: { type: String, unique: true, required: true }, // transaction hash
    type: { type: String }, //"upload", "payment"
    mediaHash: { type: String }, // media hash saved in db
    mediaId: { type: Number }, // media id saved in blockchain
    payment: { type: Number, default: 0 }, // amount paid for media rights
    userHash: { type: String }, // user hash that initiated the transaction
    receiverHash: { type: String }, // user hash that received the transaction
    createdAtUTC: Date
  },
  { minimize: false, toObject: { virtuals: true } }
);

db.errorHandler(transactionSchema);

transactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userHash',
  foreignField: 'hash',
  justOne: true // for many-to-1 relationships
});

transactionSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receiverHash',
  foreignField: 'hash',
  justOne: true // for many-to-1 relationships
});

transactionSchema.virtual('media', {
  ref: 'Photo',
  localField: 'mediaHash',
  foreignField: 'hash',
  justOne: true // for many-to-1 relationships
});

/**
 * @typedef Transaction
 * @property {string} hash.required - Transaction hash
 * @property {string} type - Transaction type, "upload" or "payment"
 * @property {string} mediaHash - Hash of the media saved in DB
 * @property {integer} mediaId - Photo id saved in blockchain
 * @property {number} payment - Amount paid for media rights, default: 0
 * @property {string} userHash - User hash that initiated the transaction
 * @property {string} receiverHash - User hash that received the transaction
 * @property {string} createdAtUTC - When transaction was made
 */
const Transaction = mongoose.model(
  'Transaction',
  transactionSchema,
  'transactions'
);

module.exports = Transaction;
