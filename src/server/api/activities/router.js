const express = require('express')
const logic = require('./logic')
const {IsAuthenticated, IsAdmin} = require('../auth/middleware')
const makeEndpoint = require('../../common/makeEndpoint')
const router = new express.Router()

router.use(IsAuthenticated)

router.get('/', makeEndpoint(
  ({user}) => logic.getAllActivities(user)
))

router.use(IsAdmin)

router.post('/', makeEndpoint(
  ({body}) => logic.addActivity(body)
))

router.get('/:id', makeEndpoint(
  ({params: {id}}) => logic.getActivityById(id)
))

router.put('/:id', makeEndpoint(
  ({params: {id}, body}) => logic.updateActivity(id, body)
))

router.delete('/:id', makeEndpoint(
  ({params: {id}}) => logic.archiveActivity(id)
))

module.exports = router
