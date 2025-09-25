import React from "react";
import { ProjectStatusPage as ProjectStatusComponent } from "../../components/ProjectStatusPage/ProjectStatusPage";

export const ProjectStatusPage = () => {
  return <ProjectStatusComponent onClose={() => window.history.back()} />;
};

ProjectStatusPage.title = "Project Status";
ProjectStatusPage.path = "/project-status";
ProjectStatusPage.exact = true;
