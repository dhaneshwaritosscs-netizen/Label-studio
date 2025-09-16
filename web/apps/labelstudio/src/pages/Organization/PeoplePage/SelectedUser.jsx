import { format } from "date-fns";
import { NavLink, useHistory } from "react-router-dom";
import { IconCross } from "@humansignal/icons";
import { Userpic } from "@humansignal/ui";
import { Button } from "../../../components";
import { Block, Elem } from "../../../utils/bem";
import "./SelectedUser.scss";

const UserProjectsLinks = ({ projects }) => {
  return (
    <Elem name="links-list">
      {projects.map((project) => (
        <Elem
          tag={NavLink}
          name="project-link"
          key={`project-${project.id}`}
          to={`/projects/${project.id}`}
          data-external
        >
          {project.title}
        </Elem>
      ))}
    </Elem>
  );
};

export const SelectedUser = ({ user, onClose }) => {
  const history = useHistory();
  const fullName = [user.first_name, user.last_name]
    .filter((n) => !!n)
    .join(" ")
    .trim();

  // Navigation functions
  const handleOpenProject = (projectId) => {
    history.push(`/projects/${projectId}/data`);
  };

  const handleCreateProject = () => {
    history.push('/projects');
  };

  return (
    <Block name="user-info">
      <Elem name="close" tag={Button} type="link" onClick={onClose}>
        <IconCross />
      </Elem>

      <Elem name="header">
        <Userpic user={user} style={{ width: 80, height: 80, fontSize: 32 }} />
        <Elem name="info-wrapper">
          <Elem tag="p" name="email">
            {user.email}
          </Elem>
          <Elem name="activity">
            <Elem name="clock-icon">🕐</Elem>
            {format(new Date(user.last_activity), "dd MMM yyyy, KK:mm a")}
          </Elem>
        </Elem>
        <Elem name="actions">
          <Elem name="action-button" title="Contact">✉️</Elem>
          <Elem name="action-button" title="Settings">⚙️</Elem>
          <Elem name="action-button" title="Remove">🗑️</Elem>
        </Elem>
      </Elem>

      <Elem name="tabs">
        <Elem name="tab" mod={{ active: true }}>Projects</Elem>
        <Elem name="tab">Contributions</Elem>
      </Elem>

      <Elem name="project-grid">
        {user.created_projects.slice(0, 4).map((project) => (
          <Elem key={`project-${project.id}`} name="project-card">
            <Elem name="project-icon">📁</Elem>
            <Elem name="project-title">{project.title}</Elem>
            <Elem name="project-type">ML Project</Elem>
            <Elem name="project-updated">2h ago</Elem>
          </Elem>
        ))}
      </Elem>

    </Block>
  );
};
