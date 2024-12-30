const util = require('util')
const {Router} = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt')
const usersLogic = require('../users/logic')
const makeEndpoint = require('../../common/makeEndpoint')

const config = require('../../config')

let router = Router()

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, util.callbackify(usersLogic.getUserByUsernameAndPassword)))

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
  issuer: config.jwtIssuer,
  algorithems: ['HS256']
}, util.callbackify(({userId}) => usersLogic.getUserById(userId))))


router.post('/token',
  passport.authenticate('local', {session: false}),
  async (req, res) => {
    const token = await createJsonWebToken(req.user._id)
    console.log(`token created for: ${req.user.username}`)
    res.json({
      token,
      user: req.user
    })
  }
)

router.get('/user',
  passport.authenticate('jwt', {session: false}),
  (req, res, next) => {
    res.json(req.user)
  }
)

router.post('/changepassword', passport.authenticate('jwt', {session: false}), makeEndpoint(
  ({user, body}) => usersLogic.changePassword(user, body.oldPassword, body.newPassword)
))


const JWT_OPTIONS = {
  issuer: config.jwtIssuer,
  expiresIn: config.jwtExpiration
}
const createJsonWebToken = util.promisify((userId, done) => jwt.sign({userId}, config.jwtSecret, JWT_OPTIONS, done))

module.exports = router
