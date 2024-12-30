const {isString, isPlainObject} = require('lodash')

module.exports = class UserError extends Error {
  constructor(msg, fields) {
    if (isString(msg)) {
      super(msg)
      this.fields = fields
    } else if (isPlainObject(msg)) {
      super('Errors occurred')
      this.fields = msg
    }
  }
}
