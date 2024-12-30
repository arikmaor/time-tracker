const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema({
  clientId: {type: Number, required: true},
  activityId: {type: String, required: true},
  hourlyQuote: {type: Number, min: 0},
  travelQuote: {type: Number, min: 0}
}, {
  _id: false
})

const schema = new mongoose.Schema({
  _id: Number,
  username: {type: String, required: true, unique: true, sparse: true},
  password: {type: String, required: true},

  isAdmin: {type: Boolean, default: false},
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  idNumber: {type: Number},
  address: {type: String},
  phone: {type: String},
  email: {type: mongoose.SchemaTypes.Email, required: true, unique: true, sparse: true},
  startDate: {type: Date, required: true},

  type: {type: String, enum: ['employee', 'contractor'], required: true},
  lastReportDay: {type: Number, min: 1, max: 31},
  defaultHourlyQuote: {type: Number, min: 0, default: 0},
  defaultTravelQuote: {type: Number, min: 0, default: 0},

  activities: [activitySchema],

  isArchived: Boolean,
  isSystem: Boolean
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret.__v
      delete ret.id
      delete ret.password
      delete ret.isSystem
    },
    getters: true,
    virtuals: true
  }, 
  toJSON:  {
    transform: (doc, ret) => {
      delete ret.__v
      delete ret.id
      delete ret.password
      delete ret.isSystem
    },
    getters: true,
    virtuals: true
  }, 
})

schema.virtual('displayName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

module.exports = mongoose.model('User', schema);
