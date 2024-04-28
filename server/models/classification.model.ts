import mongoose, { Document, Model, Schema } from "mongoose";

export interface iClassification extends Document {
  name: string;
  description: string;
}

const classificationSchema: Schema = new Schema(
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

const Classification: Model<iClassification> = mongoose.model<iClassification>(
  "Classification",
  classificationSchema
);

export default Classification;
