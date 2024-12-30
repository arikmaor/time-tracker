const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  _id: String,
  value: {type: Number, default: 1}
})

const Model = mongoose.model('Counter', schema);

module.exports = {
  async getNextId(counterName) {
    const {value} = await Model.findByIdAndUpdate(counterName,
      {$inc: {value: 1}},
      {
        new: true,
        upsert: true,
        lean: true
      }
    )
    return value
  },

  async cancelId(counterName, value) {
    await Model.findOneAndUpdate({
        _id: counterName,
        value
      }, {
        $inc: {value: -1}
      }, {
        lean: true
      }
    )
  }
}
