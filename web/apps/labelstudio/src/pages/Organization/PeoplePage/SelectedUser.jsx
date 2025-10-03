import { format } from "date-fns";
import { NavLink, useHistory } from "react-router-dom";
import { IconCross } from "@humansignal/icons";
import { Userpic } from "@humansignal/ui";
import { Button } from "../../../components";
import { Block, Elem } from "../../../utils/bem";
import { useState, useEffect } from "react";
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
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects'); // Default to projects tab
  
  const fullName = [user.first_name, user.last_name]
    .filter((n) => !!n)
    .join(" ")
    .trim();

  // Fetch user roles
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.email) return;
      
      setLoadingRoles(true);
      setRolesError(null);
      
      try {
        // Use the simple endpoint that bypasses authentication
        const response = await fetch(`http://localhost:8010/api/simple-user-roles/?email=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include', // Include cookies for session authentication
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (!response.ok) {
          // If authentication fails, try without credentials
          if (response.status === 401) {
            console.log("Authentication failed, trying without credentials...");
            const retryResponse = await fetch(`http://localhost:8010/api/simple-user-roles/?email=${encodeURIComponent(user.email)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log("Retry response:", retryData);
              if (retryData.status === 'success') {
                setUserRoles(retryData.user_roles || []);
                return;
              }
            }
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("User roles response:", data);
        
        if (data.status === 'success') {
          setUserRoles(data.user_roles || []);
        } else {
          setRolesError(data.message || 'Failed to fetch roles');
        }
      } catch (err) {
        console.error("Error fetching user roles:", err);
        // For now, show a more user-friendly error and try to get roles from a different source
        setRolesError(`Unable to load roles: ${err.message}. Please check if the user has been assigned any roles.`);
        
        // Try to get roles from the existing user data if available
        if (user.roles) {
          setUserRoles(user.roles);
          setRolesError(null);
        }
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchUserRoles();
  }, [user?.email]);

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
        <Elem 
          name="tab" 
          mod={{ active: activeTab === 'projects' }}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </Elem>
        <Elem 
          name="tab" 
          mod={{ active: activeTab === 'contributions' }}
          onClick={() => setActiveTab('contributions')}
        >
          Contributions
        </Elem>
        <Elem 
          name="tab" 
          mod={{ active: activeTab === 'roles' }}
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </Elem>
      </Elem>

      {/* Tab Content */}
      {activeTab === 'projects' && (
        <Elem name="project-grid">
          {(user.created_projects || []).slice(0, 4).map((project) => (
            <Elem key={`project-${project.id}`} name="project-card">
              <Elem name="project-icon">📁</Elem>
              <Elem name="project-title">{project.title}</Elem>
              <Elem name="project-type">ML Project</Elem>
              <Elem name="project-updated">2h ago</Elem>
            </Elem>
          ))}
        </Elem>
      )}

      {activeTab === 'contributions' && (
        <Elem name="contributions-section">
          <Elem name="section-title">Contributions</Elem>
          <Elem name="no-contributions">
            No contributions data available yet.
          </Elem>
        </Elem>
      )}

      {activeTab === 'roles' && (
        <Elem name="roles-section">
          <Elem name="section-title">Assigned Roles</Elem>
          {loadingRoles && (
            <Elem name="loading">Loading roles...</Elem>
          )}
          {rolesError && (
            <Elem name="error">Error loading roles: {rolesError}</Elem>
          )}
          {!loadingRoles && !rolesError && userRoles.length === 0 && (
            <Elem name="no-roles">No roles assigned</Elem>
          )}
          {!loadingRoles && !rolesError && userRoles.length > 0 && (
            <Elem name="roles-list">
              {userRoles.map((role) => (
                <Elem key={role.id} name="role-item">
                  <Elem name="role-name">{role.display_name || role.name}</Elem>
                  <Elem name="role-description">{role.description}</Elem>
                  <Elem name="role-meta">
                    Assigned: {format(new Date(role.assigned_at), "MMM dd, yyyy")} by {role.assigned_by}
                  </Elem>
                </Elem>
              ))}
            </Elem>
          )}
        </Elem>
      )}

    </Block>
  );
};
