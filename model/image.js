/** @format */
import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
	name: String,
	image: String,
	species: String,
});

const ImageModel = mongoose.model("Image", ImageSchema);
export default ImageModel;
