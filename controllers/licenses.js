const express = require('express');
const License = require('../models/license');
const router = express.Router();
require('dotenv').config();

/**
 * register new license
 */
router.get('/', getLicenses);
router.post('/', createLicense);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getLicenses(req, res, next) {
  License.find({})
    .then(licenses => {
      res.send(licenses);
    })
    .catch(next);
}

function createLicense(req, res, next) {
  const license = new License(req.body);
  license
    .save()
    .then(license => {
      res.send(license);
    })
    .catch(next);
}
module.exports = router;
