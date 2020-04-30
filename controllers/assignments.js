const express = require("express");
const router = express.Router();
const Assignment = require("../models/assignment");
const invitation = require("../middlewares/invitation");
const mailer = require("../helpers/mailer");
require("dotenv").config();
const PAGE_SIZE = 10;

/**
 * Get all assignments of my organisation
 * @route GET /assignments
 * @group assignment - Assignments for photographers
 * @returns {Array<Assignment>} 200 - An array of created assignments
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/", invitation.read, getAssignments);

/**
 * Assign task to photographer
 * @route POST /assignments
 * @group assignment - Assignments for photographers
 * @param {AssignmentDTO.model} data.body.required - Assignment info
 * @returns {Assignment.model} 200 - New assignment
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/", invitation.create, sendAssignment);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getAssignments(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Assignment.find({
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

function sendAssignment(req, res, next) {
  let assignment = new Assignment();
  assignment.organisation = req.user.organisation;
  assignment.photographer = req.body.photographer;
  assignment.status = "Not uploaded";
  assignment.emailBody = req.body.emailBody;
  assignment.hashtag = req.body.hashtag;
  assignment.assignedBy = req.user;
  assignment.createdAtUTC = new Date();

  assignment
    .save()
    .then(assign => {
      let text =
        "Assignment by " + req.user.organisation + "\n\n" + req.body.emailBody;

      return mailer.sendEmail(
        photographer.email,
        "You have an new Bloomen Photo assignment",
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
