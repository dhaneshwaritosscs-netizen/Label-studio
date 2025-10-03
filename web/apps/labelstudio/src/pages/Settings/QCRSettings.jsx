import { useState, useEffect } from "react";
import { useProject } from "../../providers/ProjectProvider";
import { useUserRoles } from "../../hooks/useUserRoles";
import { useAPI } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../../components";
import "./access-denied.scss";

export const QCRSettings = () => {
  const { project } = useProject();
  const { hasRole, loadingRoles } = useUserRoles();
  const api = useAPI();
  const { user } = useCurrentUser();

  const [assignedProjects, setAssignedProjects] = useState([]);
  const [projectUsers, setProjectUsers] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch assigned projects for the current user
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!user?.email) return;
      
      try {
        setLoadingProjects(true);
        
        // Get user project assignments from localStorage
        const saved = localStorage.getItem('userProjectAssignments');
        if (saved) {
          const userProjectAssignments = JSON.parse(saved);
          const currentUserAssignments = userProjectAssignments[user.id] || [];
          
          if (currentUserAssignments.length > 0) {
            // Fetch project details for assigned projects
            const projectsResponse = await api.callApi("projects", {
              params: {
                show_all: true,
                page_size: 1000,
                include: "id,title,description,created_by,created_at,is_published,task_number,total_annotations_number,finished_task_number,color"
              }
            });
            
            if (projectsResponse.results) {
              const filteredProjects = projectsResponse.results.filter(project => 
                currentUserAssignments.includes(project.id)
              );
              setAssignedProjects(filteredProjects);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
        setAssignedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchAssignedProjects();
  }, [user, api]);

  // Fetch users for each assigned project
  useEffect(() => {
    const fetchProjectUsers = async () => {
      if (assignedProjects.length === 0) return;
      
      try {
        setLoadingUsers(true);
        const usersData = {};
        
        // Get user project assignments from localStorage
        const saved = localStorage.getItem('userProjectAssignments');
        if (!saved) {
          setProjectUsers({});
          return;
        }
        
        const userProjectAssignments = JSON.parse(saved);
        const userInfoCache = JSON.parse(localStorage.getItem('userInfoCache') || '{}');
        
        for (const project of assignedProjects) {
          try {
            // Find users assigned to this project
            const assignedUserIds = [];
            Object.keys(userProjectAssignments).forEach(userId => {
              const userAssignments = userProjectAssignments[userId] || [];
              if (userAssignments.includes(project.id)) {
                assignedUserIds.push(userId);
              }
            });
            
            // Get user details from cache or fetch from API
            const users = [];
            for (const userId of assignedUserIds) {
              if (userInfoCache[userId]) {
                users.push(userInfoCache[userId]);
              } else {
                try {
                  // Fetch user details from API
                  const userResponse = await api.callApi("users", {
                    params: { id: userId }
                  });
                  if (userResponse && userResponse.results && userResponse.results.length > 0) {
                    const userData = userResponse.results[0];
                    users.push(userData);
                    // Cache the user data
                    userInfoCache[userId] = userData;
                  }
                } catch (error) {
                  console.error(`Error fetching user ${userId}:`, error);
                }
              }
            }
            
            // Add project creator if not already in the list
            if (project.created_by) {
              const creatorAlreadyInList = users.some(user => user.id === project.created_by.id);
              if (!creatorAlreadyInList) {
                users.push(project.created_by);
              }
            }
            
            usersData[project.id] = users;
          } catch (error) {
            console.error(`Error fetching users for project ${project.id}:`, error);
            usersData[project.id] = [];
          }
        }
        
        // Update cache
        localStorage.setItem('userInfoCache', JSON.stringify(userInfoCache));
        setProjectUsers(usersData);
      } catch (error) {
        console.error("Error fetching project users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchProjectUsers();
  }, [assignedProjects, api]);

  // Check if user has QCR role
  if (loadingRoles) {
    return (
      <Block name="qcr-settings">
        <Elem name="loading">Loading QCR settings...</Elem>
      </Block>
    );
  }

  if (!hasRole('qcr')) {
    return (
      <Block name="qcr-settings">
        <Elem name="access-denied">
          <h1>Access Denied</h1>
          <p>You don't have permission to access QCR settings.</p>
          <p>Contact your administrator to request the 'qcr' role.</p>
        </Elem>
      </Block>
    );
  }

  if (!project.id) {
    return (
      <Block name="qcr-settings">
        <Elem name="no-project">
          <h2>No Project Selected</h2>
          <p>Please select a project to configure QCR settings.</p>
        </Elem>
      </Block>
    );
  }


  return (
    <Block name="qcr-settings">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "700", 
            color: "#1a1a1a", 
            marginBottom: "8px" 
          }}>
            User Details
          </h1>
          <p style={{ 
            fontSize: "16px", 
            color: "#6b7280", 
            marginBottom: "24px" 
          }}>
            Quality Control and Review for your assigned projects
          </p>
        </div>

        {/* Assigned Projects Section */}
        <div style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "20px" 
          }}>
            Your Assigned Projects
          </h2>

          {loadingProjects ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b7280"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                border: "3px solid #3b82f6",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px"
              }}></div>
              Loading assigned projects...
            </div>
          ) : assignedProjects.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b7280"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                No Projects Assigned
              </h3>
              <p>You don't have any projects assigned yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {assignedProjects.map((assignedProject) => (
                <div
                  key={assignedProject.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "20px",
                    backgroundColor: "#f9fafb"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px"
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "4px"
                      }}>
                        {assignedProject.title}
                      </h3>
                      <p style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "8px"
                      }}>
                        Project ID: {assignedProject.id}
                      </p>
                      <p style={{
                        fontSize: "14px",
                        color: "#6b7280"
                      }}>
                        {assignedProject.description || "No description available"}
                      </p>
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center"
                    }}>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: assignedProject.color || "#3b82f6",
                        borderRadius: "50%"
                      }}></div>
                      <span style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        TS {assignedProject.id}
                      </span>
                    </div>
                  </div>

                  {/* Project Statistics */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px"
                  }}>
                    <div style={{
                      backgroundColor: "#ffffff",
                      padding: "12px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#059669",
                        marginBottom: "4px"
                      }}>
                        {assignedProject.task_number || 0}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        Total Tasks
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: "#ffffff",
                      padding: "12px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#dc2626",
                        marginBottom: "4px"
                      }}>
                        {assignedProject.finished_task_number || 0}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        Finished Tasks
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: "#ffffff",
                      padding: "12px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#2563eb",
                        marginBottom: "4px"
                      }}>
                        {assignedProject.total_annotations_number || 0}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        Total Annotations
                      </div>
                    </div>
                  </div>

                  {/* Users Working on Project */}
                  <div>
                    <h4 style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "12px"
                    }}>
                      Users Working on This Project
                    </h4>
                    
                    {loadingUsers ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "14px"
                      }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid #3b82f6",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}></div>
                        Loading users...
                      </div>
                    ) : (
                      <div>
                        {projectUsers[assignedProject.id] && projectUsers[assignedProject.id].length > 0 ? (
                          <div style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "12px"
                          }}>
                            <div style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#059669",
                              marginBottom: "8px"
                            }}>
                              {projectUsers[assignedProject.id].length} user{projectUsers[assignedProject.id].length !== 1 ? 's' : ''} working on this project
                            </div>
                            <div style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "12px"
                            }}>
                              {projectUsers[assignedProject.id].map((user, index) => (
                                <div
                                  key={index}
                                  style={{
                                    backgroundColor: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "4px",
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    color: "#0369a1",
                                    fontWeight: "500"
                                  }}
                                >
                                  {user.email || user.username || `User ${index + 1}`}
                                </div>
                              ))}
                            </div>
                            <div style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontStyle: "italic"
                            }}>
                              These are the users assigned to work on this project
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            padding: "12px",
                            textAlign: "center"
                          }}>
                            <div style={{
                              fontSize: "14px",
                              color: "#dc2626",
                              fontWeight: "500"
                            }}>
                              No users assigned to this project
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit Project Button */}
                  <div style={{
                    marginTop: "16px",
                    textAlign: "right"
                  }}>
                    <button
                        onClick={() => {
                          // Navigate to project edit page
                          window.location.href = `/projects/${assignedProject.id}`;
                        }}
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#3b82f6";
                      }}
                    >
                      Edit Project Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Block>
  );
};

QCRSettings.title = "User Details";
QCRSettings.path = "/qcr";
