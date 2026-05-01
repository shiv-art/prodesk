import express from "express";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { getProjectMembership } from "../utils/projectAccess.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .sort({ createdAt: -1 })
    .populate("members.user", "name email");
  res.json(projects);
});

router.post("/", async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: "ADMIN" }]
  });

  res.status(201).json(project);
});

router.post("/:projectId/members", async (req, res) => {
  const { projectId } = req.params;
  const { email, role = "MEMBER" } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Member email is required" });
  }
  if (!["ADMIN", "MEMBER"].includes(role)) {
    return res.status(400).json({ message: "Role must be ADMIN or MEMBER" });
  }

  const { project, membership } = await getProjectMembership(projectId, req.user._id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!membership) return res.status(403).json({ message: "Not a project member" });
  if (membership.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can add members" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: "User not found by email" });
  }

  const exists = project.members.some((member) => member.user.toString() === user._id.toString());
  if (exists) {
    return res.status(409).json({ message: "User is already in this project" });
  }

  project.members.push({ user: user._id, role });
  await project.save();

  const populated = await Project.findById(project._id).populate("members.user", "name email");
  return res.status(201).json(populated);
});

export default router;
