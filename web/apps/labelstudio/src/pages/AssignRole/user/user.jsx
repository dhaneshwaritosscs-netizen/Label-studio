import React, { useState, useRef, useEffect } from "react";
import { Block, Elem } from "../../../utils/bem";
import { Button } from "../../../components";
import { IconCheck, IconUser, IconSettings, IconChevronDown, IconPersonInCircle } from "@humansignal/icons";
import { useAPI } from "../../../providers/ApiProvider";
import { useCurrentUser } from "../../../providers/CurrentUser";
import { useUserRoles } from "../../../hooks/useUserRoles";
import { ManageUsersPage } from "../../../components/ManageUsersPage/ManageUsersPage";
import { TopNavigationBar } from "../../../components/TopNavigationBar";
import "./user.scss";

export const AssignRole = () => {
  const api = useAPI();
  const { user } = useCurrentUser();
  const { hasRole } = useUserRoles();
  const [email, setEmail] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showUsersPage, setShowUsersPage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [existingUserRoles, setExistingUserRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);

  // Determine user role
  const isAdmin = hasRole('admin') || user?.email === 'dhaneshwari.tosscss@gmail.com';
  const isClient = !isAdmin && user;

  // Auto-populate email from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const roleOptions = [
    { id: "general", label: "General", description: "General access to basic features" },
    { id: "labeler", label: "Labeler", description: "Access to labeling tools, interface, and annotation features", combinedRoles: ["labeling-interface", "annotation"] },
    { id: "qcr", label: "QCR", description: "Access to QCR settings and quality control features" },
    { id: "model", label: "Model", description: "Access to ML models and predictions" },
    { id: "predictions", label: "Predictions", description: "View and manage model predictions" },
    { id: "cloud-storage", label: "Cloud Storage", description: "Access to cloud storage settings" },
    { id: "webhooks", label: "Webhooks", description: "Configure and manage webhooks" },
    { id: "danger-zone", label: "Danger Zone", description: "Critical system settings and operations" },
    
  ];

  // Fetch available users based on user role
  const fetchAvailableUsers = async () => {
    if (!user) return;
    
    try {
      setUsersLoading(true);
      const response = await api.callApi("listRoleBasedUsers", {
        params: { page: 1, page_size: 1000 }
      });
      
      if (response.results) {
        setAvailableUsers(response.results);
        console.log("Available users for role assignment:", response.results.length);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch available projects created by admin or assigned to client
  const fetchAvailableProjects = async () => {
    if (!user) return;
    
    try {
      setProjectsLoading(true);
      const response = await api.callApi("projects", {
        params: { 
          show_all: true,
          page_size: 1000,
          include: "id,title,description,created_by"
        }
      });
      
      if (response.results) {
        if (isAdmin) {
          // For admin: show projects created by the current admin user
          const adminProjects = response.results.filter(project => 
            project.created_by?.id === user.id
          );
          setAvailableProjects(adminProjects);
          console.log("Available projects for admin assignment:", adminProjects.length);
        } else if (isClient) {
          // For client: show projects assigned to this client by admin
          const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
          const clientProjectAssignments = userProjectAssignments[user.id] || [];
          
          const assignedProjects = response.results.filter(project => 
            clientProjectAssignments.includes(project.id)
          );
          setAvailableProjects(assignedProjects);
          console.log("Available projects for client assignment:", assignedProjects.length);
        }
      }
    } catch (error) {
      console.error("Error fetching available projects:", error);
      setAvailableProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setIsProjectDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch existing user roles
  const fetchExistingUserRoles = async (userEmail) => {
    if (!userEmail) return;
    
    try {
      setRolesLoading(true);
      console.log("Fetching roles for email:", userEmail);
      
      // Use direct fetch API to bypass any API provider issues
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/simple-user-roles/?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Fetch response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (data.user_roles) {
        const roleNames = data.user_roles.map(role => role.name.toLowerCase());
        console.log("Role names extracted:", roleNames);
        setExistingUserRoles(roleNames);
        // Initialize selected options with existing roles
        setSelectedOptions(roleNames);
        console.log("Existing user roles set:", roleNames);
      } else {
        console.log("No user_roles found in response");
        setExistingUserRoles([]);
        setSelectedOptions([]);
      }
    } catch (error) {
      console.error("Error fetching existing user roles:", error);
      setExistingUserRoles([]);
      setSelectedOptions([]);
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch available users and projects when component mounts
  useEffect(() => {
    fetchAvailableUsers();
    if (isAdmin || isClient) {
      fetchAvailableProjects();
    }
  }, [user, isAdmin, isClient]);

  // Fetch existing roles when email changes
  useEffect(() => {
    if (email.trim()) {
      fetchExistingUserRoles(email.trim());
    } else {
      setExistingUserRoles([]);
      setSelectedOptions([]);
    }
  }, [email]);

  // Debug state changes
  useEffect(() => {
    console.log("State update - existingUserRoles:", existingUserRoles);
    console.log("State update - selectedOptions:", selectedOptions);
  }, [existingUserRoles, selectedOptions]);

  // Persist which sub-page is open using URL hash
  useEffect(() => {
    if (window.location.hash === '#manage-users') {
      setShowUsersPage(true);
    }
  }, []);

  const openUsersPage = () => {
    setShowUsersPage(true);
    try {
      window.history.replaceState(null, '', '#manage-users');
    } catch (e) {
      // no-op
    }
  };

  const closeUsersPage = () => {
    setShowUsersPage(false);
    try {
      if (window.location.hash === '#manage-users') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {
      // no-op
    }
  };

  const handleOptionChange = (optionId) => {
    const isExistingRole = existingUserRoles.includes(optionId);
    const isCurrentlySelected = selectedOptions.includes(optionId);
    
    // Find the role option to check for combined roles
    const roleOption = roleOptions.find(option => option.id === optionId);
    const hasCombinedRoles = roleOption && roleOption.combinedRoles;
    
    if (hasCombinedRoles) {
      // Handle combined roles (like Labeler)
      const combinedRoleIds = roleOption.combinedRoles;
      const hasAnyCombinedRole = combinedRoleIds.some(roleId => 
        existingUserRoles.includes(roleId) || selectedOptions.includes(roleId)
      );
      
      if (hasAnyCombinedRole) {
        // If any combined role is assigned, remove all combined roles (unassign)
        setSelectedOptions(prev => prev.filter(id => !combinedRoleIds.includes(id)));
      } else {
        // If no combined roles are assigned, add all combined roles (assign)
        setSelectedOptions(prev => {
          const newOptions = [...prev];
          combinedRoleIds.forEach(roleId => {
            if (!newOptions.includes(roleId)) {
              newOptions.push(roleId);
            }
          });
          return newOptions;
        });
      }
    } else {
      // Handle single roles (existing logic)
      if (isExistingRole && !isCurrentlySelected) {
        // If it's an existing role and not in selected options, add it to selected
        // This means we're keeping the existing role
        setSelectedOptions(prev => [...prev, optionId]);
      } else if (isExistingRole && isCurrentlySelected) {
        // If it's an existing role and currently selected, remove it
        // This means we're unassigning the existing role
        setSelectedOptions(prev => prev.filter(id => id !== optionId));
      } else {
        // For new roles, toggle normally
        setSelectedOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
      }
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleProjectDropdown = () => {
    setIsProjectDropdownOpen(!isProjectDropdownOpen);
  };

  const handleProjectSelection = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (selectedOptions.length === 0 && selectedProjects.length === 0) {
      setError(isAdmin ? "Please select at least one role option or project" : "Please select at least one role option or project to assign");
      return;
    }

    // Check if the email belongs to an available user
    const emailExists = availableUsers.some(({ user: userData }) => 
      userData.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!emailExists) {
      if (isClient) {
        setError("You can only assign roles to users you created. Please use the 'Add User' button in Manage Users to create users first.");
      } else {
        setError("User not found in available users list");
      }
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // First test server connection with direct fetch
      console.log("Testing server connection...");
      try {
        const baseUrl = window.location.origin;
        const healthResponse = await fetch(`${baseUrl}/api/server-response/`);
        const healthData = await healthResponse.json();
        console.log("Health check response:", healthData);
      } catch (healthErr) {
        console.warn("Health check failed:", healthErr);
      }

      // Use direct fetch API to bypass any API provider issues
      console.log("Making direct API call...");
      
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/role-assignment-enhanced/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || '',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          email: email.trim(),
          selected_roles: selectedOptions.map(roleId => {
            // Find the role option to check if it has combined roles
            const roleOption = roleOptions.find(option => option.id === roleId);
            if (roleOption && roleOption.combinedRoles) {
              // Return the combined roles instead of the single role
              return roleOption.combinedRoles;
            }
            return roleId;
          }).flat(), // Flatten the array in case of combined roles
          selected_projects: selectedProjects.length > 0 ? selectedProjects.map(id => parseInt(id)) : []
        })
      });

      console.log("Fetch response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the status code
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      // Check if response is null or undefined
      if (!data) {
        throw new Error("No response data received from server");
      }

      if (data.status === 'success' || data.success) {
        setLoading(false);
        setSuccess(true);
        
        // Show detailed success message
        const assignedCount = data.assigned_roles?.length || 0;
        const unassignedCount = data.unassigned_roles?.length || 0;
        
        if (assignedCount > 0 && unassignedCount > 0) {
          console.log(`Successfully assigned ${assignedCount} roles and unassigned ${unassignedCount} roles`);
        } else if (assignedCount > 0) {
          console.log(`Successfully assigned ${assignedCount} roles`);
        } else if (unassignedCount > 0) {
          console.log(`Successfully unassigned ${unassignedCount} roles`);
        }
        
        // Update localStorage with project assignments (same as ManageUsersPage)
        if (selectedProjects.length > 0) {
          try {
            // Get the user data for the assigned email
            const assignedUser = availableUsers.find(({ user: userData }) => 
              userData.email.toLowerCase() === email.trim().toLowerCase()
            );
            
            if (assignedUser) {
              // Create ProjectMember entries for each assigned project (same as ManageUsersPage)
              for (const projectId of selectedProjects) {
                try {
                  await api.callApi("projectMembers", {
                    method: "POST",
                    body: {
                      user: assignedUser.user.id,
                      project: parseInt(projectId),
                      enabled: true
                    }
                  });
                } catch (memberError) {
                  console.log(`ProjectMember might already exist for project ${projectId}:`, memberError);
                  // Continue even if ProjectMember already exists
                }
              }
              
              // Get current userProjectAssignments from localStorage
              const currentAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
              const existingUserAssignments = currentAssignments[assignedUser.user.id] || [];
              const newProjectIds = selectedProjects.map(id => parseInt(id));
              
              // Merge existing assignments with new ones (avoid duplicates)
              const mergedAssignments = [...new Set([...existingUserAssignments, ...newProjectIds])];
              
              // Update assignments for the user
              const newAssignments = {
                ...currentAssignments,
                [assignedUser.user.id]: mergedAssignments
              };
              
              // Save to localStorage
              localStorage.setItem('userProjectAssignments', JSON.stringify(newAssignments));
              
              // Also save client assignment tracking (same as ManageUsersPage)
              const clientAssignments = JSON.parse(localStorage.getItem('clientUserAssignments') || '{}');
              const currentClientId = user?.id;
              
              if (currentClientId && isClient) {
                // Track which client assigned which users to which projects
                if (!clientAssignments[currentClientId]) {
                  clientAssignments[currentClientId] = {};
                }
                
                // For each project, track which users this client assigned
                selectedProjects.forEach(projectId => {
                  if (!clientAssignments[currentClientId][projectId]) {
                    clientAssignments[currentClientId][projectId] = [];
                  }
                  if (!clientAssignments[currentClientId][projectId].includes(assignedUser.user.id)) {
                    clientAssignments[currentClientId][projectId].push(assignedUser.user.id);
                  }
                });
                
                localStorage.setItem('clientUserAssignments', JSON.stringify(clientAssignments));
              }
              
              console.log(`Updated localStorage with ${selectedProjects.length} project assignments for user ${assignedUser.user.email}`);
            }
          } catch (error) {
            console.error('Error updating localStorage with project assignments:', error);
          }
        }
        
        setEmail("");
        setSelectedOptions([]);
        setExistingUserRoles([]);
        setSelectedProjects([]);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        throw new Error(data.message || data.error || "Failed to assign roles");
      }
      
    } catch (err) {
      setLoading(false);
      console.error("Role assignment error:", err);
      setError(err.message || "An error occurred while assigning roles. Please try again.");
    }
  };


  // If showing users page, render it instead of the assign role form
  if (showUsersPage) {
    return <ManageUsersPage onClose={closeUsersPage} />;
  }

  return (
    <Block name="assign-role-page">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}>
        {/* Top Navigation Bar */}
        <TopNavigationBar />
        
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: "0",
            right: "0",
          }}>
            <button
              onClick={openUsersPage}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#6b7280",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.color = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }}
              title="View All Users"
            >
              <IconPersonInCircle style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Manage User</span>
            </button>
          </div>
          
          <h1 style={{
            fontSize: "36px",
            fontWeight: "700",
            margin: "0 0 16px",
            background: "linear-gradient(135deg, #2d3748, #4a5568)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Assign Role
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: "#4a5568",
            margin: "0",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.6",
          }}>
            {isClient 
              ? "Assign specific roles and permissions to users you created" 
              : "Assign specific roles and permissions to users by email"
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              background: "#ef4444",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}>
              !
            </div>
            <div>
              <div style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#dc2626",
                marginBottom: "4px",
              }}>
                Error
              </div>
              <div style={{
                fontSize: "14px",
                color: "#991b1b",
              }}>
                {error}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#dc2626",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              background: "#22c55e",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}>
              ✓
            </div>
            <div>
              <div style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#16a34a",
                marginBottom: "4px",
              }}>
                Success
              </div>
              <div style={{
                fontSize: "14px",
                color: "#15803d",
              }}>
                Roles have been assigned successfully!
              </div>
            </div>
            <button
              onClick={() => setSuccess(false)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#16a34a",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading indicator for users */}
        {usersLoading && (
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #3b82f6",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}></div>
            <div style={{
              fontSize: "14px",
              color: "#0369a1",
            }}>
              Loading available users...
            </div>
          </div>
        )}

        {/* Main Form */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}>
          {/* Email Input */}
          <div style={{
            marginBottom: "32px",
          }}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isClient ? "Enter email of user you created" : "Enter user's email address"}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              
              {/* User suggestions dropdown */}
              {email.length > 0 && availableUsers.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflowY: "auto",
                  marginTop: "4px",
                }}>
                  {availableUsers
                    .filter(({ user: userData }) => 
                      userData.email.toLowerCase().includes(email.toLowerCase())
                    )
                    .slice(0, 5) // Show max 5 suggestions
                    .map(({ user: userData }) => (
                      <div
                        key={userData.id}
                        onClick={() => setEmail(userData.email)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                        }}
                      >
                        <div style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                        }}>
                          {userData.email}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}>
                          {userData.first_name} {userData.last_name}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Available users info */}
            {isClient && availableUsers.length > 0 && (
              <div style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#6b7280",
              }}>
                You can assign roles to {availableUsers.length} user{availableUsers.length !== 1 ? 's' : ''} you created
              </div>
            )}
          </div>

          {/* Role Options Dropdown */}
          <div style={{
            marginBottom: "32px",
            position: "relative",
          }} ref={dropdownRef}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "16px",
            }}>
              Select Role Options
            </label>
            
            {/* Dropdown Button */}
            <div
              onClick={toggleDropdown}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
                minHeight: "48px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                color: selectedOptions.length > 0 ? "#374151" : "#9ca3af",
                fontSize: "16px",
              }}>
                {selectedOptions.length > 0 
                  ? `${selectedOptions.length} option${selectedOptions.length > 1 ? 's' : ''} selected`
                  : "Click to select role options"
                }
              </div>
              <IconChevronDown style={{
                width: "20px",
                height: "20px",
                color: "#6b7280",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }} />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: "0",
                right: "0",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                maxHeight: "300px",
                overflowY: "auto",
                marginTop: "4px",
              }}>
                {rolesLoading && (
                  <div style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #3b82f6",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}></div>
                    Loading existing roles...
                  </div>
                )}
                {roleOptions.filter((option) => {
                  // Show all options only for dhaneshwari.tosscss@gmail.com
                  // For other users, show "Labeler" and "QCR" options
                  if (user?.email === "dhaneshwari.tosscss@gmail.com") {
                    return true; // Show all options
                  } else {
                    return option.id === "labeler" || option.id === "qcr"; // Show Labeler and QCR for other users
                  }
                }).map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  const isExisting = existingUserRoles.includes(option.id);
                  
                  // Handle combined roles (like Labeler)
                  let isChecked = isSelected || isExisting;
                  if (option.combinedRoles) {
                    const hasAnyCombinedRole = option.combinedRoles.some(roleId => 
                      existingUserRoles.includes(roleId) || selectedOptions.includes(roleId)
                    );
                    isChecked = hasAnyCombinedRole;
                  }
                  
                  console.log(`Role ${option.id}: isSelected=${isSelected}, isExisting=${isExisting}, isChecked=${isChecked}`);
                  
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleOptionChange(option.id)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <div style={{
                        width: "18px",
                        height: "18px",
                        border: isChecked ? "2px solid #3b82f6" : "2px solid #d1d5db",
                        borderRadius: "4px",
                        background: isChecked ? "#3b82f6" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}>
                        {isChecked && (
                          <IconCheck style={{
                            width: "10px",
                            height: "10px",
                            color: "#ffffff",
                          }} />
                        )}
                      </div>
                    
                    <div style={{
                      flex: 1,
                    }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        {option.label}
                        {(existingUserRoles.includes(option.id) || 
                          (option.combinedRoles && option.combinedRoles.some(roleId => existingUserRoles.includes(roleId)))) && (
                          <span style={{
                            fontSize: "10px",
                            color: "#059669",
                            backgroundColor: "#d1fae5",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "600",
                          }}>
                            Already Assigned
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project Assignment Dropdown - For Admin and Client */}
          {(isAdmin || isClient) && (
            <div style={{
              marginBottom: "32px",
              position: "relative",
            }} ref={projectDropdownRef}>
              <label style={{
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "16px",
              }}>
                {isAdmin ? "Assign Project" : "Assign Project to User"}
              </label>
              
              {/* Project Dropdown Button */}
              <div
                onClick={toggleProjectDropdown}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  minHeight: "48px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  color: selectedProjects.length > 0 ? "#374151" : "#9ca3af",
                  fontSize: "16px",
                }}>
                  {selectedProjects.length > 0 
                    ? `${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''} selected`
                    : isAdmin ? "Click to select projects" : "Click to select projects to assign"
                  }
                </div>
                <IconChevronDown style={{
                  width: "20px",
                  height: "20px",
                  color: "#6b7280",
                  transform: isProjectDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }} />
              </div>

              {/* Project Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginTop: "4px",
                }}>
                  {projectsLoading && (
                    <div style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}>
                      <div style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #3b82f6",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}></div>
                      Loading projects...
                    </div>
                  )}
                  {availableProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => {
                        handleProjectSelection(project.id.toString());
                      }}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <div style={{
                        width: "18px",
                        height: "18px",
                        border: selectedProjects.includes(project.id.toString()) ? "2px solid #3b82f6" : "2px solid #d1d5db",
                        borderRadius: "4px",
                        background: selectedProjects.includes(project.id.toString()) ? "#3b82f6" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}>
                        {selectedProjects.includes(project.id.toString()) && (
                          <IconCheck style={{
                            width: "10px",
                            height: "10px",
                            color: "#ffffff",
                          }} />
                        )}
                      </div>
                      
                      <div style={{
                        flex: 1,
                      }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "2px",
                        }}>
                          {project.title}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}>
                          {project.description || "No description"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!projectsLoading && availableProjects.length === 0 && (
                    <div style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}>
                      {isAdmin ? "No projects found" : "No projects assigned to you"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !email.trim() || (selectedOptions.length === 0 && selectedProjects.length === 0)}
            look="primary"
            size="large"
            style={{
              width: "100%",
              background: "#3b82f6",
              border: "none",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              opacity: (!email.trim() || (selectedOptions.length === 0 && selectedProjects.length === 0)) ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && email.trim() && (selectedOptions.length > 0 || selectedProjects.length > 0)) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email.trim() && (selectedOptions.length > 0 || selectedProjects.length > 0)) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
          >
            {loading ? "Assigning Roles..." : "Assign Roles"}
          </Button>
        </div>

        {/* Summary */}
        {(selectedOptions.length > 0 || selectedProjects.length > 0) && (
          <div style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bae6fd",
          }}>
            {selectedOptions.length > 0 && (
              <div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#0369a1",
                  marginBottom: "8px",
                }}>
                  Selected Roles ({selectedOptions.length}):
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#0c4a6e",
                  marginBottom: selectedProjects.length > 0 ? "12px" : "0",
                }}>
                  {selectedOptions.map(id => roleOptions.find(opt => opt.id === id)?.label).join(", ")}
                </div>
              </div>
            )}
            {selectedProjects.length > 0 && (
              <div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#0369a1",
                  marginBottom: "8px",
                }}>
                  Selected Projects ({selectedProjects.length}):
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#0c4a6e",
                }}>
                  {selectedProjects.map(projectId => 
                    availableProjects.find(p => p.id.toString() === projectId)?.title
                  ).join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Block>
  );
};

AssignRole.title = "User Role Assignment";
AssignRole.path = "/user-role-assignment";
AssignRole.exact = true;
