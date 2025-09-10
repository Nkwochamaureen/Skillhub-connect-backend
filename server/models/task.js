const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  _id: Number,
  title: String,
  status: String
});
module.exports = mongoose.model('Task', taskSchema);