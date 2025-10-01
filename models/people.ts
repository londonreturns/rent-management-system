import mongoose, { Schema } from "mongoose";

const peopleSchema = new Schema({
  name: { type: String, required: true },
  number_of_people: { type: Number, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: false },
  room_id: { type: Schema.Types.ObjectId, ref: "Room", default: null },
  created_at: { type: Date, default: Date.now },
  deadline_date: { type: Date, default: null },
});

const peopleModel = mongoose.models.People || mongoose.model("People", peopleSchema);

export default peopleModel;