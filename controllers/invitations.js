const express = require('express');
const router = express.Router();
const Invitation = require('../models/invitation');
const mailer = require('../helpers/mailer');
require('dotenv').config();
const PAGE_SIZE = 10;

/**
 * Get all invitations of my organisation
 * @route GET /invitations
 * @group invitation - Invitations for publishers
 * @returns {Array<Invitation>} 200 - An array of sent invitations
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/', getInvitations);

/**
 * Invite new user to my organisation
 * @route POST /invitations
 * @group invitation - Invitations for publishers
 * @param {InvitationDTO.model} data.body.required - Invitation info
 * @returns {Invitation.model} 200 - New invitation
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post('/', sendInvitation);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getInvitations(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Invitation.find({
    organisation: req.user.organisation,
    createdAtUTC: { $lt: before }
  })
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

function sendInvitation(req, res, next) {
  let invitation = new Invitation();
  invitation.organisation = req.user.organisation;
  invitation.email = req.body.email;
  invitation.accepted = false;
  invitation.user = null;
  invitation.invitedBy = req.user;
  invitation.createdAtUTC = new Date();

  invitation
    .save()
    .then(inv => {
      let url =
        process.env.BLOOMEN_URL_FRONT +
        'pages/auth/register?invitation=' +
        inv.id;
      let text =
        'You have and invitation to join ' +
        req.user.organisation +
        ' in the Bloomen platform. \nTo become a member follow this link ' +
        url;

      return mailer.sendEmail(
        req.body.email,
        'You have and invitation to join Bloomen',
        text,
        text
      );
    })
    .then(mail_response => {
      res.send(mail_response);
    })
    .catch(next);
}

module.exports = router;
