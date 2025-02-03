/** @format */

import express from "express";
import user from "../model/user.js";
import Species from "../model/species.js";
import Video from "../model/video.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Make sure to import bcrypt
import Image from "../model/image.js";
import axios from "axios";
import multer from "multer";
import Grid from "gridfs-stream";
import mongoose from "mongoose";

const JWT_SECRET = "qwertyuiop"; // Store this securely in an environment variable

const router = express.Router();

router.post("/create-user", async (req, res) => {
	try {
		const { username, password } = req.body;

		// Validate if all required fields are present
		if (!username || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}

		// Check if the user already exists
		const existingUser = await user.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username or Email already taken" });
		}

		// Hash the password before saving it to the database
		const hashedPassword = await bcrypt.hash(password, 8);

		// Create a new user
		const newUser = new user({
			username,
			password: hashedPassword,
		});

		// Save the user to the database
		await newUser.save();

		// Return a success response
		res.status(200).json({
			message: "User created successfully",
			user: { username },
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while creating user" });
	}
});

router.route("/login").post(async (req, res, next) => {
	const { username, password } = req.body;

	try {
		const userLogin = await user.findOne({ username });
		if (!userLogin) {
			return res.status(401).json({ message: "ชื่อผู้ใช้ไม่ถูกต้อง" });
		}

		const isMatch = await bcrypt.compare(password, userLogin.password);
		if (!isMatch) {
			return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
		}

		const token = jwt.sign({ id: userLogin._id, email: userLogin.email }, JWT_SECRET, { expiresIn: "1h" });

		res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token });
	} catch (err) {
		console.error("Error during login:", err);
		res.status(500).json({ message: "Server error" });
	}
});

router.post("/create-species", async (req, res) => {
	try {
		const { name, quantity, height, trunkSize, image } = req.body;

		// Check if all required fields are provided
		if (!name || !quantity || !height || !trunkSize) {
			return res.status(400).json({ error: "All fields are required" });
		}

		// Create a new species document
		const newSpecies = new Species({
			name,
			quantity,
			height,
			trunkSize,
			lastUpdated: new Date(), // Set the current date for lastUpdated
		});

		// Save the new species to the database
		await newSpecies.save();

		const speciesId = newSpecies._id;

		// Create a new Image document, linking it to the species via the species _id
		const newImage = new Image({
			name,
			image,
			species: speciesId, // Associate the image with the species
		});

		// Save the new image
		await newImage.save();

		// Send a success response
		res.status(200).json({ message: "Species created successfully", species: newSpecies });
	} catch (error) {
		// Handle any errors
		console.error(error);
		res.status(500).json({ error: "An error occurred while creating species" });
	}
});

router.get("/species", async (req, res) => {
	try {
		const species = await Species.find();
		// for (const s of species) {
		// 	const speciesImg = await Image.findOne({ species: s._id });
		// 	s.image = speciesImg.image;
		// }

		// Fetch all species from the database
		res.status(200).json(species); // Return the species as JSON
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while fetching species" });
	}
});

router.put("/species/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name, quantity, height, trunkSize, image } = req.body;

		if (!name || !quantity || !height || !trunkSize) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const updatedSpecies = await Species.findByIdAndUpdate(id, { name, quantity, height, trunkSize, lastUpdated: new Date() }, { new: true });

		if (!updatedSpecies) {
			return res.status(404).json({ error: "Species not found" });
		}

		res.status(200).json({ message: "Species updated successfully", species: updatedSpecies });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while updating species" });
	}
});

router.delete("/species/:id", async (req, res) => {
	try {
		const { id } = req.params;

		await Image.deleteOne({ species: id });

		const deletedSpecies = await Species.findByIdAndDelete(id);

		if (!deletedSpecies) {
			return res.status(404).json({ error: "Species not found" });
		}

		res.status(200).json({ message: "Species deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while deleting species" });
	}
});

router.post("/speciesImg", async (req, res) => {
	try {
		const { name, imageBase64 } = req.body;

		if (!name || !imageBase64) {
			return res.status(400).json({ error: "Name and image are required" });
		}

		const newImage = new Image({
			name,
			image: imageBase64,
		});

		await newImage.save();
		res.status(200).json({ message: "Image uploaded successfully", image: newImage });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while uploading the image" });
	}
});

router.post("/upload-video", async (req, res) => {
	try {
		const { videoBase64 } = req.body;
		// Validate input
		if (!videoBase64) {
			return res.status(400).json({ error: "videoBase64 is required" });
		}

		// Optional: Validate the base64 format (basic validation)
		const base64Pattern = /^data:video\/\w+;base64,/;
		if (!base64Pattern.test(videoBase64)) {
			return res.status(400).json({ error: "Invalid base64 video format" });
		}

		// Create a new Video document
		const newVideo = new Video({
			video: videoBase64, // Store the base64-encoded video
		});

		// Save the new video to the database
		await newVideo.save();

		// Respond with success
		res.status(200).json({ message: "Video uploaded successfully", video: newVideo });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while uploading the video" });
	}
});

router.get("/videos", async (req, res) => {
	try {
		const videos = await Video.find();

		// Fetch all species from the database
		res.status(200).json(videos); // Return the species as JSON
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "An error occurred while fetching species" });
	}
});

export default router;
