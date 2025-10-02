import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema({
  room_id: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  person_id: { type: Schema.Types.ObjectId, ref: "People", required: true },
  room_readable_id: { type: Number, required: true },
  person_name: { type: String, required: true },

  // Payment period (Bikram Sambat)
  payment_month: { type: String, required: true }, // e.g., "2081-07" (BS YYYY-MM)
  payment_month_name: { type: String, required: true }, // e.g., "Kartik 2081"
  payment_month_name_nepali: { type: String, default: null }, // e.g., "कार्तिक"

  // Payment components
  electricity_units: { type: Number, required: true, min: 0 },
  electricity_cost: { type: Number, required: true, min: 0 },
  water_cost: { type: Number, required: true, min: 0 },
  rent_cost: { type: Number, required: true, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },

  // Actual payment tracking
  amount_paid: { type: Number, required: true, min: 0 },
  remaining_balance: { type: Number, default: 0 }, // Can be negative if overpaid
  previous_balance: { type: Number, default: 0 }, // Outstanding from previous months

  // Dates (Bikram Sambat ready)
  payment_date_bs: { type: String, default: null }, // Bikram Sambat date
  payment_date_ad: { type: Date, default: Date.now }, // Gregorian date

  // Status and metadata
  status: {
    type: String,
    enum: ["pending", "completed", "partial", "overpaid", "failed", "refunded"],
    default: "completed"
  },
  payment_method: {
    type: String,
    enum: ["cash", "online"],
    default: "cash"
  },
  notes: { type: String, default: null },

  // Audit fields
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update the updated_at field on save
paymentSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

const paymentModel = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default paymentModel;
