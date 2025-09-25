import { ProjectsPage } from "./Projects/Projects";
import { HomePage } from "./Home/HomePage";
import { OrganizationPage } from "./Organization";
import { ModelsPage } from "./Organization/Models/ModelsPage";
import { AssignRole } from "./AssignRole/AssignRole";
import { AssignRole as UserRoleAssignment } from "./AssignRole/user/user";
import { ProjectsOverview } from "./ProjectsOverview/ProjectsOverview";
import { SettingsPage } from "./Settings";
import { ProjectSettings } from "./ProjectSettings/ProjectSettings";
import { ProjectStatusPage } from "./ProjectStatus/ProjectStatusPage";
import { RolesManagement } from "./RolesManagement/RolesManagement";
import { FF_HOMEPAGE, isFF } from "../utils/feature-flags";
import { pages } from "@humansignal/app-common";
import { ff } from "@humansignal/core";

export const Pages = [
  isFF(FF_HOMEPAGE) && HomePage,
  ProjectsPage,
  OrganizationPage,
  ModelsPage,
  AssignRole,
  UserRoleAssignment,
  ProjectsOverview,
  SettingsPage,
  ProjectSettings,
  ProjectStatusPage,
  RolesManagement,
  ff.isFF(ff.FF_AUTH_TOKENS) && pages.AccountSettingsPage,
].filter(Boolean);
