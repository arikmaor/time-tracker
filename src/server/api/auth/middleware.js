const util = require('util')
const {get} = require('lodash')
const passport = require('passport')

module.exports = {
  IsAuthenticated: passport.authenticate('jwt', {session: false}),
  IsAdmin(req, res, next) {
    if (get(req, 'user.isAdmin')) {
      next()
      return
    }

    res.status(403).send('Forbidden')
  }
}
