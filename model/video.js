/** @format */
import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema({
	video: String,
});

const VideoModel = mongoose.model("video", VideoSchema);
export default VideoModel;
