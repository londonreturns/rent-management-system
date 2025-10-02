import mongoose, { Schema } from "mongoose";

const peopleSchema = new Schema({
  name: { type: String, required: true },
  number_of_people: { type: Number, required: true },
  phone: { type: String, required: true },
  room_id: { type: Schema.Types.ObjectId, ref: "Room", default: null },
  created_at_bikram_sambat: { type: String, default: null },
  createdBSInEnglish: { type: String, default: null },
  createdADInEnglish: { type: String, default: null },
  deadlineBSInEnglish: { type: String, default: null },
  deadlineADInEnglish: { type: String, default: null },
});

const peopleModel = mongoose.models.People || mongoose.model("People", peopleSchema);

export default peopleModel;