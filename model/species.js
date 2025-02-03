/** @format */

import mongoose from "mongoose";

const speciesSchema = new mongoose.Schema({
	name: { type: String, required: true },
	quantity: { type: Number, required: true },
	height: { type: Number, required: true },
	trunkSize: { type: Number, required: true },
	image: { type: String },
	lastUpdated: { type: Date, required: true },
});

// Create and export the model
const Species = mongoose.model("Species", speciesSchema);
export default Species;
