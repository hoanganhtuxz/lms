import mongoose, { Document, Model, Schema } from "mongoose";

export interface iCondition extends Document {
  name: string;
  description: string;
}

const conditionSchema: Schema = new Schema(
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

const Condition: Model<iCondition> = mongoose.model<iCondition>(
  "Condition",
  conditionSchema
);

export default Condition;
