const express = require('express')
const util = require('util');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const app = express();

const fs = require('fs');
const logger = require('./logger');
const ResponseBuilder = require('./response-builder');

const config = require('config');
const dbConfig = config.get('dbConfig');
logger.log(dbConfig);
const serverConfig = config.get('serverConfig');
logger.log(serverConfig);
const idmServerConfig = config.get("idmServerConfig");
logger.log(idmServerConfig);
const projectServerConfig = config.get("projectServerConfig");
logger.log(projectServerConfig);
const idmEndpoints = config.get("idmEndpoints");
logger.log(idmEndpoints);
const projectEndpoints = config.get("projectEndpoints");
logger.log(projectEndpoints);

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const gateway = require("./gateway");
const errors = require("./errors");

app.get('/', function(req, res){
    
})

var server = app.listen(serverConfig.port, function(){
  var host = server.address().address;
  var port = server.address().port;
  logger.log(`Server listening at ${host}:${port}`);
})

app.get('/report', async function(req,res){
  logger.log("Checking for response");
  var resBuilder = new ResponseBuilder(res);
  const transactionID = req.headers.transaction_id;
  res.setHeader('requestDelay',serverConfig.requestDelay);
  gateway.retrieveResponse(resBuilder,transactionID);
});

app.post(idmEndpoints.register, async function(req,res){
  const template = {
    'username':'string',
    'email':'string',
    'password':'string',
  }
  logger.log("Register User");
  var resBuilder = new ResponseBuilder(res);
  const body = req.body;
  var err = errors.verifyJson(body,template);
  if(err.type != 0){
    resBuilder.json["error"] = err.message;
    return resBuilder.default(err.type).end();
  }
  gateway.sendRequest(resBuilder,idmServerConfig,idmEndpoints.register,req,'POST');
});


