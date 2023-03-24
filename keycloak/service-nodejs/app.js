/*
 * JBoss, Home of Professional Open Source
 * Copyright 2016, Red Hat, Inc. and/or its affiliates, and individual
 * contributors by the @authors tag. See the copyright.txt in the
 * distribution for a full listing of individual contributors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const Keycloak = require('keycloak-connect');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Enable CORS support
app.use(cors());

// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

const keycloak = new Keycloak({
  store: memoryStore
});

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

app.get('/service/public', function (req, res) {
  res.json({message: 'public'});
});

app.get('/service/secured', keycloak.protect('client2:user'), function (req, res) {
    // Get user name from keycloak: https://stackoverflow.com/questions/35522154/get-username-from-keycloak-session-in-nodejs
    console.log("Access token content: "+JSON.stringify(req.kauth.grant.access_token.content));
    // {"exp":1679657609,"iat":1679657309,"auth_time":1679652835,"jti":"99245e6d-188c-429f-bea9-04dca01081e7","iss":"http://localhost:8080/realms/chat-realm","aud":"account","sub":"270e5106-2065-4f8c-9e19-ed96e7246348","typ":"Bearer","azp":"chat-client","nonce":"c04c0574-74e5-4191-8dfb-e38055956d1c","session_state":"a35fb13a-639e-4fbe-a2f3-8538ec50e793","acr":"0","allowed-origins":["http://localhost:9090"],"realm_access":{"roles":["offline_access","default-roles-chat-realm","uma_authorization"]},"resource_access":{"chat-client":{"roles":["uma_protection"]},"account":{"roles":["manage-account","manage-account-links","view-profile"]}},"scope":"openid email profile","sid":"a35fb13a-639e-4fbe-a2f3-8538ec50e793","email_verified":false,"preferred_username":"user1","given_name":"","family_name":""}
    console.log("Request user name: "+req.kauth.grant.access_token.content.preferred_username);
    console.log("Users scope: "+JSON.stringify(req.kauth.grant.access_token.content.scope));
    // "openid email profile"
    console.log("Users roles: "+JSON.stringify(req.kauth.grant.access_token.content.resource_access));
    //{"chat-client":{"roles":["uma_protection"]},"account":{"roles":["manage-account","manage-account-links","view-profile"]}}
    res.json({message: 'secured'});
});

// app.get('/service/secured', keycloak.protect('uma_protection'), function (req, res) {
//   res.json({message: 'secured'});
// });

app.get('/service/admin', keycloak.protect('client2:admin'), function (req, res) {
  res.json({message: 'admin'});
});

app.use('*', function (req, res) {
  res.send('Not found!');
});

app.listen(3000, function () {
  console.log('Started at port 3000');
});
