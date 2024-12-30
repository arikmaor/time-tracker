# Time Tracker server

This server hosts the logic of the time tracker.
Data is saved on [mongodb](https://www.mongodb.com/) using [mongoose](https://mongoosejs.com/).

It also serves the static web app stored in `/dist`.
You can build it with `yarn build`.

## Project structure
```
src/server
├── api
│   ├── activities
│   │   ├── logic.js
│   │   ├── model.js
│   │   └── router.js
│   ├── auth
│   │   ├── middleware.js
│   │   └── router.js
│   ├── clients
│   │   ├── logic.js
│   │   ├── model.js
│   │   └── router.js
│   ├── reports
│   │   ├── logic.js
│   │   ├── model.js
│   │   └── router.js
│   ├── timetracking
│   │   ├── logic.js
│   │   └── router.js
│   └── users
│       ├── logic.js
│       ├── model.js
│       └── router.js
├── common
│   ├── UserError.js  # common error object
│   ├── counters.js  # used for creating sequential ids
│   ├── mailer.js # logic for sending mails
│   └── makeEndpoint.js # helper for creating api endpoint
├── config.js # maps of configuration values
├── index.js # initial entrypoint
└── mongoose.js # global mongoose configuration
```

The project consist of several modules, each module contains this files:
- `model.js` - defines the entity schema (how it maps from the db to code).
- `logic.js` - logic implementaions.
- `routes.js` - mapping of http endpoints and functions from `logic.js`

There is also a special `auth` module that handles JWT based authentication.

All data is expected in JSON form.

## Routes by Module

### Auth

#### POST /api/auth/token
Request body should contain `username` and `password` fields.
This request returns a token that identifies the user in all further requests by including it as a standard BEARER token.

#### POST /api/auth/changepassword
Request body should contain `oldPassword` and `newPassword` fields.
Updates the logged in user password

### Users
This api endpoints are accessible only for admins.

#### GET /api/users
Gets all users

#### POST /api/users
Adds a new user and sends him a mail with his password

#### GET /api/users/:id
Gets a specific user

#### PUT /api/users/:id
Updates a specific user

#### DELETE /api/users/:id
Archives a specific user

#### POST /api/users/:id/resetpassword
Resets a users password and sends him a mail with the new one

### Clients
This api endpoints are accessible only for admins. (except for the first)

#### GET /api/clients
Retrieves all the clients information (that the user has permissions to see)

#### POST /api/clients
Adds a new client

#### GET /api/clients/:id
Gets a specific client

#### PUT /api/clients/:id
Updates a specific client

#### DELETE /api/clients/:id
Archives a specific client

### Activities
This api endpoints are accessible only for admins. (except for the first)

#### GET /api/activities
Retrieves all the activities information (that the user has permissions to see)

#### POST /api/activities
Adds a new activity

#### GET /api/activities/:id
Gets a specific activity

#### PUT /api/activities/:id
Updates a specific activity

#### DELETE /api/activities/:id
Archives a specific activity

### Time Tracking

#### GET /api/timetracking
Gets time tracking information for a specific month specified as `month` and `year` for the logged in user or for the user specified in `userId` if the logged in user is an admin.

#### POST /api/timetracking
Adds a new time tracking "line"

#### PUT /api/timetracking/:id
Updates a specific time tracking "line"

#### DELETE /api/timetracking/:id
Deletes a time tracking "line"

### Reports

#### GET /api/reports
Returns data for time tracking reports.
Requires `startDate` and `endDate` query params.
Optional `filter` and `group`
