# UINGame Time Tracker

Time tracker for UINGame employees

## Local Setup
1. [git](https://git-scm.com/download) (to upload to production)
2. [heroku-cli](https://devcenter.heroku.com/articles/heroku-cli) (to upload and manage to production)
3. [nodejs](https://nodejs.org/) and [yarn](https://yarnpkg.com/) (for local development)

## Local Development
Setup local repository:
```sh
git clone git@github.com:uingame/time-tracker.git
cd time-tracker
yarn install
```

See documentation of [server](src/server) and [client](/src/client)

### Run development server
```sh
yarn dev
```

### Build and run production server
```sh
yarn build
yarn start
```

## Uploading to production
Uploading to heroku is done using git.

Setup your repository using the `heroku` cli:
```sh
heroku login
heroku git:remote -a uingame-auth
```

Now you can upload by pushing to the heroku remote running:
```sh
# make sure everything is committed to git
git add --all
git commit -m "commit message"

# push to heroku
git push heroku master
```

## Monitoring production
In order to see the live log from production run:
```sh
heroku logs --tails
```
It is useful to run this while restarting the server, changing environment variables, etc.
you can also see the logs [here](https://dashboard.heroku.com/apps/uingame-timetracker/logs)

## Server Configurations
The server is configured using environment variables that can be found and changed in [heroku app settings](https://dashboard.heroku.com/apps/uingame-timetracker/settings).

Available settings are:

| Variable | Description | Default Value |
| --- | --- | --- |
| PORT | Port for the server to run | set by heroku |
| SENDGRID_USERNAME | Sendgrid username | set by heroku |
| SENDGRID_PASSWORD | Sendgrid password | set by heroku
| MONGODB_URI | MongoDB URI | set by heroku |
| DEBUG | if set, server will write additional logs | |
| JWT_SECRET | secret for JWT | change this to disconnect everybody |
| JWT_ISSUER | jwt issuer | default: uingame |
| JWT_EXPIRATION | how much time untill user disconnects | default: 30 days |
