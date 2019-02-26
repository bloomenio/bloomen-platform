const fs = require('fs');
/**
 * Documentation
 * https://www.npmjs.com/package/express-swagger-generator
 */

const swagger = app => {
  const package = fs.readFileSync('package.json');
  const VERSION = JSON.parse(package.toString()).version.toString();
  console.log(VERSION);

  const expressSwagger = require('express-swagger-generator')(app);
  const options = {
    swaggerDefinition: {
      info: {
        description: 'The Bloomen Platform documentation',
        title: 'Bloomen Platform',
        version: VERSION
      },
      host: process.env.SWAGGER_BASE_URL,
      basePath: '/',
      produces: ['application/json'],
      schemes: [process.env.SWAGGER_SCHEME],
      securityDefinitions: {
        JWT: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description:
            'Publisher:\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InJvbGUiOiJwdWJsaXNoZXIiLCJyZXB1dGF0aW9uIjp7InBvc2l0aXZlIjowLCJuZWdhdGl2ZSI6MH0sInNldHRpbmdzIjp7ImF0dHJpYnV0aW9uIjp0cnVlfSwia3ljIjp7ImFkZHJlc3MiOiIiLCJwaG9uZSI6IiIsImZpcnN0bmFtZSI6IiIsImxhc3RuYW1lIjoiIiwiaWQxIjoiIiwiaWQyIjoiIiwic3RhdHVzIjowLCJyZXZpZXdlZEJ5IjoiIn0sIl9pZCI6IjViYjQ5MDI5NGRkN2ExMmNhYzQxYTU3NSIsInVzZXJuYW1lIjoicHVibGlzaGVyIiwiaGFzaCI6IjUyYWRlZDE2NTM2MDM1MmEwZjU4NTc1NzFkOTZkNjhmIiwiZW1haWwiOiJwdWJsaXNoZXJAYXRjLmdyIiwib3JnYW5pc2F0aW9uIjoiQVRDIiwiY3JlYXRlZEF0VVRDIjoiMjAxOC0xMC0wM1QwOTo0NzoyMS4zMDlaIiwiX192IjowLCJvcmciOm51bGwsImlkIjoiNWJiNDkwMjk0ZGQ3YTEyY2FjNDFhNTc1In0sImlhdCI6MTU1MDU4MTk0Nn0.jxCWK2avRtvmuh0rdeg8z0iu1sG4JaBfkI_gZDNx1Co' +
            '\nPhotographer:\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InJvbGUiOiJwaG90b2dyYXBoZXIiLCJyZXB1dGF0aW9uIjp7InBvc2l0aXZlIjo3LCJuZWdhdGl2ZSI6MH0sInNldHRpbmdzIjp7ImF0dHJpYnV0aW9uIjp0cnVlfSwia3ljIjp7ImFkZHJlc3MiOiIiLCJwaG9uZSI6IiIsImZpcnN0bmFtZSI6IiIsImxhc3RuYW1lIjoiIiwiaWQxIjoiIiwiaWQyIjoiIiwic3RhdHVzIjowLCJyZXZpZXdlZEJ5IjoiIn0sIl9pZCI6IjViYjM1ZmE2ZWIwNDMxMWE1YzYwNjA0MCIsInVzZXJuYW1lIjoicGhvdG9ncmFwaGVyIiwiaGFzaCI6ImFiNWIwMzgxN2NhYTAxYzRhMmEwZWFkY2ZlNjQ4NjljIiwiZW1haWwiOiJwaG90b2dyYXBoZXJAdGVzdC5jb20iLCJvcmdhbmlzYXRpb24iOiJwaG90b2dyYXBoZXIiLCJjcmVhdGVkQXRVVEMiOiIyMDE4LTEwLTAyVDEyOjA4OjA2LjEyMloiLCJfX3YiOjB9LCJpYXQiOjE1NTA1MDM2NTR9.LThaEsPkrDkvlvKMw276PHlEsl430yNDAPATFi9sNw8'
        }
      },
      security: {
        JWT: []
      }
    },
    basedir: __dirname,
    files: ['../controllers/*.js', '../models/*.js', './swagger.js']
  };
  expressSwagger(options);
};

/* ------ TYPE DEFINITIONS - DTO ------ */

/**
 * @typedef LoginDTO
 * @property {string} username.required - Username
 * @property {string} password.required - Password
 */

/**
 * @typedef RegisterDTO
 * @property {string} username.required - Username
 * @property {string} password.required - Password
 * @property {string} email.required - Email
 * @property {string} invitation - Optional - invitation ID, only for publishers
 */

/**
 * @typedef ForgotDTO
 * @property {string} email.required - Email
 */

/**
 * @typedef JwtDTO
 * @property {string} token - JWT token
 */

/**
 * @typedef MessageDTO
 * @property {string} message.required - Message
 */

/**
 * @typedef InvitationDTO
 * @property {string} email.required - Email
 */

/**
 * @typedef ChangePasswordDTO
 * @property {string} oldPassword.required - User's old password
 * @property {string} newPassword.required - User's new password
 */

/**
 * @typedef UpdateUserDTO
 * @property {string} email - User's updated email
 * @property {object} settings - User's updated settings
 * @property {string} organisation - User's updated organisation
 */

/**
 * @typedef OrganisationDTO
 * @property {string} name.required - Organisation name
 * @property {string} hash.required - Organisation hash
 * @property {object} walletAddress.required - Wallet address of the organisation
 * @property {string} balance.required - Wallet balance
 */

/**
 * @typedef UpdatePhotoDTO
 * @property {string} description - Description
 * @property {Array<string>} keywords - Keywords, default: []
 * @property {string} type - Resource type, default 'photo'
 * @property {number} type - Resource price, default 0
 * @property {string} rightsTime - Rights time
 * @property {string} rightsRegion - Rights region
 * @property {object} geo - Geo coordinates
 */

/**
 * @typedef UploadhotoDTO
 * @property {string} base64 - Base64 data of image
 * @property {number} price - Price to purchase rights
 * @property {boolean} attribution - Should the publisher mention the photographer on usage?
 * @property {string} description - Description
 * @property {Array<string>} keywords - Keywords, default: []
 * @property {string} type - Resource type, default 'photo'
 * @property {number} type - Resource price, default 0
 * @property {string} rightsTime - Rights time
 * @property {string} rightsRegion - Rights region
 * @property {object} geo - Geo coordinates
 */

/**
 * @typedef SearchPhotoDTO
 * @property {string} term.required - Term to search
 */

/**
 * @typedef KYCRequestDTO
 * @property {string} address - Address
 * @property {string} phone - Phone number
 * @property {string} firstname - Firstname
 * @property {string} lastname - Lastname
 * @property {string} id1 - ID - front side
 * @property {string} id2 - ID - back side
 */

/**
 * @typedef KYCApprovalDTO
 * @property {boolean} approve - KYC approved
 */

/**
 * @typedef VoteDTO
 * @property {number} vote - Vote (+1 or -1)
 */

module.exports = swagger;
