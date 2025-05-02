// Install: npm install express express-openid-connect dotenv

require('dotenv').config();
const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');

const app = express();

// 1. Configure OIDC to point at your Keycloak realm
const oidcConfig = {
  authRequired: false,            // don’t force login for every route
  auth0Logout: true,              // calls the provider’s /logout endpoint
  secret: process.env.SESSION_SECRET,      // a long, random string
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  clientID: process.env.KC_CLIENT,         // Keycloak client ID
  clientSecret: process.env.KC_SECRET,     // Keycloak client secret
  issuerBaseURL: `${process.env.KC_HOST}/realms/${process.env.KC_REALM}`,
  idpLogout: true,               // make sure logout hits Keycloak
 // ← Add this block to force code flow + PKCE
 authorizationParams: {
    response_type: 'code',         // use Auth Code, not id_token or token
    response_mode: 'query',        // return code on query string
    scope: 'openid profile email roles', // request the usual scopes
    code_challenge_method: 'S256'  // PKCE
  },  
};

app.use(auth(oidcConfig));

// Public endpoint
app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.send(
      `Welcome ${req.oidc.user.preferred_username}!` +
      ` <a href="/user">User</a> |` +
      ` <a href="/admin">Admin</a> |` +
      ` <a href="/logout">Logout</a>`
    );
  } else {
    res.send('Public resource. <a href="/login">Login</a>');
  }
});

// “/login” is handled for you by express-openid-connect
// you can still customize it if you like:
// app.get('/login', (req,res) => res.oidc.login());

// Protected endpoint, any authenticated user
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(`Your profile info: ${JSON.stringify(req.oidc.user)}`);
});

// Role-restricted: user must be in realm_access.roles
app.get('/user', requiresAuth(), (req, res) => {
  const roles = req.oidc.user.realm_access?.roles || [];
  console.log(roles);
  if (roles.includes('user')) {
    res.send('Hello User');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.get('/admin', requiresAuth(), (req, res) => {
  const roles = req.oidc.user.realm_access?.roles || [];
  console.log(roles);  
  if (roles.includes('admin')) {
    res.send('Hello Admin');
  } else {
    res.status(403).send('Forbidden');
  }
});

app.listen(3000, () => console.log('App running on http://localhost:3000'));
