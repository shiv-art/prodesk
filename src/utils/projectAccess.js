import { Project } from "../models/Project.js";

export const getProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    return { project: null, membership: null };
  }

  const membership = project.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  return { project, membership };
};
