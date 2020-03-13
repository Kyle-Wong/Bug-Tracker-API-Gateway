const express = require("express");
const cors = require("cors");
const util = require("util");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

const fs = require("fs");
const logger = require("./logger");
const ResponseBuilder = require("./response-builder");

const config = require("config");
const dbConfig = config.get("dbConfig");
logger.log(dbConfig);
const serverConfig = config.get("serverConfig");
logger.log(serverConfig);
const idmServerConfig = config.get("idmServerConfig");
logger.log(idmServerConfig);
const projectServerConfig = config.get("projectServerConfig");
logger.log(projectServerConfig);
const idmEndpoints = config.get("idmEndpoints");
logger.log(idmEndpoints);
const projectEndpoints = config.get("projectEndpoints");
logger.log(projectEndpoints);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const gateway = require("./gateway");
const errors = require("./errors");

app.get("/", function(req, res) {});

var server = app.listen(serverConfig.port, function() {
  var host = server.address().address;
  var port = server.address().port;
  logger.log(`Server listening at ${host}:${port}`);
});
/*
"idmEndpoints":{
  "register":"/idm/user/register",
  "login":"/idm/user/login",
  "verifySession":"/idm/verifySession",
  "verifyPrivilege":"/idm/verifyPrivilege"
},
"projectEndpoints":{
  "addUser":"/prjt/user/add",
  "addProject":"/prjt/project/add",
  "deleteProject":"/prjt/project/delete",
  "getProjectList":"/prjt/prject/getAll",
  "getTagList":"/prjt/tag/getAll",
  "addTag":"/prjt/tag/add",
  "removeTag":"/prjt/tag/remove",
  "addBug":"/prjt/bug/add",
  "deleteBug":"/prjt/bug/delete",
  "resolveBug":"/prjt/bug/resolve",
  "assignBug":"/prjt/bug/assign",
  "unassignBug":"/prjt/bug/unassign",
  "getBugs":"/prjt/bug/get",
  "getInviteList":"/prjt/invite/getAll",
  "sendInvite":"/prjt/invite/send",
  "resolveInvite":"/prjt/invite/resolve"
}
*/
app.get("/report", async function(req, res) {
  logger.log(`Checking for response:${req.headers.transaction_id}`);
  var resBuilder = new ResponseBuilder(res);
  const transactionID = req.headers.transaction_id;
  gateway.retrieveResponse(resBuilder, transactionID);
});
//IDM
app.post(idmEndpoints.register, async function(req, res) {
  const template = {
    username: "string",
    email: "string",
    password: "string"
  };
  logger.log("Register User");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }

  gateway.sendRequest(
    resBuilder,
    idmServerConfig,
    idmEndpoints.register,
    req,
    "POST"
  );
});

app.post(idmEndpoints.login, async function(req, res) {
  const template = {
    username: "string",
    password: "string"
  };
  logger.log("Login User");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }

  gateway.sendRequest(
    resBuilder,
    idmServerConfig,
    idmEndpoints.login,
    req,
    "POST"
  );
});
app.post(idmEndpoints.verifySession, async function(req, res) {
  const template = {
    username: "string",
    sessionID: "string"
  };
  logger.log("Verify Session");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }

  gateway.sendRequest(
    resBuilder,
    idmServerConfig,
    idmEndpoints.verifySession,
    req,
    "POST"
  );
});
app.post(idmEndpoints.verifyPrivilege, async function(req, res) {
  const template = {
    username: "string",
    requiredPrivilege: "number"
  };
  logger.log("Verify Privilege");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }

  gateway.sendRequest(
    resBuilder,
    idmServerConfig,
    idmEndpoints.verifyPrivilege,
    req,
    "POST"
  );
});
//Project
app.post(projectEndpoints.addProject, async function(req, res) {
  const template = {
    project_name: "string",
    body: "string"
  };
  logger.log("Add Project");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(
    resBuilder,
    projectServerConfig,
    projectEndpoints.addProject,
    req,
    "POST"
  );
});
app.post(projectEndpoints.deleteProject, async function(req, res) {
  const template = {
    project_id: "number"
  };
  logger.log("Delete Project");
  const path = projectEndpoints.deleteProject;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.get(projectEndpoints.getProjectList, async function(req, res) {
  logger.log("Get Project List");
  const path = projectEndpoints.getProjectList;
  var resBuilder = new ResponseBuilder(res);
  const headers = req.headers;
  logger.log(headers);
  var err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "GET");
});
app.get(projectEndpoints.getProject, async function(req, res) {
  logger.log("Get Project");
  const path = projectEndpoints.getProject.replace(
    ":projectID",
    req.params.projectID
  );
  var resBuilder = new ResponseBuilder(res);
  const headers = req.headers;
  logger.log(headers);
  var err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }
  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "GET");
});
app.get(projectEndpoints.getTagList, async function(req, res) {
  logger.log("Get Tag List");
  const path = projectEndpoints.getTagList;
  var resBuilder = new ResponseBuilder(res);
  const headers = req.headers;
  logger.log(headers);
  var err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "GET");
});
app.post(projectEndpoints.addTag, async function(req, res) {
  const template = {
    tag_name: "string"
  };
  logger.log("add Tag");
  const path = projectEndpoints.addTag;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.removeTag, async function(req, res) {
  const template = {
    project_id: "number",
    bug_id: "number",
    tag_names: "object"
  };
  logger.log("Remove Tags");
  const path = projectEndpoints.removeTag;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.addBug, async function(req, res) {
  const template = {
    project_id: "number",
    body: "string",
    priority: "number",
    tags: "object"
  };
  logger.log("Adding Bug");
  const path = projectEndpoints.addBug;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.deleteBug, async function(req, res) {
  const template = {
    project_id: "number",
    bug_id: "number"
  };
  logger.log("Delete Bug");
  const path = projectEndpoints.deleteBug;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.resolveBug, async function(req, res) {
  const template = {
    project_id: "number",
    bug_id: "number"
  };
  logger.log("ResolveBug");
  const path = projectEndpoints.resolveBug;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.assignBug, async function(req, res) {
  const template = {
    project_id: "number",
    bug_id: "number"
  };
  logger.log("Assign Bug");
  const path = projectEndpoints.assignBug;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.unassignBug, async function(req, res) {
  const template = {
    project_id: "number",
    bug_id: "number"
  };
  logger.log("Unassign Bug");
  const path = projectEndpoints.unassignBug;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.getBugs, async function(req, res) {
  const template = {
    project_id: "number"
  };
  logger.log("Get Bugs");
  const path = projectEndpoints.getBugs;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.get(projectEndpoints.getInviteList, async function(req, res) {
  logger.log("Get Invitation List");
  const path = projectEndpoints.getInviteList;
  var resBuilder = new ResponseBuilder(res);
  const headers = req.headers;
  logger.log(headers);

  var err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "GET");
});
app.post(projectEndpoints.sendInvite, async function(req, res) {
  const template = {
    project_id: "number",
    invited: "string",
    access_level: "number"
  };
  logger.log("Invite User to Project");
  const path = projectEndpoints.sendInvite;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
app.post(projectEndpoints.resolveInvite, async function(req, res) {
  const template = {
    project_id: "number"
  };
  logger.log("Resolve Invite");
  const path = projectEndpoints.resolveInvite;
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  const headers = req.headers;
  logger.log(body);
  logger.log(headers);
  var err = errors.verifyJson(body, template);
  if (err.type != 0) {
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  err = errors.verifyHeader(headers);
  if (err != 0) {
    return resBuilder.default(err).end();
  }

  gateway.verifyAndSend(resBuilder, projectServerConfig, path, req, "POST");
});
