const fs = require("fs");
/**
 * Documentation
 * https://www.npmjs.com/package/express-swagger-generator
 */

const swagger = app => {
  const package = fs.readFileSync("package.json");
  const VERSION = JSON.parse(package.toString()).version.toString();
  console.log(VERSION);

  const expressSwagger = require("express-swagger-generator")(app);
  const options = {
    swaggerDefinition: {
      info: {
        description: "The Bloomen Platform documentation",
        title: "Bloomen Platform",
        version: VERSION
      },
      host: process.env.SWAGGER_BASE_URL,
      basePath: "/",
      produces: ["application/json"],
      schemes: [process.env.SWAGGER_SCHEME],
      securityDefinitions: {
        JWT: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description:
            "Publisher:\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InJvbGUiOlsicHVibGlzaGVyIiwiYWRtaW4iXSwicmVwdXRhdGlvbiI6eyJwb3NpdGl2ZSI6MCwibmVnYXRpdmUiOjB9LCJzZXR0aW5ncyI6eyJhdHRyaWJ1dGlvbiI6dHJ1ZX0sImt5YyI6eyJhZGRyZXNzIjoiIiwicGhvbmUiOiIiLCJmaXJzdG5hbWUiOiIiLCJsYXN0bmFtZSI6IiIsImlkMSI6IiIsImlkMiI6IiIsInN0YXR1cyI6MCwicmV2aWV3ZWRCeSI6IiJ9LCJfaWQiOiI1YjZjM2M5MDljOGU3NTBhYjRjN2YxMWYiLCJ1c2VybmFtZSI6InB1Ymxpc2hlciIsImhhc2giOiI1MmFkZWQxNjUzNjAzNTJhMGY1ODU3NTcxZDk2ZDY4ZiIsImVtYWlsIjoicHVibGlzaGVyQGNvbXBhbnkuZ3IiLCJvcmdhbmlzYXRpb24iOiJBVEMiLCJjcmVhdGVkQXRVVEMiOiIyMDE4LTA4LTA5VDEzOjA3OjI4LjA5NloiLCJfX3YiOjAsIm9yZyI6bnVsbCwiaWQiOiI1YjZjM2M5MDljOGU3NTBhYjRjN2YxMWYifSwiaWF0IjoxNTY3NjAyODEyfQ.jEDLx6KK2LBVpBjzHNB7mIX-mLQy_fXgwV0hG2agfnU" +
            "\nPhotographer:\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InJvbGUiOlsicGhvdG9ncmFwaGVyIl0sInJlcHV0YXRpb24iOnsicG9zaXRpdmUiOjM4LCJuZWdhdGl2ZSI6OH0sInNldHRpbmdzIjp7ImF0dHJpYnV0aW9uIjp0cnVlfSwia3ljIjp7ImFkZHJlc3MiOiJSaXphcmVpb3UgMTAiLCJwaG9uZSI6IjY5MTIzNDU2NzgiLCJmaXJzdG5hbWUiOiJIYXJpcyIsImxhc3RuYW1lIjoiQm91Y2hsaXMiLCJpZDEiOiJodHRwczovL2Jsb29tZW4uczMuZXUtY2VudHJhbC0xLmFtYXpvbmF3cy5jb20vMDczNmRlMzMwNzM4Y2VhZGU4NjA1Y2JkZTI0YmRjOWMiLCJpZDIiOiJodHRwczovL2Jsb29tZW4uczMuZXUtY2VudHJhbC0xLmFtYXpvbmF3cy5jb20vODBjMDRjMmQ4ZjQ1NjcxNjQwNzc2ZWE1NWQ0MWQyNjMiLCJzdGF0dXMiOjMsInJldmlld2RCeSI6ImdpYW5uYS1wdWIifSwiX2lkIjoiNWI3NmMxMTYyMmRmZTIyMjY4NGJiZDNjIiwidXNlcm5hbWUiOiJwaG90b2dyYXBoZXIiLCJoYXNoIjoiYWI1YjAzODE3Y2FhMDFjNGEyYTBlYWRjZmU2NDg2OWMiLCJlbWFpbCI6InguYm91Y2hsaXNAYXRjLmdyIiwib3JnYW5pc2F0aW9uIjoicGhvdG9ncmFwaGVyIiwiY3JlYXRlZEF0VVRDIjoiMjAxOC0wOC0xN1QxMjozNTozNC4zMzVaIiwiX192IjowLCJvcmciOm51bGwsImlkIjoiNWI3NmMxMTYyMmRmZTIyMjY4NGJiZDNjIn0sImlhdCI6MTU2NzYwMjc0M30.lOgqKkOrfyVyDsccHvLCoNY0yl7UKXXhsd7PrsG-q4E"
        }
      },
      security: {
        JWT: []
      }
    },
    basedir: __dirname,
    files: ["../controllers/*.js", "../models/*.js", "./swagger.js"]
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
 * @property {string} mnemonic - Optional - mnemonic wallet to link with account
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
 * @typedef UploadPhotoDTO
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
 * @typedef MassUploadPhotoDTO
 * @property {Array<string>} photos - Array of Base64 data of images
 */

/**
 * @typedef SearchPhotoDTO
 * @property {string} term.required - Term to search
 */

/**
 * @typedef SearchSoundDTO
 * @property {string} term.required - Term to search
 * @property {string} group.required - Group to search in
 */

/**
 * @typedef BulkInsertSoundDTO
 * @property {Array<object>} data.required - Term to search
 */

/**
 * @typedef SendTokensDTO
 * @property {string} amount.required - Amount to send
 * @property {string} to.required - Wallet address to send the tokens to
 */

/**
 * @typedef MnemonicDTO
 * @property {string} mnemonic.required - Mnemonic string
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
