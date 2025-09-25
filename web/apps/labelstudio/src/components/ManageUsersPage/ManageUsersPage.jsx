import React, { useState, useEffect } from "react";
import { useAPI } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { IconClose, IconUserAdd, IconFileDownload, IconRefresh, IconChevronDown } from "@humansignal/icons";
import { Userpic } from "@humansignal/ui";
import { formatDistance } from "date-fns";
import { ProjectStatusPage } from "../ProjectStatusPage";

export const ManageUsersPage = ({ onClose }) => {
  const api = useAPI();
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [levelFilter, setLevelFilter] = useState(() => {
    // Load level filter from localStorage on component mount
    try {
      const saved = localStorage.getItem('levelFilter');
      return saved || "All Level";
    } catch (error) {
      console.error('Error loading level filter from localStorage:', error);
      return "All Level";
    }
  });
  const [userFilter, setUserFilter] = useState(() => {
    // Load user filter from localStorage on component mount
    try {
      const saved = localStorage.getItem('userFilter');
      return saved || "All Users";
    } catch (error) {
      console.error('Error loading user filter from localStorage:', error);
      return "All Users";
    }
  });
  const [userRoles, setUserRoles] = useState({});
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userTargets, setUserTargets] = useState(() => {
    // Load targets from localStorage on component mount
    try {
      const saved = localStorage.getItem('userTargets');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading user targets from localStorage:', error);
      return {};
    }
  });
  const [userLevels, setUserLevels] = useState(() => {
    // Load user levels from localStorage on component mount
    try {
      const saved = localStorage.getItem('userLevels');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading user levels from localStorage:', error);
      return {};
    }
  });
  const [showEditTargetModal, setShowEditTargetModal] = useState(false);
  const [selectedUserForTarget, setSelectedUserForTarget] = useState(null);
  const [targetDescription, setTargetDescription] = useState("");
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [showProjectStatusPage, setShowProjectStatusPage] = useState(false);
  const [showProjectAssignModal, setShowProjectAssignModal] = useState(false);
  const [selectedUserForProject, setSelectedUserForProject] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [userProjectAssignments, setUserProjectAssignments] = useState({});
  const [userInfoCache, setUserInfoCache] = useState({});
  const [activeTab, setActiveTab] = useState("Manage Users");
  const [currentUserAssignedProjects, setCurrentUserAssignedProjects] = useState([]);
  const pageSize = 10;

  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirst, setNewUserFirst] = useState("");
  const [newUserLast, setNewUserLast] = useState("");
  const [newUserRole, setNewUserRole] = useState("User"); // Default role
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false); // Track if current user is admin

  // Check if current user is admin
  const checkCurrentUserRole = async () => {
    try {
      const response = await api.callApi("listRoleBasedUsers", {
        params: { page: 1, page_size: 1 },
      });
      // If response includes user_role field, use it to determine admin status
      if (response.user_role) {
        setIsCurrentUserAdmin(response.user_role === 'admin');
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsCurrentUserAdmin(false); // Default to false (client)
    }
  };

  // Add user via backend; backend applies role-based rules
  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;
    try {
      setLoading(true);
      
      // For client users, always use "User" role regardless of dropdown selection
      const roleToUse = isCurrentUserAdmin ? newUserRole : "User";
      
      await api.callApi("createRoleBasedUser", {
        method: "POST",
        body: {
          email: newUserEmail.trim(),
          first_name: newUserFirst.trim(),
          last_name: newUserLast.trim(),
          role: roleToUse,
        },
      });
      setShowAddModal(false);
      setNewUserEmail("");
      setNewUserFirst("");
      setNewUserLast("");
      setNewUserRole("User"); // Reset to default
      // After creating a user, jump to the first page and refetch from backend only
      setCurrentPage(1);
      await fetchUsers(1);
      setSuccess("User added successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error("Add user failed", e);
      setError("Add user failed. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };

  // Delete selected users; backend enforces permission
  const handleDeleteUsers = async () => {
    if (!selectedUsers.length) return;
    const ok = window.confirm(`Delete ${selectedUsers.length} user(s)?`);
    if (!ok) return;
    setLoading(true);
    try {
      for (const id of selectedUsers) {
        await api.callApi("deleteUser", { params: { pk: id } });
      }
      setSelectedUsers([]);
      await fetchUsers(currentPage);
    } catch (e) {
      console.error("Delete users failed", e);
      setError("Delete failed. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user roles for each user
  const fetchUserRoles = async (usersList) => {
    setRolesLoading(true);
    const rolesData = {};
    
    for (const { user: userData } of usersList) {
      try {
        // Fetch user roles using the same API as AssignRole page
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
      } catch (error) {
        console.error(`Error fetching roles for user ${userData.email}:`, error);
        // Set default role if API fails
        rolesData[userData.id] = [{ name: "user", display_name: "User" }];
      }
    }
    
    setUserRoles(rolesData);
    setRolesLoading(false);
  };

  // Fetch users from the backend
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the role-based endpoint that requires authentication
      const response = await api.callApi("listRoleBasedUsers", {
        params: {
          page,
          page_size: pageSize,
        },
      });

      if (response.results) {
        setUsers(response.results);
        setTotalPages(Math.ceil(response.count / pageSize));
        
        // Fetch roles for all users
        await fetchUserRoles(response.results);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch users on component mount and page change
    fetchUsers(currentPage);
    // Check current user's role
    checkCurrentUserRole();
  }, [currentPage]);

  // Save filter values to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('levelFilter', levelFilter);
    } catch (error) {
      console.error('Error saving level filter to localStorage:', error);
    }
  }, [levelFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('userFilter', userFilter);
    } catch (error) {
      console.error('Error saving user filter to localStorage:', error);
    }
  }, [userFilter]);

  // Filter users based on search term, user filter, and level filter
  const filteredUsers = users.filter(({ user }) => {
    // Search filter
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // User status filter
    let matchesUserFilter = true;
    if (userFilter === "Active Users") {
      matchesUserFilter = user.is_active === true;
    } else if (userFilter === "Inactive Users") {
      matchesUserFilter = user.is_active === false;
    }
    
    // Level filter - based on user assigned level
    let matchesLevelFilter = true;
    if (levelFilter !== "All Level") {
      const userLevel = userLevels[user.id] || "Level 1"; // Default to Level 1
      matchesLevelFilter = userLevel === levelFilter;
    }
    
    return matchesSearch && matchesUserFilter && matchesLevelFilter;
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(({ user }) => user.id));
    }
  };

  // Helper function to get user's primary role
  const getUserRole = (userId) => {
    const roles = userRoles[userId] || [];
    if (roles.length === 0) return "User";
    
    // Get the first role or find a specific role
    const primaryRole = roles.find(role => 
      role.name === 'admin' || 
      role.name === 'manager' || 
      role.name === 'annotator' ||
      role.name === 'reviewer'
    );
    
    if (primaryRole) {
      return primaryRole.display_name || primaryRole.name;
    }
    
    return roles[0].display_name || roles[0].name;
  };

  // Handle edit target button click
  const handleEditTarget = (user) => {
    setSelectedUserForTarget(user);
    setTargetDescription(userTargets[user.id] || "");
    setShowEditTargetModal(true);
  };

  // Handle save target
  const handleSaveTarget = () => {
    if (selectedUserForTarget && targetDescription.trim()) {
      const newTargets = {
        ...userTargets,
        [selectedUserForTarget.id]: targetDescription.trim()
      };
      
      // Update state
      setUserTargets(newTargets);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('userTargets', JSON.stringify(newTargets));
      } catch (error) {
        console.error('Error saving user targets to localStorage:', error);
      }
      
      setShowEditTargetModal(false);
      setSelectedUserForTarget(null);
      setTargetDescription("");
    }
  };

  // Handle cancel edit target
  const handleCancelEditTarget = () => {
    setShowEditTargetModal(false);
    setSelectedUserForTarget(null);
    setTargetDescription("");
    setIsEditingLevel(false);
  };

  // Handle user click for project assignment
  const handleUserClick = async (user) => {
    setSelectedUserForProject(user);
    
    // Load existing assignments for this user
    const existingAssignmentsRaw = userProjectAssignments[user.id] || [];
    const existingAssignments = Array.isArray(existingAssignmentsRaw) ? existingAssignmentsRaw : [];
    setSelectedProjects(existingAssignments);
    
    console.log("User clicked:", user);
    console.log("User ID:", user.id);
    console.log("Existing assignments:", existingAssignments);
    console.log("All userProjectAssignments:", userProjectAssignments);
    console.log("Current user:", currentUser);
    console.log("Is current user admin:", isCurrentUserAdmin);
    
    setShowProjectAssignModal(true);
    
    // Fetch projects exactly like Projects page - show only assigned projects
    try {
      const response = await api.callApi("projects", {
        params: { 
          page_size: 1000,
          show_all: true, // Same as Projects page
          include: [
            "id",
            "title",
            "created_by",
            "created_at",
            "color",
            "is_published",
            "assignment_settings",
          ].join(","),
        }
      });
      
      // Show projects that can be assigned to the selected client
      let filteredProjects = response.results || [];
      console.log("Raw API response projects:", filteredProjects.length);
      console.log("Raw projects:", filteredProjects);

      if (currentUser && isCurrentUserAdmin) {
        // Admin can assign their created projects to clients
        console.log("Filtering for admin - current user ID:", currentUser.id);
        filteredProjects = filteredProjects.filter(project => {
          console.log("Project:", project.title, "Created by:", project.created_by?.id);
          return project.created_by?.id === currentUser.id;
        });
        console.log("Admin filtered projects:", filteredProjects.length);
      } else if (currentUser && !isCurrentUserAdmin) {
        // If current user is a client, show projects that are assigned to the current client (same as /projects page)
        const currentClientAssignmentsRaw = userProjectAssignments[currentUser.id] || [];
        const currentClientAssignments = Array.isArray(currentClientAssignmentsRaw) ? currentClientAssignmentsRaw : [];
        console.log("Current client ID:", currentUser.id);
        console.log("Current client assignments:", currentClientAssignments);
        console.log("All available projects:", filteredProjects.length);

        if (currentClientAssignments.length > 0) {
          filteredProjects = filteredProjects.filter(project =>
            currentClientAssignments.includes(project.id)
          );
          console.log("Filtered projects for current client:", filteredProjects.length);
        } else {
          console.log("No assignments found for current client");
          filteredProjects = [];
        }
      }
      
      console.log("Final available projects:", filteredProjects.length);
      setAvailableProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setAvailableProjects([]);
    }
  };

  // Helper function to safely check if project is selected
  const isProjectSelected = (projectId) => {
    const safeSelectedProjects = Array.isArray(selectedProjects) ? selectedProjects : [];
    return safeSelectedProjects.includes(projectId);
  };

  // Handle project selection
  const handleProjectSelect = (projectId) => {
    setSelectedProjects(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(projectId) 
        ? safePrev.filter(id => id !== projectId)
        : [...safePrev, projectId];
    });
  };

  // Handle assign projects
  const handleAssignProjects = async () => {
    const safeSelectedProjects = Array.isArray(selectedProjects) ? selectedProjects : [];
    if (!selectedUserForProject || safeSelectedProjects.length === 0) return;
    
    try {
      setLoading(true);
      
      // Create ProjectMember entries for each assigned project
      for (const projectId of safeSelectedProjects) {
        try {
          await api.callApi("projectMembers", {
            method: "POST",
            body: {
              user: selectedUserForProject.id,
              project: projectId,
              enabled: true
            }
          });
        } catch (memberError) {
          console.log(`ProjectMember might already exist for project ${projectId}:`, memberError);
          // Continue even if ProjectMember already exists
        }
      }
      
      // Save assignments to localStorage
      const newAssignments = {
        ...userProjectAssignments,
        [selectedUserForProject.id]: safeSelectedProjects
      };
      
      setUserProjectAssignments(newAssignments);
      
      // Save user info to cache
      const newUserInfoCache = {
        ...userInfoCache,
        [selectedUserForProject.id]: {
          email: selectedUserForProject.email,
          first_name: selectedUserForProject.first_name,
          last_name: selectedUserForProject.last_name,
          username: selectedUserForProject.username
        }
      };
      setUserInfoCache(newUserInfoCache);
      
      // Force update current user's assigned projects if this is the current user
      if (selectedUserForProject.id === currentUser?.id) {
        const safeSelectedProjects = Array.isArray(selectedProjects) ? selectedProjects : [];
        const assignedProjects = availableProjects.filter(project => 
          safeSelectedProjects.includes(project.id)
        );
        setCurrentUserAssignedProjects(assignedProjects);
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('userProjectAssignments', JSON.stringify(newAssignments));
        localStorage.setItem('userInfoCache', JSON.stringify(newUserInfoCache));
      } catch (error) {
        console.error('Error saving assignments to localStorage:', error);
      }
      
      setShowProjectAssignModal(false);
      setSelectedUserForProject(null);
      setSelectedProjects([]);
      setSuccess(`Projects assigned to ${selectedUserForProject.email}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error assigning projects:", error);
      setError("Failed to assign projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel project assignment
  const handleCancelProjectAssign = () => {
    setShowProjectAssignModal(false);
    setSelectedUserForProject(null);
    setSelectedProjects([]);
  };

  // Handle unassign project from user
  const handleUnassignProject = async (userId, projectId) => {
    const user = users.find(u => u.user.id === parseInt(userId));
    if (!user) return;

    const confirmUnassign = window.confirm(
      `Are you sure you want to unassign this project from ${user.user.email}?`
    );
    
    if (!confirmUnassign) return;

    try {
      setLoading(true);

      // Remove ProjectMember entry
      try {
        await api.callApi("projectMembers", {
          method: "DELETE",
          params: { 
            user_id: userId,
            project_id: projectId 
          }
        });
      } catch (memberError) {
        console.log("ProjectMember deletion error (might not exist):", memberError);
        // Continue even if ProjectMember doesn't exist
      }

      // Update localStorage assignments
      const currentAssignments = userProjectAssignments[userId] || [];
      const updatedAssignments = currentAssignments.filter(id => id !== projectId);
      
      const newAssignments = {
        ...userProjectAssignments,
        [userId]: updatedAssignments
      };

      // If user has no more assignments, remove them from the object
      if (updatedAssignments.length === 0) {
        delete newAssignments[userId];
        // Also remove from user info cache
        const newUserInfoCache = { ...userInfoCache };
        delete newUserInfoCache[userId];
        setUserInfoCache(newUserInfoCache);
      }

      setUserProjectAssignments(newAssignments);

      // Update current user's assigned projects if this is the current user
      if (parseInt(userId) === currentUser?.id) {
        const assignedProjects = availableProjects.filter(project => 
          updatedAssignments.includes(project.id)
        );
        setCurrentUserAssignedProjects(assignedProjects);
      }

      // Save to localStorage
      try {
        localStorage.setItem('userProjectAssignments', JSON.stringify(newAssignments));
        if (updatedAssignments.length === 0) {
          localStorage.setItem('userInfoCache', JSON.stringify(newUserInfoCache));
        }
      } catch (error) {
        console.error('Error saving assignments to localStorage:', error);
      }

      setSuccess(`Project unassigned from ${user.user.email}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error unassigning project:", error);
      setError("Failed to unassign project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle unassign all projects from user
  const handleUnassignAllProjects = async (userId) => {
    const user = users.find(u => u.user.id === parseInt(userId));
    if (!user) return;

    const currentAssignments = userProjectAssignments[userId] || [];
    if (currentAssignments.length === 0) return;

    const confirmUnassign = window.confirm(
      `Are you sure you want to unassign ALL ${currentAssignments.length} projects from ${user.user.email}?`
    );
    
    if (!confirmUnassign) return;

    try {
      setLoading(true);

      // Remove all ProjectMember entries for this user
      for (const projectId of currentAssignments) {
        try {
          await api.callApi("projectMembers", {
            method: "DELETE",
            params: { 
              user_id: userId,
              project_id: projectId 
            }
          });
        } catch (memberError) {
          console.log(`ProjectMember deletion error for project ${projectId} (might not exist):`, memberError);
          // Continue even if ProjectMember doesn't exist
        }
      }

      // Update localStorage assignments - remove user completely
      const newAssignments = { ...userProjectAssignments };
      delete newAssignments[userId];
      
      // Also remove from user info cache
      const newUserInfoCache = { ...userInfoCache };
      delete newUserInfoCache[userId];

      setUserProjectAssignments(newAssignments);
      setUserInfoCache(newUserInfoCache);

      // Update current user's assigned projects if this is the current user
      if (parseInt(userId) === currentUser?.id) {
        setCurrentUserAssignedProjects([]);
      }

      // Save to localStorage
      try {
        localStorage.setItem('userProjectAssignments', JSON.stringify(newAssignments));
        localStorage.setItem('userInfoCache', JSON.stringify(newUserInfoCache));
      } catch (error) {
        console.error('Error saving assignments to localStorage:', error);
      }

      setSuccess(`All projects unassigned from ${user.user.email}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error unassigning all projects:", error);
      setError("Failed to unassign all projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get assigned projects for current user
  const getAssignedProjectsForCurrentUser = () => {
    if (!currentUser) return [];
    
    const currentUserAssignmentsRaw = userProjectAssignments[currentUser.id] || [];
    const currentUserAssignments = Array.isArray(currentUserAssignmentsRaw) ? currentUserAssignmentsRaw : [];
    console.log("Current user ID:", currentUser.id);
    console.log("User assignments:", currentUserAssignments);
    console.log("Available projects:", availableProjects.length);
    
    const assignedProjects = availableProjects.filter(project => 
      currentUserAssignments.includes(project.id)
    );
    
    console.log("Assigned projects for current user:", assignedProjects.length);
    return assignedProjects;
  };

  // Load user project assignments from localStorage and fetch projects
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userProjectAssignments');
      if (saved) {
        setUserProjectAssignments(JSON.parse(saved));
      }
      
      const savedUserInfo = localStorage.getItem('userInfoCache');
      if (savedUserInfo) {
        setUserInfoCache(JSON.parse(savedUserInfo));
      }
    } catch (error) {
      console.error('Error loading user project assignments:', error);
    }
    
    // Load all projects for Assigned Tasks tab
    fetchAllProjectsForAssignments();
  }, []);

  // Function to fetch all projects for the Assigned Tasks tab
  const fetchAllProjectsForAssignments = async () => {
    try {
      console.log("Fetching all projects for Assigned Tasks tab...");
        const response = await api.callApi("projects", {
          params: { 
            page_size: 1000,
          show_all: true,
          include: [
            "id",
            "title",
            "created_by",
            "created_at",
            "color",
            "is_published",
            "assignment_settings",
          ].join(","),
        }
      });
      
      console.log("Fetched projects for assignments:", response.results?.length || 0);
        setAvailableProjects(response.results || []);
      } catch (error) {
      console.error("Error fetching projects for assignments:", error);
        setAvailableProjects([]);
      }
    };

  // Fetch assigned projects for current user when switching to Assigned Tasks tab
  useEffect(() => {
    if (activeTab === "Assigned Tasks" && currentUser) {
      const fetchAssignedProjects = async () => {
        try {
          // Get current user's assigned project IDs from localStorage
          const currentUserAssignmentsRaw = userProjectAssignments[currentUser.id] || [];
          const currentUserAssignments = Array.isArray(currentUserAssignmentsRaw) ? currentUserAssignmentsRaw : [];
          console.log("Fetching assigned projects for user:", currentUser.id);
          console.log("Assigned project IDs:", currentUserAssignments);
          
          if (currentUserAssignments.length === 0) {
            setCurrentUserAssignedProjects([]);
            return;
          }
          
          // Fetch only the assigned projects
          const assignedProjects = availableProjects.filter(project => 
            currentUserAssignments.includes(project.id)
          );
          
          console.log("Found assigned projects:", assignedProjects.length);
          setCurrentUserAssignedProjects(assignedProjects);
        } catch (error) {
          console.error("Error fetching assigned projects:", error);
          setCurrentUserAssignedProjects([]);
        }
      };
      
      fetchAssignedProjects();
    }
  }, [activeTab, currentUser, userProjectAssignments, availableProjects]);


  // Get user target text
  const getUserTarget = (userId) => {
    return userTargets[userId] || "-";
  };

  // Get user level
  const getUserLevel = (userId) => {
    return userLevels[userId] || "Level 1";
  };

  // Handle edit level button click
  const handleEditLevel = (user) => {
    setSelectedUserForTarget(user);
    setTargetDescription(userLevels[user.id] || "Level 1");
    setIsEditingLevel(true);
    setShowEditTargetModal(true);
  };

  // Handle save level
  const handleSaveLevel = () => {
    if (selectedUserForTarget && targetDescription.trim()) {
      const newLevels = {
        ...userLevels,
        [selectedUserForTarget.id]: targetDescription.trim()
      };
      
      // Update state
      setUserLevels(newLevels);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('userLevels', JSON.stringify(newLevels));
      } catch (error) {
        console.error('Error saving user levels to localStorage:', error);
      }
      
      setShowEditTargetModal(false);
      setSelectedUserForTarget(null);
      setTargetDescription("");
      setIsEditingLevel(false);
    }
  };

  // Handle delete target
  const handleDeleteTarget = (userId) => {
    const newTargets = { ...userTargets };
    delete newTargets[userId];
    
    // Update state
    setUserTargets(newTargets);
    
    // Save to localStorage
    try {
      localStorage.setItem('userTargets', JSON.stringify(newTargets));
    } catch (error) {
      console.error('Error saving user targets to localStorage:', error);
    }
  };

  // If showing project status page, render it instead of the manage users page
  if (showProjectStatusPage) {
    return <ProjectStatusPage onClose={() => setShowProjectStatusPage(false)} />;
  }

  return (
    <div style={{
      backgroundColor: "#ffffff",
      minHeight: "100vh",
      padding: "0",
    }}>
      {/* Header with Tabs */}
      <div style={{
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          height: "60px",
        }}>
           <div style={{
             display: "flex",
             gap: "32px",
           }}>
             <div 
               onClick={() => setActiveTab("Manage Users")}
               style={{
                 padding: "12px 0",
                 borderBottom: activeTab === "Manage Users" ? "2px solid #3b82f6" : "2px solid transparent",
                 color: activeTab === "Manage Users" ? "#3b82f6" : "#6b7280",
                 fontWeight: "500",
                 fontSize: "16px",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
               }}
             >
               Manage Users
             </div>
             <div 
               onClick={() => setActiveTab("Assigned Tasks")}
               style={{
                 padding: "12px 0",
                 borderBottom: activeTab === "Assigned Tasks" ? "2px solid #3b82f6" : "2px solid transparent",
                 color: activeTab === "Assigned Tasks" ? "#3b82f6" : "#6b7280",
                 fontWeight: "500",
                 fontSize: "16px",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
               }}
             >
               Assigned Tasks
             </div>
             <div 
               onClick={() => setActiveTab("User Groups")}
               style={{
                 padding: "12px 0",
                 borderBottom: activeTab === "User Groups" ? "2px solid #3b82f6" : "2px solid transparent",
                 color: activeTab === "User Groups" ? "#3b82f6" : "#6b7280",
                 fontWeight: "500",
                 fontSize: "16px",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
               }}
             >
               User Groups
             </div>
             <div 
               onClick={() => setActiveTab("User Consent")}
               style={{
                 padding: "12px 0",
                 borderBottom: activeTab === "User Consent" ? "2px solid #3b82f6" : "2px solid transparent",
                 color: activeTab === "User Consent" ? "#3b82f6" : "#6b7280",
                 fontWeight: "500",
                 fontSize: "16px",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
               }}
             >
               User Consent
             </div>
           </div>
          
          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              fontSize: "14px",
              color: "#374151",
              fontWeight: "500",
            }}>
              12-09-2025
            </div>
            <button style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#14b8a6",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
              <IconRefresh style={{ width: "16px", height: "16px" }} />
            </button>
            <button style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#14b8a6",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
              <IconChevronDown style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: "#dbeafe",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          color: "#1e40af",
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "10px",
          }}>
            📍
          </div>
          Manage users and map them to desired execution level. Use Import to download User Details template and upload multiple users at a time.
        </div>
        <button style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#1e40af",
          fontSize: "16px",
        }}>
          ×
        </button>
      </div>

      {/* Filters and Actions - only show for Manage Users tab */}
      {activeTab === "Manage Users" && (
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}>
            {/* Level Filter */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}>
              <label style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "#374151",
              }}>
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  minWidth: "120px",
                }}
              >
                <option value="All Level">All Level</option>
                <option value="Level 1">Level 1</option>
                <option value="Level 2">Level 2</option>
                <option value="Level 3">Level 3</option>
              </select>
            </div>

            {/* User Filter */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}>
              <label style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "#374151",
              }}>
                User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  minWidth: "120px",
                }}
              >
                <option value="All Users">All Users</option>
                <option value="Active Users">Active Users</option>
                <option value="Inactive Users">Inactive Users</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{
              marginLeft: "auto",
              display: "flex",
              gap: "8px",
            }}>
              <button onClick={() => setShowAddModal(true)} style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <IconUserAdd style={{ width: "16px", height: "16px" }} />
                + ADD
              </button>
              <button onClick={handleDeleteUsers} style={{
                padding: "8px 16px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}>
                DELETE
              </button>
              <button style={{
                padding: "8px 16px",
                backgroundColor: "#059669",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}>
                IMPORT
              </button>
              <button style={{
                padding: "8px 16px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                SET PROJECT TARGET
                <IconChevronDown style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>

          {/* Add User Modal */}
          {showAddModal && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}>
              <div style={{
                width: "480px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>Add New User</h3>
                  <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <IconClose />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#6b7280" }}>Email</label>
                    <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="user@example.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>First Name</label>
                      <input value={newUserFirst} onChange={(e) => setNewUserFirst(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>Last Name</label>
                      <input value={newUserLast} onChange={(e) => setNewUserLast(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                    </div>
                  </div>
                  {/* Only show role dropdown for admin users */}
                  {isCurrentUserAdmin && (
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>Role</label>
                      <select 
                        value={newUserRole} 
                        onChange={(e) => setNewUserRole(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      >
                        <option value="User">User</option>
                        <option value="Client">Client</option>
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                  <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleAddUser} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" }}>Add User</button>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              position: "relative",
              flex: 1,
              maxWidth: "400px",
            }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <div style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
              }}>
                🔍
              </div>
            </div>
            
            {/* Export Button */}
            <button 
              onClick={() => setShowProjectStatusPage(true)}
              style={{
                padding: "10px 16px",
                backgroundColor: "#059669",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#047857";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#059669";
              }}
            >
              <IconFileDownload style={{ width: "16px", height: "16px" }} />
              EXPORT
            </button>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
       {activeTab === "Assigned Tasks" ? (
         /* Assigned Tasks Table */
         <div style={{
           padding: "0 24px 24px 24px",
           backgroundColor: "#ffffff",
         }}>
           <div style={{
             border: "1px solid #e5e7eb",
             borderRadius: "8px",
             overflow: "hidden",
             backgroundColor: "white",
           }}>
             {/* Header */}
             <div style={{
               backgroundColor: "#f9fafb",
               padding: "16px",
               borderBottom: "1px solid #e5e7eb",
               textAlign: "center",
             }}>
               <h3 style={{
                 fontSize: "18px",
                 fontWeight: "600",
                 color: "#1f2937",
                 margin: 0,
               }}>
                 {isCurrentUserAdmin ? "Client Project Assignments" : "My User Assignments"}
               </h3>
               <p style={{
                 fontSize: "14px",
                 color: "#6b7280",
                 margin: "4px 0 0 0",
               }}>
                 {isCurrentUserAdmin ? "View projects assigned to clients" : "View projects assigned to your users"}
               </p>
             </div>

             {/* User Assignments List */}
             {(() => {
               console.log("=== ASSIGNED TASKS DEBUG ===");
               console.log("userProjectAssignments:", userProjectAssignments);
               console.log("Object.keys(userProjectAssignments):", Object.keys(userProjectAssignments));
               console.log("Object.keys(userProjectAssignments).length:", Object.keys(userProjectAssignments).length);
               console.log("availableProjects:", availableProjects.length);
               console.log("userInfoCache:", userInfoCache);
               console.log("isCurrentUserAdmin:", isCurrentUserAdmin);
               console.log("currentUser:", currentUser);
               
               // Filter assignments based on current user's role
               let filteredAssignments = {};
               if (isCurrentUserAdmin) {
                 // Admin sees all assignments
                 filteredAssignments = userProjectAssignments;
                 console.log("Admin view - showing all assignments:", Object.keys(filteredAssignments).length);
               } else {
                 // Client sees only assignments they made to their users (not admin-assigned projects)
                 filteredAssignments = {};
                 
                 // Add projects assigned by the current client to their users
                 // Find users created by the current client
                 const clientCreatedUsers = users.filter(user => 
                   user.user.created_by === currentUser.id || 
                   user.user.created_by === currentUser.email ||
                   user.user.created_by === currentUser.username
                 );
                 
                 console.log("Client created users:", clientCreatedUsers.length);
                 
                 // Add assignments for users created by this client
                 clientCreatedUsers.forEach(user => {
                   if (userProjectAssignments[user.user.id]) {
                     filteredAssignments[user.user.id] = userProjectAssignments[user.user.id];
                   }
                 });
                 
                 console.log("Client view - showing only assignments to created users:", Object.keys(filteredAssignments).length);
               }
               
               return Object.keys(filteredAssignments).length === 0 ? (
               <div style={{
                 padding: "40px",
                 textAlign: "center",
                 color: "#6b7280",
               }}>
                 <div>
                   {isCurrentUserAdmin 
                     ? "No project assignments found for clients. Assign projects to clients in the Manage Users tab."
                     : "No projects have been assigned to your users yet. Assign projects to your users in the Manage Users tab."
                   }
                 </div>
               </div>
             ) : (
               <div style={{
                 padding: "16px",
               }}>
                 {Object.entries(filteredAssignments).map(([userId, projectIds]) => {
                   // Debug logging
                   console.log("Processing user assignment:", userId, projectIds, typeof projectIds);
                   
                   // Ensure projectIds is always an array
                   const safeProjectIds = Array.isArray(projectIds) ? projectIds : [];
                   console.log("Safe project IDs:", safeProjectIds);
                   
                   // Try to get user from users array first, then from cache
                   let user = users.find(u => u.user.id === parseInt(userId));
                   let userEmail = user?.user?.email;
                   
                   if (!user && userInfoCache[userId]) {
                     // Create mock user object from cache
                     const cachedUserInfo = userInfoCache[userId];
                     user = {
                       user: {
                         id: parseInt(userId),
                         email: cachedUserInfo.email,
                         first_name: cachedUserInfo.first_name,
                         last_name: cachedUserInfo.last_name,
                         username: cachedUserInfo.username
                       }
                     };
                     userEmail = cachedUserInfo.email;
                   }
                   
                   const userProjects = availableProjects.filter(project => 
                     safeProjectIds.includes(project.id)
                   );
                   
                   // Skip admin user - they don't need assignments
                   if (!user || userProjects.length === 0 || userEmail === 'dhaneshwari.tosscss@gmail.com') return null;
                   
                   return (
                     <div key={userId} style={{
                       marginBottom: "24px",
                       border: "1px solid #e5e7eb",
                       borderRadius: "8px",
                       overflow: "hidden",
                     }}>
                       {/* User Header */}
                         <div style={{
                           backgroundColor: "#f3f4f6",
                           padding: "12px 16px",
                           borderBottom: "1px solid #e5e7eb",
                           display: "flex",
                           justifyContent: "space-between",
                           alignItems: "center",
                         }}>
                           <div>
                             <div style={{
                               fontSize: "16px",
                               fontWeight: "600",
                               color: "#1f2937",
                               marginBottom: "4px",
                             }}>
                               {user.user.first_name && user.user.last_name
                                 ? `${user.user.first_name} ${user.user.last_name}`
                                 : user.user.email.split('@')[0]
                               }
                             </div>
                             <div style={{
                               fontSize: "12px",
                               color: "#6b7280",
                             }}>
                               {user.user.email} • {userProjects.length} project{userProjects.length !== 1 ? 's' : ''} assigned
                             </div>
                           </div>
                           <button
                             onClick={() => handleUnassignAllProjects(userId)}
                             style={{
                               background: "none",
                               border: "1px solid #dc2626",
                               color: "#dc2626",
                               cursor: "pointer",
                               padding: "4px 8px",
                               borderRadius: "4px",
                               fontSize: "11px",
                               transition: "all 0.2s ease",
                             }}
                             onMouseEnter={(e) => {
                               e.currentTarget.style.backgroundColor = "#fee2e2";
                             }}
                             onMouseLeave={(e) => {
                               e.currentTarget.style.backgroundColor = "transparent";
                             }}
                             title="Unassign all projects from this user"
                           >
                             Unassign All
                           </button>
                         </div>
                       
                       {/* User's Assigned Projects */}
               <div style={{
                 display: "grid",
                         gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                         gap: "12px",
                 padding: "16px",
               }}>
                         {userProjects.map((project) => (
                   <div
                     key={project.id}
                     style={{
                               padding: "12px",
                               backgroundColor: "#ffffff",
                               borderRadius: "6px",
                       border: "1px solid #e5e7eb",
                       transition: "all 0.2s ease",
                       cursor: "pointer",
                     }}
                     onMouseEnter={(e) => {
                               e.currentTarget.style.backgroundColor = "#f9fafb";
                       e.currentTarget.style.borderColor = "#d1d5db";
                     }}
                     onMouseLeave={(e) => {
                               e.currentTarget.style.backgroundColor = "#ffffff";
                       e.currentTarget.style.borderColor = "#e5e7eb";
                     }}
                   >
                     {/* Project Title */}
                     <div style={{
                               fontSize: "14px",
                       fontWeight: "600",
                       color: "#1f2937",
                               marginBottom: "6px",
                     }}>
                       {project.title || `Project ${project.id}`}
                     </div>
                     
                     {/* Project Stats */}
                     <div style={{
                       display: "flex",
                               gap: "8px",
                               marginBottom: "6px",
                     }}>
                       <div style={{
                         display: "flex",
                         alignItems: "center",
                                 gap: "2px",
                                 fontSize: "10px",
                         color: "#059669",
                       }}>
                         <span>✓</span>
                         <span>Done: 0</span>
                       </div>
                       <div style={{
                         display: "flex",
                         alignItems: "center",
                                 gap: "2px",
                                 fontSize: "10px",
                         color: "#dc2626",
                       }}>
                         <span>-</span>
                         <span>Skip: 0</span>
                       </div>
                       <div style={{
                         display: "flex",
                         alignItems: "center",
                                 gap: "2px",
                                 fontSize: "10px",
                         color: "#3b82f6",
                       }}>
                         <span>±</span>
                         <span>Pred: 0</span>
                       </div>
                     </div>
                     
                     {/* Project Description */}
                     <div style={{
                               fontSize: "11px",
                       color: "#6b7280",
                               marginBottom: "6px",
                     }}>
                       {project.description || "No description available."}
                     </div>
                     
                     {/* Project Footer */}
                     <div style={{
                               fontSize: "10px",
                       color: "#9ca3af",
                       display: "flex",
                       justifyContent: "space-between",
                       alignItems: "center",
                     }}>
                       <span>ID: {project.id}</span>
                               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                 <span>Assigned</span>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleUnassignProject(userId, project.id);
                                   }}
                                   style={{
                                     background: "none",
                                     border: "none",
                                     color: "#dc2626",
                                     cursor: "pointer",
                                     padding: "2px 4px",
                                     borderRadius: "3px",
                                     fontSize: "10px",
                                     transition: "all 0.2s ease",
                                   }}
                                   onMouseEnter={(e) => {
                                     e.currentTarget.style.backgroundColor = "#fee2e2";
                                   }}
                                   onMouseLeave={(e) => {
                                     e.currentTarget.style.backgroundColor = "transparent";
                                   }}
                                   title="Unassign this project"
                                 >
                                   ×
                                 </button>
                               </div>
                     </div>
                   </div>
                 ))}
               </div>
                     </div>
                   );
                 })}
               </div>
             );})()}
           </div>
         </div>
       ) : (
         /* Other tabs content - only show for tabs that don't have their own content */
         activeTab !== "Manage Users" && (
           <div style={{
             padding: "0 24px 24px 24px",
             backgroundColor: "#ffffff",
           }}>
             <div style={{
               padding: "40px",
               textAlign: "center",
               color: "#6b7280",
             }}>
               {activeTab} functionality will be available soon.
             </div>
           </div>
         )
       )}

       {/* Users Table - only show for Manage Users tab */}
       {activeTab === "Manage Users" && (
         <div style={{
           padding: "0 24px 24px 24px",
           backgroundColor: "#ffffff",
         }}>
           {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            color: "#6b7280",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              Loading users...
            </div>
          </div>
        ) : error ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            color: "#dc2626",
          }}>
            <div style={{
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "8px",
              }}>
                Error Loading Users
              </div>
              <div style={{
                fontSize: "14px",
                color: "#991b1b",
              }}>
                {error}
              </div>
              <button
                onClick={() => fetchUsers(currentPage)}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "white",
          }}>
            {success && (
              <div style={{
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                padding: "10px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "14px",
              }}>
                {success}
              </div>
            )}
            {/* Table Header */}
            <div style={{
              backgroundColor: "#f9fafb",
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "grid",
              gridTemplateColumns: "40px 60px 1fr 120px 100px 100px 100px 100px 120px",
              gap: "12px",
              alignItems: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <div>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: "16px",
                    height: "16px",
                  }}
                />
              </div>
              <div style={{ textAlign: "left" }}>ID</div>
              <div style={{ textAlign: "left" }}>Name</div>
              <div style={{ textAlign: "left" }}>Role</div>
              <div style={{ textAlign: "left" }}>User Target</div>
              <div style={{ textAlign: "center" }}>Groups</div>
              <div style={{ textAlign: "center" }}>Status</div>
              <div style={{ textAlign: "left" }}>Level</div>
              <div style={{ textAlign: "left" }}>Actions</div>
            </div>

            {/* Table Body */}
            {filteredUsers.length === 0 ? (
              <div style={{
                padding: "40px",
                textAlign: "center",
                color: "#6b7280",
              }}>
                {searchTerm ? "No users found matching your search." : "No users available."}
              </div>
            ) : (
              filteredUsers.map(({ user }) => (
                <div
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    display: "grid",
                    gridTemplateColumns: "40px 60px 1fr 120px 100px 100px 100px 100px 120px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "12px 16px",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  </div>

                   {/* ID */}
                   <div 
                     onClick={() => handleUserClick(user)}
                     style={{
                       fontSize: "14px",
                       fontWeight: "500",
                       color: "#3b82f6",
                       cursor: "pointer",
                       textDecoration: "underline",
                       transition: "color 0.2s ease",
                       textAlign: "left",
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.color = "#2563eb";
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.color = "#3b82f6";
                     }}
                   >
                     {user.id}
                   </div>

                   {/* Name */}
                   <div>
                     <div 
                       onClick={() => handleUserClick(user)}
                       style={{
                         fontSize: "14px",
                         fontWeight: "500",
                         color: "#3b82f6",
                         marginBottom: "2px",
                         cursor: "pointer",
                         textDecoration: "underline",
                         transition: "color 0.2s ease",
                       }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.color = "#2563eb";
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.color = "#3b82f6";
                       }}
                     >
                       {user.first_name && user.last_name 
                         ? `${user.first_name} ${user.last_name}`
                         : user.email.split('@')[0]
                       }
                     </div>
                     <div style={{
                       fontSize: "12px",
                       color: "#6b7280",
                     }}>
                       {user.email}
                     </div>
                   </div>

                  {/* Role */}
                  <div style={{
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {rolesLoading ? (
                      <>
                        <div style={{
                          width: "12px",
                          height: "12px",
                          border: "2px solid #e5e7eb",
                          borderTop: "2px solid #3b82f6",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }} />
                        Loading...
                      </>
                    ) : (
                      getUserRole(user.id)
                    )}
                  </div>

                  {/* User Target */}
                  <div style={{
                    fontSize: "14px",
                    color: getUserTarget(user.id) === "-" ? "#6b7280" : "#374151",
                    fontWeight: getUserTarget(user.id) === "-" ? "normal" : "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left",
                  }}>
                    <span style={{ flex: 1 }}>
                      {getUserTarget(user.id)}
                    </span>
                    {getUserTarget(user.id) !== "-" && (
                      <button
                        onClick={() => handleDeleteTarget(user.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "2px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Delete target"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Groups */}
                  <div style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    -
                  </div>

                  {/* Status */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: "500",
                      borderRadius: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Active
                    </span>
                  </div>

                  {/* Level */}
                  <div style={{
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{ 
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      {getUserLevel(user.id)}
                      <button
                        onClick={() => handleEditLevel(user)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#6b7280",
                          cursor: "pointer",
                          padding: "1px",
                          borderRadius: "3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          transition: "all 0.2s ease",
                          marginLeft: "2px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                          e.currentTarget.style.color = "#3b82f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6b7280";
                        }}
                        title="Edit level"
                      >
                        ✏️
                      </button>
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}>
                    <button 
                      onClick={() => handleEditTarget(user)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3b82f6",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        textDecoration: "underline",
                        transition: "color 0.2s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#3b82f6";
                      }}
                    >
                      EDIT TARGET
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "20px",
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                backgroundColor: currentPage === 1 ? "#f9fafb" : "white",
                color: currentPage === 1 ? "#9ca3af" : "#374151",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Previous
            </button>
            
            <span style={{
              padding: "8px 12px",
              fontSize: "14px",
              color: "#374151",
            }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                backgroundColor: currentPage === totalPages ? "#f9fafb" : "white",
                color: currentPage === totalPages ? "#9ca3af" : "#374151",
                borderRadius: "6px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Next
            </button>
          </div>
        )}
         </div>
       )}

      {/* Edit Target Modal */}
      {showEditTargetModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                margin: 0,
              }}>
                {isEditingLevel ? 'Edit Level' : 'Edit Target'} for {selectedUserForTarget?.email}
              </h3>
              <button
                onClick={handleCancelEditTarget}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <IconClose style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              marginBottom: "24px",
            }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}>
                {isEditingLevel ? 'Level' : 'Target Description'}
              </label>
              {isEditingLevel ? (
                <select
                  value={targetDescription}
                  onChange={(e) => setTargetDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                    backgroundColor: "white",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 3">Level 3</option>
                </select>
              ) : (
                <textarea
                  value={targetDescription}
                  onChange={(e) => setTargetDescription(e.target.value)}
                  placeholder="Enter target description for this user..."
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
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
              )}
            </div>

            {/* Modal Actions */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}>
              <button
                onClick={handleCancelEditTarget}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                Cancel
              </button>
              <button
                onClick={isEditingLevel ? handleSaveLevel : handleSaveTarget}
                disabled={!targetDescription.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: targetDescription.trim() ? "#3b82f6" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: targetDescription.trim() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (targetDescription.trim()) {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (targetDescription.trim()) {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                  }
                }}
              >
                {isEditingLevel ? 'Save Level' : 'Save Target'}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Project Assignment Modal */}
       {showProjectAssignModal && (
         <div style={{
           position: "fixed",
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: "rgba(0, 0, 0, 0.5)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           zIndex: 1000,
           padding: "20px",
         }}>
           <div style={{
             backgroundColor: "white",
             borderRadius: "12px",
             width: "100%",
             maxWidth: "600px",
             maxHeight: "80vh",
             padding: "24px",
             boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
             overflow: "hidden",
             display: "flex",
             flexDirection: "column",
           }}>
             {/* Modal Header */}
             <div style={{
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               marginBottom: "20px",
               flexShrink: 0,
             }}>
               <h3 style={{
                 fontSize: "18px",
                 fontWeight: "600",
                 color: "#1f2937",
                 margin: 0,
               }}>
                 Assign Your Projects to {selectedUserForProject?.email}
               </h3>
               <button
                 onClick={handleCancelProjectAssign}
                 style={{
                   background: "none",
                   border: "none",
                   cursor: "pointer",
                   padding: "8px",
                   borderRadius: "6px",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   color: "#6b7280",
                   transition: "all 0.2s ease",
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = "#f3f4f6";
                   e.currentTarget.style.color = "#374151";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = "transparent";
                   e.currentTarget.style.color = "#6b7280";
                 }}
               >
                 <IconClose style={{ width: "20px", height: "20px" }} />
               </button>
             </div>

             {/* Modal Content */}
             <div style={{
               flex: 1,
               overflow: "auto",
               marginBottom: "20px",
             }}>
               <div style={{
                 display: "flex",
                 flexDirection: "column",
                 gap: "12px",
               }}>
                 {availableProjects.map((project) => (
                   <div
                     key={project.id}
                     onClick={() => handleProjectSelect(project.id)}
                     style={{
                       padding: "12px",
                       border: isProjectSelected(project.id) 
                         ? "2px solid #3b82f6" 
                         : "1px solid #e5e7eb",
                       borderRadius: "8px",
                       cursor: "pointer",
                       backgroundColor: isProjectSelected(project.id) 
                         ? "#eff6ff" 
                         : "white",
                       transition: "all 0.2s ease",
                     }}
                     onMouseEnter={(e) => {
                       if (!isProjectSelected(project.id)) {
                         e.currentTarget.style.backgroundColor = "#f9fafb";
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (!isProjectSelected(project.id)) {
                         e.currentTarget.style.backgroundColor = "white";
                       }
                     }}
                   >
                     <div style={{
                       display: "flex",
                       alignItems: "center",
                       gap: "12px",
                     }}>
                       <input
                         type="checkbox"
                         checked={isProjectSelected(project.id)}
                         onChange={() => handleProjectSelect(project.id)}
                         style={{
                           width: "16px",
                           height: "16px",
                         }}
                       />
                       <div style={{ flex: 1 }}>
                         <div style={{
                           fontSize: "14px",
                           fontWeight: "500",
                           color: "#1f2937",
                           marginBottom: "2px",
                         }}>
                           {project.title || `Project ${project.id}`}
                         </div>
                         <div style={{
                           fontSize: "12px",
                           color: "#6b7280",
                         }}>
                           ID: {project.id}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
                 {availableProjects.length === 0 && (
                   <div style={{
                     padding: "40px",
                     textAlign: "center",
                     color: "#6b7280",
                   }}>
                     No projects available
                   </div>
                 )}
               </div>
             </div>

             {/* Modal Actions */}
             <div style={{
               display: "flex",
               alignItems: "center",
               justifyContent: "flex-end",
               gap: "12px",
               flexShrink: 0,
               borderTop: "1px solid #e5e7eb",
               paddingTop: "16px",
             }}>
               <button
                 onClick={handleCancelProjectAssign}
                 style={{
                   padding: "10px 20px",
                   backgroundColor: "transparent",
                   color: "#6b7280",
                   border: "1px solid #d1d5db",
                   borderRadius: "6px",
                   cursor: "pointer",
                   fontSize: "14px",
                   fontWeight: "500",
                   transition: "all 0.2s ease",
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = "#f9fafb";
                   e.currentTarget.style.color = "#374151";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = "transparent";
                   e.currentTarget.style.color = "#6b7280";
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={handleAssignProjects}
                 disabled={selectedProjects.length === 0}
                 style={{
                   padding: "10px 20px",
                   backgroundColor: selectedProjects.length > 0 ? "#3b82f6" : "#9ca3af",
                   color: "white",
                   border: "none",
                   borderRadius: "6px",
                   cursor: selectedProjects.length > 0 ? "pointer" : "not-allowed",
                   fontSize: "14px",
                   fontWeight: "500",
                   transition: "all 0.2s ease",
                 }}
                 onMouseEnter={(e) => {
                   if (selectedProjects.length > 0) {
                     e.currentTarget.style.backgroundColor = "#2563eb";
                   }
                 }}
                 onMouseLeave={(e) => {
                   if (selectedProjects.length > 0) {
                     e.currentTarget.style.backgroundColor = "#3b82f6";
                   }
                 }}
               >
                 Assign {selectedProjects.length} Project{selectedProjects.length !== 1 ? 's' : ''}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* CSS for spinner animation */}
       <style jsx>{`
         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }
       `}</style>
     </div>
   );
 };
