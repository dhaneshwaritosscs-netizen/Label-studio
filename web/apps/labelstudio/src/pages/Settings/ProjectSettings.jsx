import React, { useState, useEffect, useContext } from "react";
import { ApiContext } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useUserRoles } from "../../hooks/useUserRoles";
import { Block, Elem } from "../../utils/bem";
import "./settings.scss";

export const ProjectSettings = () => {
  const api = useContext(ApiContext);
  const { user } = useCurrentUser();
  const { hasRole } = useUserRoles();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  // Determine user role
  const isAdmin = hasRole('admin');
  const isClient = hasRole('client') || (!isAdmin && user); // Default to client if not admin

  // Fetch projects based on user role
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch projects based on user role
        const projectsResponse = await api.callApi("projects", {
          params: {
            show_all: isAdmin, // Admin sees all projects, client sees only their own
            page_size: 1000,
            include: "id,title,description,created_by,created_at,is_published,task_number,total_annotations_number,finished_task_number,color"
          }
        });

        if (projectsResponse.results) {
          let filteredProjects = projectsResponse.results;

          // For client users, filter to only show their own projects
          if (isClient && !isAdmin) {
            filteredProjects = projectsResponse.results.filter(project => 
              project.created_by?.id === user.id || project.created_by?.email === user.email
            );
          }

          setProjects(filteredProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, api, isAdmin, isClient]);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleCloseProjectDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    if (selectedProject) {
      // Navigate to project settings or open edit modal
      window.location.href = `/projects/${selectedProject.id}/settings`;
    }
  };

  if (loading) {
    return (
      <Block name="project-settings">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          fontSize: "18px",
          color: "#6b7280"
        }}>
          Loading projects...
        </div>
      </Block>
    );
  }

  if (error) {
    return (
      <Block name="project-settings">
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          color: "#dc2626"
        }}>
          {error}
        </div>
      </Block>
    );
  }

  return (
    <Block name="project-settings">
      <Elem name="header">
        <h1>Projects</h1>
        <p>Total number of projects across all users.</p>
      </Elem>

      <Elem name="content">
        {projects.length === 0 ? (
          <div style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>
              📁
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#374151",
              margin: "0 0 8px 0"
            }}>
              No Projects Found
            </h3>
            <p style={{
              fontSize: "16px",
              margin: "0"
            }}>
              {isClient ? "You haven't created any projects yet." : "No projects found in the system."}
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden"
          }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 120px 120px 120px",
              gap: "16px",
              padding: "16px 20px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151"
            }}>
              <div>ID</div>
              <div>Project Name</div>
              <div>Created By</div>
              <div>Created At</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            <div style={{
              maxHeight: "600px",
              overflowY: "auto"
            }}>
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 120px 120px 120px",
                    gap: "16px",
                    padding: "16px 20px",
                    borderBottom: index < projects.length - 1 ? "1px solid #f3f4f6" : "none",
                    fontSize: "14px",
                    alignItems: "center",
                    transition: "background-color 0.2s ease",
                    cursor: "pointer"
                  }}
                  onClick={() => handleProjectClick(project)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* ID */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: project.color || "#1a1a1a",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      TS
                    </div>
                    <span style={{ fontWeight: "600" }}>TS {project.id}</span>
                  </div>

                  {/* Project Name */}
                  <div>
                    <div style={{
                      color: "#2563eb",
                      fontWeight: "600",
                      marginBottom: "4px"
                    }}>
                      {project.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#6b7280"
                    }}>
                      {project.description || "No description"}
                    </div>
                  </div>

                  {/* Created By */}
                  <div style={{
                    color: "#6b7280"
                  }}>
                    {project.created_by?.first_name && project.created_by?.last_name 
                      ? `${project.created_by.first_name} ${project.created_by.last_name}`
                      : project.created_by?.email || "Unknown"
                    }
                  </div>

                  {/* Created At */}
                  <div style={{
                    color: "#6b7280"
                  }}>
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : "Unknown"}
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project);
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#6366f1",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#4f46e5";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#6366f1";
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Elem>

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a",
                margin: "0"
              }}>
                Project Details
              </h3>
              <button
                onClick={handleCloseProjectDetails}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "4px"
                }}
              >
                ×
              </button>
            </div>

            {/* Project Information */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <div>
                <label style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "4px",
                  display: "block"
                }}>
                  Project Name
                </label>
                <div style={{
                  fontSize: "16px",
                  color: "#1a1a1a",
                  padding: "8px 12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb"
                }}>
                  {selectedProject.title}
                </div>
              </div>

              <div>
                <label style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "4px",
                  display: "block"
                }}>
                  Description
                </label>
                <div style={{
                  fontSize: "16px",
                  color: "#1a1a1a",
                  padding: "8px 12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  minHeight: "60px"
                }}>
                  {selectedProject.description || "No description provided"}
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                    display: "block"
                  }}>
                    Created By
                  </label>
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedProject.created_by?.first_name && selectedProject.created_by?.last_name 
                      ? `${selectedProject.created_by.first_name} ${selectedProject.created_by.last_name}`
                      : selectedProject.created_by?.email || "Unknown"
                    }
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                    display: "block"
                  }}>
                    Created At
                  </label>
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : "Unknown"}
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                    display: "block"
                  }}>
                    Total Tasks
                  </label>
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedProject.task_number || 0}
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                    display: "block"
                  }}>
                    Finished Tasks
                  </label>
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedProject.finished_task_number || 0}
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                    display: "block"
                  }}>
                    Total Annotations
                  </label>
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedProject.total_annotations_number || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button
                onClick={handleCloseProjectDetails}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
              {isAdmin && (
                <button
                  onClick={handleEditProject}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Edit Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Block>
  );
};

ProjectSettings.menuItem = "Projects";
ProjectSettings.path = "/projects";
ProjectSettings.exact = true;
