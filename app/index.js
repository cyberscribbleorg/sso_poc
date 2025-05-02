require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const app = express();
const memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

const keycloak = new Keycloak({ store: memoryStore }, {
  clientId: process.env.KC_CLIENT,
  bearerOnly: false,
  serverUrl: process.env.KC_URL,
  realm: process.env.KC_REALM,
  credentials: { secret: process.env.KC_SECRET }
});

app.use(keycloak.middleware());

// Public endpoint
app.get('/', (req, res) => {
  res.send('Public resource. <a href="/login">Login</a>');
});

// Login redirect
app.get('/login', keycloak.protect(), (req, res) => {
  res.send(`Hello ${req.kauth.grant.access_token.content.preferred_username}!`);
});

// Protected by role “user”
app.get('/user', keycloak.protect('realm:user'), (req, res) => {
  res.send('Hello User');
});

// Protected by role “user”
app.get('/admin', keycloak.protect('realm:admin'), (req, res) => {
  res.send('Hello Admin');
});



app.listen(3000, () => console.log('App on http://localhost:3000'));
