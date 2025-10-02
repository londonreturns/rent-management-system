import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema({
  readable_id: { type: Number, required: true, unique: true },
  rent: { type: Number, required: true },
  is_occupied: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }, 
  water_price: { type: Number, required: true, default: 0 },
});

const roomModel = mongoose.models.Room || mongoose.model("Room", roomSchema);

export default roomModel;