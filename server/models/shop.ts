import mongoose, { Document, Model, Schema } from "mongoose";

export interface iShop extends Document {
  name: string;
  description: string;
  address: string;
  city:string,
  district:string,
  phone:Number
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
    address: {
      type: String,
    },
  },
  { timestamps: true }
);

const Status: Model<iShop> = mongoose.model<iShop>("Status", statusSchema);

export default Status;
