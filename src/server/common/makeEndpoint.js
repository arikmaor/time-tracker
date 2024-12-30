const makeEndpoint = fn => async (req, res, next) => {
  try {
    const result = await fn(req, res)
    res.json(result)
  } catch(err) {
    next(err)
  }
}

module.exports = makeEndpoint
