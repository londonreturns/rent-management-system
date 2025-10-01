import mongoose, { Schema } from "mongoose";

const peopleSchema = new Schema({
  name: { type: String, required: true },
  number_of_people: { type: Number, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const peopleModel = mongoose.models.People || mongoose.model("People", peopleSchema);

export default peopleModel;