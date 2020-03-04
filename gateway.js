const logger = require("./logger");
const errors = require("./errors");
const pool = require("./database");
const queryString = require("querystring");
const crypto = require("crypto");

const http = require("http");
const https = require("https");

const config = require("config");
const dbConfig = config.get("dbConfig");
const apiServerConfig = config.get("serverConfig");
const idmServerConfig = config.get("idmServerConfig");
const projectServerConfig = config.get("projectServerConfig");
const idmEndpoints = config.get("idmEndpoints");
const projectEndpoints = config.get("projectEndpoints");

const transactionIDBytes = 16;
exports.verifyAndSend = async function(
  resBuilder,
  serverConfig,
  path,
  { body, headers, query },
  method
) {
  logger.log(`Verify Session`);

  var requestHeaders = {
    "Content-Type": "application/json"
  };

  const options = {
    host: idmServerConfig.host,
    port: idmServerConfig.port,
    path: "/idm/verifySession",
    method: "POST",
    headers: requestHeaders
  };
  var sessionBody = { username: headers.username, sessionID: headers.session };
  logger.log(options);
  logger.log(sessionBody);
  const serviceType = options.port == 443 ? https : http;

  const req = serviceType.request(options, res => {
    res.setEncoding("utf8");
    res.on("data", async function(chunk) {
      if (res.statusCode == 200) {
        logger.log("Session Verified");
        return exports.sendRequest(
          resBuilder,
          serverConfig,
          path,
          { body, headers, query },
          method
        );
      } else {
        logger.log("Invalid Session");
        resBuilder.res.status(res.statusCode);
        logger.log(chunk);
        resBuilder.json = JSON.parse(chunk);
        return resBuilder.end();
      }
    });
  });
  req.on("error", err => {
    logger.log("Error has occurred");
    logger.log(err);
  });

  req.write(JSON.stringify(sessionBody));
  req.end();
};
exports.retrieveResponse = async function(resBuilder, transactionID) {
  var query = `SELECT username,session_id,response,http_status FROM responses WHERE transaction_id=?;
                DELETE FROM responses WHERE transaction_id=?`;
  try {
    const rows = await pool.query(query, [transactionID, transactionID]);
    const response = rows[0][0];
    logger.log(`response (${transactionID.slice(0, 8)}...):`);
    logger.log(response);
    if (response.length == 0) {
      //no response found
      return resBuilder.default(errors.NO_RESPONSE_YET).end();
    }
    if (response.username) {
      resBuilder.res.setHeader("username", response.username);
    }
    if (response.session_id) {
      resBuilder.res.setHeader("session", response.session_id);
    }
    resBuilder.res.status(response.http_status);
    resBuilder.json = JSON.parse(response.response);
    return resBuilder.end();
  } catch (err) {
    logger.sqlErr(err);
    return resBuilder.error(err).end();
  }
};
function addResponseToDB(res, transactionID, username, session) {
  res.setEncoding("utf8");
  res.on("data", async function(chunk) {
    logger.log(`Received (${transactionID.slice(0, 8)}...):` + chunk);
    var query = `INSERT INTO responses VALUES(?,?,?,?,?)`;
    try {
      const rows = await pool.query(query, [
        transactionID,
        username,
        session,
        chunk,
        res.statusCode
      ]);
      logger.log(`Response (${transactionID.slice(0, 8)}...) added to DB`);
    } catch (err) {
      logger.sqlErr(err);
    }
  });
}
exports.sendRequest = async function(
  resBuilder,
  serverConfig,
  path,
  { body, headers, query },
  method
) {
  logger.log("Sending request to microservice--" + path);

  const transactionID = generateID();

  const queryURL = "?" + queryString.stringify(query);
  path = queryURL.length <= 1 ? path : path + queryURL;

  var requestHeaders = {
    "Content-Type": "application/json"
  };
  if (typeof headers.username !== "undefined") {
    requestHeaders.username = headers.username;
  }
  if (typeof headers.session !== "undefined") {
    requestHeaders.session = headers.session;
  }

  const options = {
    host: serverConfig.host,
    port: serverConfig.port,
    path: path,
    method: method,
    headers: requestHeaders
  };
  logger.log(options);
  logger.log(body);
  const serviceType = options.port == 443 ? https : http;

  const req = serviceType.request(options, res => {
    addResponseToDB(res, transactionID, headers.username, headers.session);
  });
  req.on("error", err => {
    logger.log("Error has occurred");
    logger.log(err);
  });

  req.write(JSON.stringify(body));
  req.end();
  resBuilder.json["transaction_id"] = transactionID;
  resBuilder.json["requestDelay"] = apiServerConfig.requestDelay;
  logger.log("TransactionID:" + transactionID);
  logger.log(`Request (${transactionID.slice(0, 8)}...) sent`);
  resBuilder.success().end();
};

function generateID() {
  return crypto.randomBytes(transactionIDBytes).toString("hex");
}
