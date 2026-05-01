import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProjectMembership } from "../utils/projectAccess.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id }).select("_id");
  const projectIds = projects.map((p) => p._id);

  const tasks = await Task.find({ project: { $in: projectIds } })
    .sort({ dueDate: 1 })
    .populate("assignedTo", "name email")
    .populate("project", "name");

  res.json(tasks);
});

router.post("/", async (req, res) => {
  const { title, description = "", dueDate, projectId, assignedTo } = req.body;
  if (!title || !dueDate || !projectId || !assignedTo) {
    return res.status(400).json({
      message: "title, dueDate, projectId, and assignedTo are required"
    });
  }

  const { project, membership } = await getProjectMembership(projectId, req.user._id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!membership) return res.status(403).json({ message: "Not a project member" });

  const assigneeMember = project.members.find(
    (member) => member.user.toString() === assignedTo.toString()
  );
  if (!assigneeMember) {
    return res.status(400).json({ message: "Assigned user must be a project member" });
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    project: project._id,
    assignedTo,
    createdBy: req.user._id
  });
  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("project", "name");
  res.status(201).json(populated);
});

router.patch("/:taskId/status", async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const task = await Task.findById(taskId).populate("project");
  if (!task) return res.status(404).json({ message: "Task not found" });

  const { membership } = await getProjectMembership(task.project._id, req.user._id);
  if (!membership) return res.status(403).json({ message: "Not a project member" });

  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  const isAdmin = membership.role === "ADMIN";
  if (!isAssignee && !isAdmin) {
    return res.status(403).json({ message: "Only assignee or admin can update status" });
  }

  task.status = status;
  await task.save();

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("project", "name");
  res.json(populated);
});

router.get("/dashboard/summary", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id }).select("_id");
  const projectIds = projects.map((p) => p._id);
  const now = new Date();

  const [myTasks, todoCount, inProgressCount, doneCount, overdueCount] = await Promise.all([
    Task.countDocuments({ assignedTo: req.user._id, project: { $in: projectIds } }),
    Task.countDocuments({ project: { $in: projectIds }, status: "TODO" }),
    Task.countDocuments({ project: { $in: projectIds }, status: "IN_PROGRESS" }),
    Task.countDocuments({ project: { $in: projectIds }, status: "DONE" }),
    Task.countDocuments({ project: { $in: projectIds }, status: { $ne: "DONE" }, dueDate: { $lt: now } })
  ]);

  res.json({
    myTasks,
    status: { TODO: todoCount, IN_PROGRESS: inProgressCount, DONE: doneCount },
    overdue: overdueCount
  });
});

export default router;
