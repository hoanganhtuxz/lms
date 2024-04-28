import mongoose, { Document, Model, Schema } from "mongoose";

export interface iStatus extends Document {
  name: string;
  description: string;
}

const statusSchema: Schema = new Schema(
  {
    name: {
      type: String,
      minlength: [2, "Name must be at least 6 characters long"],
      required: [true, "Please enter the name"],
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Status: Model<iStatus> = mongoose.model<iStatus>(
  "Status",
  statusSchema
);

export default Status;
