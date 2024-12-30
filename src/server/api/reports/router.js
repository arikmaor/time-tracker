const express = require('express')
const logic = require('./logic')
const {IsAuthenticated, IsAdmin} = require('../auth/middleware')
const makeEndpoint = require('../../common/makeEndpoint')
const router = new express.Router()

router.use(IsAuthenticated)
router.use(IsAdmin)

router.get('/', makeEndpoint(
  ({query}) => logic.getReports(query.startDate, query.endDate, query.group, query.filter)
))

module.exports = router
