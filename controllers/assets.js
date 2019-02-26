const express = require('express');
const aws = require('../helpers/aws');
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
router.get('/host/:hash', getFile);

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
  aws.getFileUrl(key).then(function(url) {
    // TODO: add tracking code
    res.redirect(url);
  });
}

function getFileWatermark(req, res, next) {
  const key = req.params.hash;

  aws
    .getFileUrl(key)
    .then(function(url) {
      // TODO: add tracking code
      return $request(url);
    })
    .then(({ response, buffer }) => {
      const d = sizeOf(buffer);

      return sharp(buffer)
        .overlayWith(watermark(d), { gravity: sharp.gravity.center })
        .toBuffer();
    })
    .then(buffer => {
      res.contentType('image/png');
      res.end(buffer, 'binary');
    })
    .catch(next);
}

function watermark({ width, height }) {
  const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
  const cos = width / hypotenuse;
  const angle = (Math.acos(cos) * 180) / Math.PI;
  const font_size = Math.floor((height + width) / 30);
  console.log('FONT SIZE', font_size);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">   
      <defs>  
        <style type="text/css">
          <![CDATA[
            @font-face {
              font-family: 'Open Sans';
              src: url('https://fonts.googleapis.com/css?family=Open+Sans');
            }
          ]]>
        </style>
      </defs>
      <text 
        fill-opacity="0.5" 
        font-size="${font_size}" 
        font-family="Open Sans"
        x="0" 
        y="0" 
        alignment-baseline="middle" 
        text-anchor="middle" 
        fill="lightblue" 
        font-weight="bold" 
        transform="translate(100, 100) rotate(${angle} 60 60)">
          bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io bloomen.io
      </text>
    </svg>`
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
