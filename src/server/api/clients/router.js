const express = require('express')
const logic = require('./logic')
const {IsAuthenticated, IsAdmin} = require('../auth/middleware')
const makeEndpoint = require('../../common/makeEndpoint')
const router = new express.Router()

router.use(IsAuthenticated)

router.get('/', makeEndpoint(
  ({user}) => logic.getAllClients(user)
))

router.use(IsAdmin)

router.post('/', makeEndpoint(
  ({body}) => logic.addClient(body)
))

router.get('/:id', makeEndpoint(
  ({params: {id}}) => logic.getClientById(id)
))

router.put('/:id', makeEndpoint(
  ({params: {id}, body}) => logic.updateClient(id, body)
))

router.delete('/:id', makeEndpoint(
  ({params: {id}}) => logic.archiveClient(id)
))

module.exports = router
