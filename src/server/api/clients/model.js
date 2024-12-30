const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema({
  activityId: {type: String, required: true},
  hourlyQuote: {type: Number, min: 0}
}, {
  _id: false
})

const schema = new mongoose.Schema({
  _id: Number,
  name: {type: String, required: true, unique: true, sparse: true},
  contactPersonName: String,
  address: String,
  email: {type: mongoose.SchemaTypes.Email, allowBlank: true},
  phone: String,
  notes: String,

  activities: [activitySchema],

  isArchived: Boolean
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret.__v
      delete ret.password
    }
  }
})


module.exports = mongoose.model('Client', schema);
