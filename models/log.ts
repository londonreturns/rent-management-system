import mongoose, { Schema } from "mongoose";

const logSchema = new Schema({
    type: { type: String, required: true }, // e.g., room_created, room_updated, room_deleted, user_created, user_updated, user_deleted, payment_created, payment_updated, payment_deleted
    entity: { type: String, required: true }, // room | user | payment
    entity_id: { type: String, required: false },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now }
});

const logModel = mongoose.models.Log || mongoose.model("Log", logSchema);
export default logModel;


