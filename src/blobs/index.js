const generateMSSignupBlob = require("./ms-signup");
const generateRobloxSignupBlob = require("./roblox");
const generateXSignupBlob = require("./x-signup");
const generateXSignupAndroidAppBlob = require("./x-signup-android-app");
const generateXUnsusBlob = require("./x-unsus");

module.exports = {
  generateXSignupBlob,
  generateXSignupAndroidAppBlob,
  generateXUnsusBlob,
  generateMSSignupBlob,
  generateRobloxSignupBlob
}