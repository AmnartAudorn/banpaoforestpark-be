/** @format */

import mongoose from "mongoose";

// Define user schema
const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
		minlength: 8,
	},
});

// Create and export user model
const user = mongoose.model("user", userSchema);
export default user;
