const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const DeveloperSchema = new Schema({
  name: { type: String },
  id: { type: Number, unique: true },
},{ versionKey: false });

module.exports = model("Developer", DeveloperSchema);
