import mongoose, { Document, Model, Schema } from "mongoose";
import { iCategory } from "./categories.model";
import { iStatus } from "./status.model";
import { iClassification } from "./classification.model";
import { iCondition } from './condition.model';

interface iWarehouse extends Document {
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: iCategory["_id"];
  status: iStatus["_id"];
  classification: iClassification["_id"];
  condition: iCondition["_id"];
  images: string[];
}

const warehouseSchema: Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the product name"],
    },
    description: {
      type: String,
      required: [false, "Please enter the product description"],
    },
    quantity: {
      type: Number,
      required: [false, "Please enter the product quantity"],
    },
    price: {
      type: Number,
      required: [false, "Please enter the product price"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [false, "Please enter the product category"],
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      required: [false, "Please enter the product status"],
    },
    classification: {
      type: Schema.Types.ObjectId,
      ref: "Classification",
      required: [false, "Please enter the product classification"],
    },
    condition: {
      type: Schema.Types.ObjectId,
      ref: "Condition",
      required: [false, "Please enter the product condition"],
    },
    images: [
      {
        public_id: {
          type: String,
          required: false
      },
      url: {
          type: String,
          required: false
      }
      },
    ],
  },
  { timestamps: true }
);
const Warehouse: Model<iWarehouse> = mongoose.model<iWarehouse>(
  "Warehouse",
  warehouseSchema
);

export default Warehouse;
