const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: {type: String, required: true, unique: true, sparse: true},
  defaultHourlyQuote: {type: Number, default: 0},
  notes: {type: String, default: ''},

  isArchived: Boolean
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret.__v
    }
  }
})

module.exports = mongoose.model('Activity', schema);
