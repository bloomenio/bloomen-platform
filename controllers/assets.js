const express = require('express');
const aws = require('../helpers/aws');
const hash = require('../helpers/hash');
const Media = require('../models/media');
const request = require('request');
const sharp = require('sharp');
const sizeOf = require('buffer-image-size');
const router = express.Router();

/**
 * returns list of image urls
 */
router.get('/list/:amount*?/:fromKey*?', getFiles);

/**
 * returns the image file
 * to be used as img src
 */
router.get('/host/:hash', getFile); //getFileWatermark);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getFiles(req, res, next) {
  const amount = req.params.amount || 10;

  aws
    .listFileUrls(amount, req.params.fromKey)
    .then(function(response) {
      // TODO: add tracking code
      res.send(response);
    })
    .catch(function(error) {
      console.warn(error);
      res.status(500).send(error);
    });
}

function getFile(req, res, next) {
  const key = req.params.hash;

  aws.getFileUrl(key).then(url => {
    res.redirect(url);
  });
}

function getFileWatermark(req, res, next) {
  const key = req.params.hash;
  let image_url, saved_photo, buffer_image;

  aws
    .getFileUrl(key)
    .then(url => {
      // TODO: add tracking code
      image_url = url;

      return Media.findOne({ hash: key });
    })
    .then(photo => {
      saved_photo = photo;

      return $request(image_url);
    })
    .then(image => {
      buffer_image = image;
      if (req.user) {
        const userHash = hash(req.user.organisation);
        // check if user has rights to file, if not show watermarked version
        if (
          saved_photo.owner === userHash ||
          saved_photo.rights.indexOf(userHash) != -1
        ) {
          return sharp(image.buffer).toBuffer();
        }
      }
      let buffer = buffer_image.buffer;
      const d = sizeOf(buffer);
      return sharp(buffer)
        .overlayWith(watermark(d), {
          gravity: sharp.gravity.center,
          failOnError: false
        })
        .toBuffer();
    })
    .then(data => {
      res.contentType('image/png');
      res.end(data, 'binary');
    })
    .catch(next);
}

function watermark({ width, height }) {
  const _width = Math.floor(Math.max(width, 40));
  const _height = Math.floor(Math.max(width / 2, 20));

  return Buffer.from(
    `<svg style="opacity: 0.4" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="${_width}px" viewBox="0 0 ${width} ${height}" enable-background="new 0 0 ${width} ${height}" xml:space="preserve">  <image id="image0" width="${width}" height="${height}" x="0" y="0"
    xlink:href="data:image/png;base64,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" />
</svg>
`
  );
}

function $request(url) {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, (err, resp, buffer) => {
      // Use the buffer
      // buffer contains the image data
      // typeof buffer === 'object'
      if (err) {
        reject(err);
      } else {
        resolve({ response: resp, buffer: buffer });
      }
    });
  });
}

module.exports = router;
