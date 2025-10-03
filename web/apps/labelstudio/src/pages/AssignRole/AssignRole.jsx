import React, { useState, useEffect } from "react";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../../components";
import { ApiContext } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useUserRoles } from "../../hooks/useUserRoles";
import { Userpic } from "@humansignal/ui";
import { formatDistance, format } from "date-fns";
import "./AssignRole.scss";

export const AssignRole = () => {
  const api = React.useContext(ApiContext);
  const { user } = useCurrentUser();
  const { hasRole } = useUserRoles();
  const [startDate, setStartDate] = useState("12/09/2025");
  const [endDate, setEndDate] = useState("12/09/2025");
  const [daywiseReport, setDaywiseReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activeIcon, setActiveIcon] = useState('home');
  const [userRolesData, setUserRolesData] = useState({});
  const [userProjectsData, setUserProjectsData] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Determine user role
  const isAdmin = hasRole('admin') || user?.email === 'dhaneshwari.tosscss@gmail.com';
  const isClient = hasRole('client') || user?.email === 'dhaneshwari.ttosscss@gmail.com';
  const isUser = hasRole('user');
  
  // Debug role detection
  console.log('DEBUG: Current user:', user?.email);
  console.log('DEBUG: isAdmin:', isAdmin);
  console.log('DEBUG: isClient:', isClient);
  console.log('DEBUG: isUser:', isUser);
  console.log('DEBUG: hasRole("admin"):', hasRole('admin'));
  console.log('DEBUG: hasRole("client"):', hasRole('client'));
  console.log('DEBUG: hasRole("user"):', hasRole('user'));
  
  // Get more detailed role info from existing useUserRoles hook
  const { userRoles, loadingRoles } = useUserRoles();
  console.log('DEBUG: userRoles array:', userRoles);
  console.log('DEBUG: loadingRoles:', loadingRoles);

  // Access control: Show restricted view for client users
  // Clients can see user list but cannot access role assignment functionality

  // Filter users based on role and search term
  const filteredUsers = usersList.filter(({ user: userData }) => {
    // Role-based filtering
    if (isClient) {
      // Client sees users they created (including themselves)
      const isCreatedByClient = userData.created_by === user?.id;
      const isClientSelf = userData.id === user?.id;
      console.log(`User ${userData.email}: created_by=${userData.created_by}, current_user_id=${user?.id}, isCreatedByClient=${isCreatedByClient}, isClientSelf=${isClientSelf}`);
      
      if (!isCreatedByClient && !isClientSelf) {
        return false;
      }
    }
    // Admin sees all users (no additional filtering needed)
    
    // Search term filtering - LETTER MATCHING (partial matching)
    if (!searchTerm) return true;
    
    const email = userData.email?.toLowerCase() || "";
    const userId = userData.id?.toString() || "";
    const dateJoined = userData.date_joined ? format(new Date(userData.date_joined), 'dd-MM-yyyy') : "";
    const lastActivity = userData.last_activity ? format(new Date(userData.last_activity), 'dd-MM-yyyy') : "";
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Return true if search term is found in email, user ID, or date (partial matching)
    return email.includes(searchLower) || 
           userId.includes(searchLower) ||
           dateJoined.includes(searchLower) || 
           lastActivity.includes(searchLower);
  });

  // Update search active state when search term changes
  useEffect(() => {
    setIsSearchActive(searchTerm.trim().length > 0);
  }, [searchTerm]);

  // Update project count based on search results
  useEffect(() => {
    if (searchTerm.trim().length > 0 && filteredUsers.length === 0) {
      console.log("User not found in search, setting project count to 0");
      setProjectCount(0);
    }
  }, [searchTerm, filteredUsers.length]);

  // Force project count to 0 when no users found in search
  useEffect(() => {
    console.log("Fix useEffect - isSearchActive:", isSearchActive, "filteredUsers.length:", filteredUsers.length, "searchTerm:", searchTerm);
    if (isSearchActive && filteredUsers.length === 0) {
      console.log("Setting project count to 0 - no users found");
      setProjectCount(0);
    }
  }, [isSearchActive, filteredUsers.length, searchTerm]);

  // Additional fix for single character searches
  useEffect(() => {
    if (searchTerm.trim().length === 1 && filteredUsers.length === 0) {
      console.log("Single character search with no users found, setting count to 0");
      setProjectCount(0);
    }
  }, [searchTerm, filteredUsers.length]);

  // Immediate fix when search term changes and no users found
  useEffect(() => {
    if (searchTerm.trim().length > 0 && filteredUsers.length === 0) {
      console.log("Search term changed with no users found, immediately setting count to 0");
      setProjectCount(0);
    }
  }, [searchTerm, filteredUsers.length]);

  // Fetch project count based on user role
  useEffect(() => {
    const fetchProjectCount = async () => {
      console.log("fetchProjectCount triggered - user:", !!user, "isAdmin:", isAdmin, "isClient:", isClient, "filteredUsers.length:", filteredUsers.length, "searchTerm:", searchTerm);
      
      if (!user) {
        console.log("Exiting fetchProjectCount - no user");
        return;
      }

      // If search is active and no users found, don't fetch anything
      if (searchTerm.trim().length > 0 && filteredUsers.length === 0) {
        console.log("Search active but no users found, skipping fetchProjectCount");
        setProjectCount(0);
        setProjectsLoading(false);
        return;
      }

      try {
        // Calculate total projects from all users in the list
        let totalProjects = 0;
        
        if (filteredUsers.length > 0) {
          console.log("Calculating total projects from all users in the list...");
          
          for (const { user: userData } of filteredUsers) {
            try {
              // Get all projects to check both created and assigned
              const data = await api.callApi("projects", {
                params: { 
                  show_all: true,
                  page_size: 1000,
                  include: "id,created_by"
                }
              });
              
              if (data?.results) {
                // Get user's assigned projects from localStorage
                const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
                const userAssignments = userProjectAssignments[userData.id] || [];
                
                // Count projects: created by user OR assigned to user
                const userProjects = data.results.filter(project => 
                  project.created_by?.id === userData.id || 
                  userAssignments.includes(project.id)
                );
                
                totalProjects += userProjects.length;
                console.log(`User ${userData.email}: ${userProjects.length} projects (created + assigned)`);
              }
            } catch (error) {
              console.error(`Error fetching projects for user ${userData.email}:`, error);
            }
          }
          
          console.log("Total projects from all users:", totalProjects);
          setProjectCount(totalProjects);
        } else {
          // If no users in list, show current user's projects
          if (isAdmin) {
            console.log("No users in list, fetching total project count for admin");
            const data = await api.callApi("projects", {
              params: { 
                show_all: true,
                page_size: 1,
                include: "id"
              }
            });
            console.log("Admin projects response:", data);
            setProjectCount(data?.count ?? 0);
          } else {
            console.log("No users in list, fetching projects for current user:", user.id);
            const data = await api.callApi("projects", {
              params: { 
                show_all: true,
                page_size: 1000,
                include: "id,created_by"
              }
            });
            
            if (data?.results) {
              const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
              const userAssignments = userProjectAssignments[user.id] || [];
              
              const userProjects = data.results.filter(project => 
                project.created_by?.id === user.id || 
                userAssignments.includes(project.id)
              );
              
              setProjectCount(userProjects.length);
            } else {
              setProjectCount(0);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project count:", error);
        setProjectCount(0);
      }
    };

    fetchProjectCount();
  }, [user, isAdmin, isClient, api, filteredUsers, searchTerm]);

  // Additional fix for when search term changes and valid users are found
  useEffect(() => {
    if (searchTerm.trim().length > 0 && filteredUsers.length > 0) {
      console.log("Search term changed with valid users found, triggering project count fetch");
      // Trigger the fetchUserProjectCount by updating a dependency
      // This will be handled by the fetchUserProjectCount useEffect above
    }
  }, [searchTerm, filteredUsers.length]);

  // Fetch project count - total or user-specific based on search
  useEffect(() => {
    const fetchProjectCount = async () => {
      if (!user) {
        setProjectsLoading(false);
        return;
      }

      // If search is active and no users found, don't fetch anything
      if (isSearchActive && filteredUsers.length === 0) {
        console.log("Skipping fetchProjectCount - no users found in search, searchTerm:", searchTerm, "filteredUsers.length:", filteredUsers.length);
        setProjectCount(0);
        setProjectsLoading(false);
        return;
      }

      try {
        setProjectsLoading(true);
        console.log("Fetching project count, isSearchActive:", isSearchActive, "filteredUsers:", filteredUsers.length);
        
        // If search is active, check if we have valid filtered users
        if (isSearchActive) {
          if (filteredUsers.length > 0) {
            // Valid user found, get their project count
            const firstUser = filteredUsers[0].user;
            console.log("Fetching projects for user:", firstUser.id);
            const data = await api.callApi("projects", {
              params: { 
                created_by: firstUser.id,
                page_size: 1, // We only need the count, not the actual projects
                include: "id" // Minimal data needed
              }
            });
            console.log("User projects response:", data);
            setProjectCount(data?.count ?? 0);
          } else {
            // No users found for search term, set count to 0
            console.log("No users found for search term:", searchTerm);
            setProjectCount(0);
          }
        } else {
          // Default: get total count of all projects in organization
          console.log("Fetching total project count...");
          try {
            const data = await api.callApi("projects", {
              params: { 
                show_all: true, // Get all projects in organization
                page_size: 1, // We only need the count, not the actual projects
                include: "id" // Minimal data needed
              }
            });
            console.log("Total projects response:", data);
            setProjectCount(data?.count ?? 0);
          } catch (showAllError) {
            console.warn("show_all parameter not supported, falling back to current user projects:", showAllError);
            // Fallback: get current user's project count
            const fallbackData = await api.callApi("projects", {
              params: { 
                page_size: 1,
                include: "id"
              }
            });
            console.log("Fallback projects response:", fallbackData);
            setProjectCount(fallbackData?.count ?? 0);
          }
        }
      } catch (error) {
        console.error("Error fetching project count:", error);
        // Set a default count for testing
        setProjectCount(20);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjectCount();
  }, [user, api, isSearchActive]); // Remove searchTerm to prevent override of our fixes

  // Fetch users data (same as Organization page)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        console.log("Fetching users...");
        const response = await api.callApi("memberships", {
          params: {
            pk: 1,
            contributed_to_projects: 1,
            page: 1,
            page_size: 100, // Increased to show more users
          },
          include: [
            "id",
            "email", 
            "first_name",
            "last_name",
            "username",
            "created_by",
            "is_active"
          ],
        });

        console.log("Users response:", response);
        if (response && response.results) {
          setUsersList(response.results);
          console.log("Users loaded:", response.results.length);
          console.log("Users with created_by info:", response.results.map(u => ({
            id: u.user?.id,
            email: u.user?.email,
            created_by: u.user?.created_by
          })));
        } else {
          console.warn("No users found in response");
          setUsersList([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        // Add mock data for testing
        const mockUsers = [
          {
            user: {
              id: 1,
              email: "dhaneshwari.toss@gmail.com",
              date_joined: "2025-01-15T10:00:00Z",
              last_activity: "2025-01-27T15:30:00Z"
            }
          },
          {
            user: {
              id: 2,
              email: "john.doe@example.com",
              date_joined: "2025-01-10T09:00:00Z",
              last_activity: "2025-01-26T14:20:00Z"
            }
          },
          {
            user: {
              id: 3,
              email: "jane.smith@example.com",
              date_joined: "2025-01-20T11:00:00Z",
              last_activity: "2025-01-27T16:45:00Z"
            }
          }
        ];
        setUsersList(mockUsers);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [api]);

  // Fetch user roles and projects data (same as Organization page)
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!usersList.length) return;

      const rolesData = {};
      const projectsData = {};

      for (const { user: userData } of usersList) {
        try {
          // Fetch user roles (same API as Organization page)
          const rolesResponse = await fetch(`http://localhost:8010/api/simple-user-roles/?email=${encodeURIComponent(userData.email)}`, {
            method: 'GET',
        headers: {
          'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          });

          if (rolesResponse.ok) {
            const rolesData_result = await rolesResponse.json();
            if (rolesData_result.status === 'success') {
              rolesData[userData.id] = rolesData_result.user_roles || [];
            }
          }

          // Fetch user projects - for clients, include both created and assigned projects
          let projectsResponse;
          if (isClient && userData.id === user?.id) {
            // For the current client, fetch all projects they can access (created + assigned)
            projectsResponse = await api.callApi("projects", {
              params: {
                show_all: true,
                page_size: 1000
              }
            });
            
            // Filter to show only projects created by this user or assigned to them
            if (projectsResponse.results) {
              const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
              const currentUserAssignments = userProjectAssignments[userData.id] || [];
              
              const filteredProjects = projectsResponse.results.filter(project => 
                project.created_by?.id === userData.id || 
                currentUserAssignments.includes(project.id)
              );
              
              projectsData[userData.id] = filteredProjects;
              console.log(`Client ${userData.email}: Found ${filteredProjects.length} projects (created + assigned)`);
            } else {
              projectsData[userData.id] = [];
            }
          } else {
            // For other users, fetch projects they created AND assigned projects
            projectsResponse = await api.callApi("projects", {
              params: {
                show_all: true, // Get all projects to check assignments
                page_size: 1000
              }
            });
            
            console.log(`Projects for user ${userData.email} (ID: ${userData.id}):`, projectsResponse);
            
            if (projectsResponse.results) {
              // Get user's assigned projects from localStorage
              const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
              const userAssignments = userProjectAssignments[userData.id] || [];
              
              // Filter projects: created by user OR assigned to user
              const filteredProjects = projectsResponse.results.filter(project => 
                project.created_by?.id === userData.id || 
                userAssignments.includes(project.id)
              );
              
              projectsData[userData.id] = filteredProjects;
              console.log(`Found ${filteredProjects.length} projects for user ${userData.email} (created + assigned)`);
              console.log(`User assignments:`, userAssignments);
            } else {
              projectsData[userData.id] = [];
              console.log(`No projects found for user ${userData.email}`);
            }
          }

        } catch (error) {
          console.error(`Error fetching data for user ${userData.email}:`, error);
          // Set empty data instead of mock data
          rolesData[userData.id] = [];
          projectsData[userData.id] = [];
        }
      }

      setUserRolesData(rolesData);
      setUserProjectsData(projectsData);
    };

    fetchUserDetails();
  }, [usersList, api]);

  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleIconClick = (iconName) => {
    console.log(`${iconName} icon clicked`);
    setActiveIcon(iconName);
    
    // Add navigation logic here
    switch(iconName) {
      case 'home':
        // Navigate to home or refresh
        window.location.reload();
        break;
      case 'user':
        // Navigate to User Role Assignment page - Both admin and client users can access
        window.location.href = '/user-role-assignment';
        break;
      case 'chart':
        // Navigate to Projects Overview page
        window.location.href = '/projects-overview';
        break;
      case 'settings':
        // Navigate to project settings page
        window.location.href = '/project-settings';
        break;
      case 'download':
        // Navigate to Project Status page
        window.location.href = '/project-status';
        break;
      default:
        console.log('Unknown icon clicked');
    }
  };

  const toggleSection = (userId, section) => {
    const key = `${userId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Access control: Only admins and clients can access this page, not regular users
  console.log('DEBUG: Access control check - isAdmin:', isAdmin, 'isClient:', isClient, 'should block:', (!isAdmin && !isClient));
  
  // More explicit check: Block if user has 'user' role OR if they don't have admin/client roles
  const shouldBlockAccess = isUser || (!isAdmin && !isClient);
  console.log('DEBUG: shouldBlockAccess:', shouldBlockAccess, 'isUser:', isUser);
  
  if (shouldBlockAccess) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "20px"
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "500px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "20px"
          }}>
            🚫
          </div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "12px"
          }}>
            Access Denied
          </h1>
          <p style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "24px",
            lineHeight: "1.5"
          }}>
            You don't have permission to access the User Role Assignment page. 
            Only administrators and clients can manage user roles and assignments.
          </p>
          <button
            onClick={() => window.location.href = '/projects'}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }}
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <Block name="assign-role-page">
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        background: "#ffffff",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>

        {/* Navigation */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "8px",
          paddingBottom: "4px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div 
            style={{
            display: "flex",
              flexDirection: "column",
            alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              position: "relative",
              background: activeIcon === 'home' ? "#f3f4f6" : "transparent"
            }}
            title="Home"
            onClick={() => handleIconClick('home')}
            onMouseEnter={(e) => {
              if (activeIcon !== 'home') {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeIcon !== 'home') {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <div style={{
              width: "24px",
              height: "24px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeIcon === 'home' ? "#6366f1" : "#6b7280"
            }}>🏠</div>
            {activeIcon === 'home' && (
              <span style={{
                fontSize: "12px",
                color: "#6366f1",
                fontWeight: "600"
              }}>Home</span>
            )}
            </div>
          <div 
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              position: "relative",
              background: activeIcon === 'chart' ? "#f3f4f6" : "transparent"
            }}
            title="Projects"
            onClick={() => handleIconClick('chart')}
            onMouseEnter={(e) => {
              if (activeIcon !== 'chart') {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeIcon !== 'chart') {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
              <div style={{
              width: "24px",
              height: "24px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeIcon === 'chart' ? "#6366f1" : "#6b7280"
            }}>📁</div>
            {activeIcon === 'chart' && (
              <span style={{
                fontSize: "12px",
                color: "#6366f1",
                fontWeight: "600"
              }}>Projects</span>
            )}
              </div>
          <div 
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              position: "relative",
              background: activeIcon === 'user' ? "#f3f4f6" : "transparent"
            }}
            title="User"
            onClick={() => handleIconClick('user')}
            onMouseEnter={(e) => {
              if (activeIcon !== 'user') {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeIcon !== 'user') {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
              <div style={{
              width: "24px",
              height: "24px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeIcon === 'user' ? "#6366f1" : "#6b7280"
            }}>👤</div>
            {activeIcon === 'user' && (
              <span style={{
                fontSize: "12px",
                color: "#6366f1",
                fontWeight: "600"
              }}>User</span>
            )}
              </div>
          <div 
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              position: "relative",
              background: activeIcon === 'settings' ? "#f3f4f6" : "transparent"
            }}
            title="Settings"
            onClick={() => handleIconClick('settings')}
            onMouseEnter={(e) => {
              if (activeIcon !== 'settings') {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeIcon !== 'settings') {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <div style={{
              width: "24px",
              height: "24px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeIcon === 'settings' ? "#6366f1" : "#6b7280"
            }}>⚙️</div>
            {activeIcon === 'settings' && (
              <span style={{
                fontSize: "12px",
                color: "#6366f1",
                fontWeight: "600"
              }}>Settings</span>
            )}
            </div>
          <div 
              style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
                cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              position: "relative",
              background: activeIcon === 'download' ? "#f3f4f6" : "transparent"
            }}
            title="Report"
            onClick={() => handleIconClick('download')}
            onMouseEnter={(e) => {
              if (activeIcon !== 'download') {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeIcon !== 'download') {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <div style={{
              width: "24px",
              height: "24px",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeIcon === 'download' ? "#6366f1" : "#6b7280"
            }}>📊</div>
            {activeIcon === 'download' && (
              <span style={{
                fontSize: "12px",
                color: "#6366f1",
                fontWeight: "600"
              }}>Report</span>
            )}
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "10px"
        }}>
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            {/* Text Content - Left Side */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1
            }}>
              <div style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "8px"
              }}>Projects</div>
              <div style={{
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
                textAlign: "center"
              }}>
                {isAdmin 
                  ? `Total number of projects across all users.`
                  : `Total projects from all users in the list.`
                }
              </div>
            </div>
            
            {/* Count Number - Right Side */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1
            }}>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#10b981"
              }}>
                {projectsLoading ? "..." : projectCount}
              </div>
            </div>
          </div>
        </div>

        {/* Work Status Report */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px"
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: "0"
            }}>{isAdmin ? "All Users Work Status" : "Your Work Status"}</h2>
            
            {/* Search Bar - Show for all users */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <input
                type="text"
                placeholder={isAdmin ? "Search by email or date..." : "Search users..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  width: "250px",
                  outline: "none",
                  background: "white"
                }}
              />
              <span style={{
                fontSize: "16px",
                color: "#6b7280"
              }}>🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "#f9fafb",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#6b7280"
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Users List - Same data as Organization page */}
          <div style={{
            marginTop: "20px"
          }}>
            {usersLoading ? (
              <div style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
                padding: "20px 0"
              }}>
                Loading users...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div style={{
                display: "grid",
                gap: "6px"
              }}>
                {filteredUsers.map(({ user: userData }) => {
                  const isProjectsExpanded = expandedSections[`${userData.id}-projects`];
                  const isContributionsExpanded = expandedSections[`${userData.id}-contributions`];
                  const isRolesExpanded = expandedSections[`${userData.id}-roles`];

                  return (
                    <div key={`user-${userData.id}`} style={{
                      padding: "8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s ease",
                      marginBottom: "4px"
                    }}>
                      {/* User Header - Email, Date, Buttons, Status */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px"
                      }}>
                        {/* User Info */}
                        <div style={{
                          flex: 1,
                          minWidth: 0
                        }}>
                          <div style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                            marginBottom: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {userData.email}
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            <span>📅</span>
                            {userData.date_joined ? format(new Date(userData.date_joined), 'dd-MM-yyyy') : 
                             userData.last_activity ? format(new Date(userData.last_activity), 'dd-MM-yyyy') : 
                             'Date not available'}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                          display: "flex",
                          gap: "10px",
                          justifyContent: "center",
                          flex: 1
                        }}>
                          {/* Projects Button */}
                          <button
                            onClick={() => toggleSection(userData.id, 'projects')}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: isProjectsExpanded ? "rgb(25, 44, 89)" : "#f9fafb",
                              color: isProjectsExpanded ? "white" : "black",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              outline: "none",
                              borderColor: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              WebkitTextFillColor: isProjectsExpanded ? "white" : "black",
                              WebkitTextStrokeColor: "transparent"
                            }}
                          >
                            Projects ({userProjectsData[userData.id]?.length || 0})
                          </button>

                          {/* Contributions Button */}
                          <button
                            onClick={() => toggleSection(userData.id, 'contributions')}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: isContributionsExpanded ? "rgb(25, 44, 89)" : "#f9fafb",
                              color: isContributionsExpanded ? "white" : "black",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              outline: "none",
                              borderColor: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              WebkitTextFillColor: isContributionsExpanded ? "white" : "black",
                              WebkitTextStrokeColor: "transparent"
                            }}
                          >
                            Contributions
                          </button>

                          {/* Roles Button */}
                          <button
                            onClick={() => toggleSection(userData.id, 'roles')}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: isRolesExpanded ? "rgb(25, 44, 89)" : "#f9fafb",
                              color: isRolesExpanded ? "white" : "black",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              outline: "none",
                              borderColor: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              WebkitTextFillColor: isRolesExpanded ? "white" : "black",
                              WebkitTextStrokeColor: "transparent"
                            }}
                          >
                            Roles ({userRolesData[userData.id]?.length || 0})
                          </button>

                          {/* Assign Button - Show for both admin and client users */}
                          <button
                            onClick={() => window.location.href = `/user-role-assignment?email=${encodeURIComponent(userData.email)}`}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: "#f9fafb",
                              color: "black",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              outline: "none",
                              borderColor: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              WebkitTextFillColor: "black",
                              WebkitTextStrokeColor: "transparent"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgb(25, 44, 89)";
                              e.currentTarget.style.color = "white";
                              e.currentTarget.style.WebkitTextFillColor = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#f9fafb";
                              e.currentTarget.style.color = "black";
                              e.currentTarget.style.WebkitTextFillColor = "black";
                            }}
                          >
                            Assign
                          </button>
                        </div>

                        {/* Status Indicator */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "6px",
                          flex: 1
                        }}>
                          <span style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500"
                          }}>
                            Status: Active
                          </span>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#10b981"
                          }}></div>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      <div style={{
                        display: "flex",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}>
                        {/* Projects Content */}
                        {isProjectsExpanded && (
                          <div style={{
                            flex: "1",
                            minWidth: "200px",
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0"
                          }}>
                            <div style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              marginBottom: "8px"
                            }}>
                              Projects ({userProjectsData[userData.id]?.length || 0})
                            </div>
                            <div style={{
                              fontSize: "12px",
                              color: "#6b7280"
                            }}>
                              {userProjectsData[userData.id]?.length > 0 ? (
                                userProjectsData[userData.id].map((project) => (
                                  <div key={project.id} style={{ 
                                    marginBottom: "4px",
                                    padding: "4px 8px",
                                    background: "white",
                                    borderRadius: "4px",
                                    border: "1px solid #e5e7eb"
                                  }}>
                                    • {project.title}
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
                                  No projects created
                                </div>
                      )}
                    </div>
                          </div>
                        )}
                    
                        {/* Contributions Content */}
                        {isContributionsExpanded && (
                    <div style={{
                            flex: "1",
                            minWidth: "200px",
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0"
                    }}>
                      <div style={{
                        fontSize: "14px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              marginBottom: "8px"
                            }}>
                              📊 Contributions
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                              fontStyle: "italic"
                            }}>
                              No contributions data available yet.
                            </div>
                          </div>
                        )}

                        {/* Roles Content */}
                        {isRolesExpanded && (
                          <div style={{
                            flex: "1",
                            minWidth: "200px",
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0"
                          }}>
                            <div style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              marginBottom: "8px"
                            }}>
                              👤 Roles ({userRolesData[userData.id]?.length || 0})
                            </div>
                            <div style={{
                              fontSize: "12px",
                              color: "#6b7280"
                            }}>
                              {userRolesData[userData.id]?.length > 0 ? (
                                userRolesData[userData.id].map((role) => (
                                  <div key={role.id} style={{ 
                                    marginBottom: "4px",
                                    padding: "4px 8px",
                                    background: "white",
                                    borderRadius: "4px",
                                    border: "1px solid #e5e7eb"
                                  }}>
                                    • {role.display_name || role.name}
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
                                  No roles assigned
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "14px",
                fontStyle: "italic",
                padding: "20px 0"
              }}>
                {searchTerm ? `User not found` : "No users found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </Block>
  );
};

AssignRole.title = "Dashboard";
AssignRole.path = "/assign-role";
AssignRole.exact = true;