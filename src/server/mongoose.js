const mongoose = require('mongoose')
const config = require('./config')

require('mongoose-type-email')
mongoose.set('debug', config.debug)
// mongoose.set('useCreateIndex', true)
// mongoose.set('useFindAndModify', false)
mongoose.plugin(lastModifiedPlugin)

async function configureMongoose() {
  await mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    // reconnectTries: Number.MAX_VALUE
  })
 
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'mongodb connection error:'));
  db.once('open', () => {
    console.log('mongodb connected successfully!')
  });
}

function lastModifiedPlugin (schema, options) {
  schema.add({
    createdAt: Date,
    modifiedAt: Date
  });

  schema.pre('save', function (next) {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    this.modifiedAt = new Date();
    next();
  });

  if (options && options.index) {
    schema.path('modifiedAt').index(options.index);
  }
}

module.exports = {
  configureMongoose
}
