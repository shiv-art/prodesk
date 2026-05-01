import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2 },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
      required: true
    },
    dueDate: { type: Date, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, dueDate: 1 });

export const Task = mongoose.model("Task", taskSchema);
