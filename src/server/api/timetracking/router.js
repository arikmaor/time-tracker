const express = require('express')
const logic = require('./logic')
const {IsAuthenticated} = require('../auth/middleware')
const makeEndpoint = require('../../common/makeEndpoint')
const router = new express.Router()

router.use(IsAuthenticated)

router.get('/', makeEndpoint(
  ({user, query}) => logic.getMonthTimeTracking(user, query.month, query.year, query.userId)
))

router.post('/', makeEndpoint(
  ({user, body}) => logic.addTimeTrackingReport(user, body)
))

router.put('/:id', makeEndpoint(
  ({user, params: {id}, body}) => logic.updateTimeTrackingReport(user, id, body)
))

router.delete('/:id', makeEndpoint(
  ({user, params: {id}}) => logic.deleteTimeTrackingReport(user, id)
))

module.exports = router
