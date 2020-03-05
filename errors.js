const logger = require("./logger");
const maxUsernameLength = 32;
const minPasswordLength = 6; //inclusive
const maxPasswordLength = 32; //inclusive
const maxEmailLength = 32;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const tokenLength = 32;
const minProjectnameLength = 1;
const maxProjectNameLength = 32;

exports.DONE = 0;
exports.NO_RESPONSE_YET = 201;
exports.ERROR = 400;
exports.INVALID_TYPE = 403;
exports.SESSION_NOT_FOUND = 408;
exports.SESSION_IS_CLOSED = 409;
exports.PROJECT_NOT_FOUND = 410;
exports.INSUFFICIENT_ACCESS = 411;
exports.USER_ALREADY_ASSIGNED = 412;
exports.USER_ALREADY_ACCESSED = 413;
exports.JSON_COUNT_MISMATCH = 414;
exports.JSON_MISSING_PROPERTIES = 415;
exports.MISSING_HEADER_USERNAME = 416;
exports.MISSING_HEADER_SESSION = 417;
exports.errorCode = {
  0: "Done",
  201: "No response yet",

  400: "Error",
  401: "Invalid Length",
  402: "Regex Fail",
  403: "Invalid Type",
  404: "Username already exists",
  405: "Username not found",
  406: "Insufficient Privilege",
  407: "Incorrect Login Credentials",
  408: "Session not found",
  409: "Session is closed",
  410: "Project not found",
  411: "Insufficient Access Level",
  412: "User already assigned to bug",
  413: "User already has access to project",
  414: "Json property count mismatch",
  415: "Json missing properties",
  416: "Missing header-Username",
  417: "Missing header:Session",
  418: "Username-invalid length",
  419: "Password-invalid length",
  420: "Email-invalid length"
};
exports.validUsername = function(username) {
  if (typeof username != "string") return 403;
  if (username.length <= 0 || username.length > maxUsernameLength) return 418;

  return 0;
};
exports.validPassword = function(password) {
  if (typeof password != "string") return 403;
  if (
    password.length < minPasswordLength ||
    password.length > maxPasswordLength
  )
    return 419;

  return 0;
};

exports.validEmail = function(email) {
  if (typeof email != "string") return 403;
  if (email.length <= 0 || email.length > maxEmailLength) return 420;

  if (!emailRegex.test(email)) {
    return 402;
  }
  return 0;
};
exports.validToken = function(token) {
  if (typeof token != "string") return 403;
  if (token.length != tokenLength) return 401;
  return 0;
};
exports.validProjectName = function(projectName) {
  if (typeof projectName != "string") return 403;
  if (
    projectName.length < minProjectnameLength ||
    projectName.length > maxProjectNameLength
  )
    return 401;
  return 0;
};
exports.verifyJson = function(object, template) {
  const properties = Object.keys(template);
  /*
    if(Object.keys(object).length != properties.template){
        return {type:exports.JSON_COUNT_MISMATCH,message:exports.errorCode[exports.JSON_COUNT_MISMATCH]};
    }
    */
  for (var i = 0; i < properties.length; i++) {
    if (typeof object[properties[i]] != template[properties[i]]) {
      return {
        type: exports.INVALID_TYPE,
        message: `${properties[i]}:Got ${typeof object[
          properties[i]
        ]}, expected ${template[properties[i]]}`
      };
    }
  }
  return { type: exports.DONE, message: "" };
};
exports.verifyHeader = function(header) {
  if (typeof header.username === "undefined") {
    return exports.MISSING_HEADER_USERNAME;
  }
  if (typeof header.session === "undefined") {
    return exports.MISSING_HEADER_SESSION;
  }
  return 0;
};
