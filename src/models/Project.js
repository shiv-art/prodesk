import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["ADMIN", "MEMBER"], required: true, default: "MEMBER" }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true }
);

projectSchema.index({ _id: 1, "members.user": 1 });

export const Project = mongoose.model("Project", projectSchema);
