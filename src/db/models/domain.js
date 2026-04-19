import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
    domain: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Domain", domainSchema);