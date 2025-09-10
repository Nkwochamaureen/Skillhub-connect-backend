const mongoose = require('mongoose');
const Task = require('./models/task');

mongoose.connect('mongodb://localhost:27017/serenity', { useNewUrlParser: true, useUnifiedTopology: true });

const tasks = [
  { _id: 1, title: 'Build Foundation', status: 'In Progress' },
  { _id: 2, title: 'Install Framework', status: 'Pending' }
];

Task.insertMany(tasks)
  .then(() => console.log('Data seeded'))
  .catch(err => console.error(err))
  .finally(() => mongoose.connection.close());