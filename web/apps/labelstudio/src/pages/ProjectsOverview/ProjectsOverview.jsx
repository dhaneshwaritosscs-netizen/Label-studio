import React, { useState, useEffect } from "react";
import { Block, Elem } from "../../utils/bem";
import { ApiContext } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useUserRoles } from "../../hooks/useUserRoles";
import { TopNavigationBar } from "../../components/TopNavigationBar";
import "./ProjectsOverview.scss";

export const ProjectsOverview = () => {
  const api = React.useContext(ApiContext);
  const { user } = useCurrentUser();
  const { hasRole } = useUserRoles();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedProjectUsers, setSelectedProjectUsers] = useState([]);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectPosition, setSelectedProjectPosition] = useState({ top: 0, left: 0 });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState(null);
  const [selectedProjectTitleForAssign, setSelectedProjectTitleForAssign] = useState('');

  // Determine user role
  const isAdmin = hasRole('admin');
  const isClient = hasRole('client') || (!isAdmin && user); // Default to client if not admin

  // Fetch all projects from backend
  useEffect(() => {
    const fetchAllProjects = async () => {
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
            show_all: true, // Admin sees all projects including client projects
            page_size: 1000,
            include: "id,title,created_by,created_at,is_published,task_number,total_annotations_number,finished_task_number"
          }
        });

        // Get list of projects that should be hidden for this user
        const hiddenProjects = JSON.parse(localStorage.getItem(`hiddenProjects_${user.id}`) || '[]');

        if (projectsResponse.results) {
          // Filter out projects that should be hidden for this user
          const visibleProjects = projectsResponse.results.filter(project => 
            !hiddenProjects.includes(project.id)
          );

          // Get user's assigned projects from localStorage
          const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
          const userAssignments = userProjectAssignments[user.id] || [];

          // For client users, include both created projects and assigned projects
          let filteredProjects = visibleProjects;
          if (isClient) {
            filteredProjects = visibleProjects.filter(project => 
              project.created_by?.id === user.id || 
              userAssignments.includes(project.id)
            );
            console.log(`Client ${user.email}: Found ${filteredProjects.length} projects (created + assigned)`);
            console.log(`User assignments:`, userAssignments);
          }

          // Get manual status changes from localStorage
          const manualStatusChanges = JSON.parse(localStorage.getItem('projectManualStatus') || '{}');

          // Process projects and categorize them
          const processedProjects = filteredProjects.map(project => {
            const totalTasks = project.task_number || 0;
            const finishedTasks = project.finished_task_number || 0;
            const totalAnnotations = project.total_annotations_number || 0;
            
            // Check if this project has a manual status change
            const manualStatus = manualStatusChanges[project.id];
            
            let category = 'active';
            let statusText = 'working on';
            
            if (manualStatus) {
              // Use manual status if available
              if (manualStatus === 'annotated') {
                category = 'pipeline';
                statusText = 'annotated';
              } else if (manualStatus === 'completed') {
                category = 'archived';
                statusText = 'completed';
              } else if (manualStatus === 'active') {
                category = 'active';
                statusText = 'working on';
              }
            } else {
              // Use automatic status based on task completion
              if (totalAnnotations > 0 && finishedTasks < totalTasks) {
                statusText = 'annotated';
              } else if (finishedTasks >= totalTasks && totalTasks > 0) {
                statusText = 'completed';
              }
            }

            return {
              id: project.id,
              title: project.title,
              description: project.description || '',
              created_by: project.created_by,
              created_at: project.created_at,
              is_published: project.is_published,
              task_number: totalTasks,
              finished_task_number: finishedTasks,
              total_annotations_number: totalAnnotations,
              category: category,
              statusText: statusText,
              project_type: 'Annotation', // Default type, can be enhanced later
              manager: 'Client'
            };
          });

          setProjects(processedProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again.");
        // Set mock data for testing
        setProjects([
          {
            id: 1210,
            title: "affinity",
            description: "b",
            created_by: { email: "admin@example.com", first_name: "Admin" },
            created_at: "2025-01-15T10:00:00Z",
            is_published: true,
            task_number: 100,
            finished_task_number: 0,
            total_annotations_number: 0,
            category: 'active',
            statusText: 'working on',
            project_type: 'Annotation',
            manager: 'Client'
          },
          {
            id: 3901,
            title: "Fruit and Food Annotation",
            description: "Bounding box and category Labelling",
            created_by: { email: "aditi@example.com", first_name: "Aditi", last_name: "Sakaria" },
            created_at: "2025-01-16T09:00:00Z",
            is_published: true,
            task_number: 200,
            finished_task_number: 50,
            total_annotations_number: 75,
            category: 'active',
            statusText: 'annotated',
            project_type: 'Annotation',
            manager: 'Client'
          },
          {
            id: 3673,
            title: "Humanface",
            description: "Humanface",
            created_by: { email: "admin@example.com", first_name: "Admin" },
            created_at: "2025-01-17T11:00:00Z",
            is_published: true,
            task_number: 150,
            finished_task_number: 150,
            total_annotations_number: 300,
            category: 'archived',
            project_type: 'Text-Based',
            manager: 'Client'
          },
          {
            id: 2246,
            title: "Maldives2 ICD10",
            description: "NER + Relationship",
            created_by: { email: "nikesh@example.com", first_name: "Nikesh" },
            created_at: "2025-01-18T14:00:00Z",
            is_published: true,
            task_number: 300,
            finished_task_number: 100,
            total_annotations_number: 150,
            category: 'active',
            statusText: 'annotated',
            project_type: 'Annotation',
            manager: 'Client'
          },
          {
            id: 2594,
            title: "PHI project",
            description: "Text Annotation",
            created_by: { email: "nikesh@example.com", first_name: "Nikesh" },
            created_at: "2025-01-19T16:00:00Z",
            is_published: true,
            task_number: 80,
            finished_task_number: 0,
            total_annotations_number: 0,
            category: 'active',
            statusText: 'working on',
            project_type: 'Annotation',
            manager: 'Client'
          },
          {
            id: 2438,
            title: "RapTable Annotation",
            description: "Text Annotation",
            created_by: { email: "nikesh@example.com", first_name: "Nikesh" },
            created_at: "2025-01-20T10:00:00Z",
            is_published: true,
            task_number: 120,
            finished_task_number: 60,
            total_annotations_number: 90,
            category: 'active',
            statusText: 'annotated',
            project_type: 'Annotation',
            manager: 'Client'
          },
          {
            id: 2955,
            title: "ROW 129 - Audio cut check",
            description: "Audio cut check",
            created_by: { email: "darshan@example.com", first_name: "Darshan", last_name: "Bhatt" },
            created_at: "2025-01-21T12:00:00Z",
            is_published: true,
            task_number: 50,
            finished_task_number: 50,
            total_annotations_number: 100,
            category: 'active',
            statusText: 'completed',
            project_type: 'Audio',
            manager: 'Client'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, [user, api]);

  // Filter and sort projects based on current tab and search
  const getFilteredProjects = () => {
    let filtered = projects.filter(project => {
      // Filter out projects that have been removed for the current user
      if (project.removedUsers && project.removedUsers.includes(user?.id)) {
        return false;
      }

      // Role-based project visibility filtering
      if (isClient) {
        // Client users should see their created projects AND assigned projects
        const projectCreatorEmail = project.created_by?.email;
        const isProjectCreatedByAdmin = projectCreatorEmail === 'dhaneshwari.tosscss@gmail.com';
        const isProjectCreatedByUser = project.created_by?.id === user?.id;
        
        // Get user's assigned projects from localStorage
        const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
        const userAssignments = userProjectAssignments[user?.id] || [];
        const isProjectAssignedToUser = userAssignments.includes(project.id);
        
        // Show project if: created by user OR assigned to user
        if (!isProjectCreatedByUser && !isProjectAssignedToUser) {
          return false;
        }
      }
      // Admin users can see all projects (no additional filtering needed)

      // Tab-based filtering
      if (isClient) {
        // For client users, filter by project status instead of category
        if (activeTab === 'active') {
          if (project.statusText !== 'working on') return false;
        } else if (activeTab === 'pipeline') {
          if (project.statusText !== 'annotated') return false;
        } else if (activeTab === 'archived') {
          if (project.statusText !== 'completed') return false;
        } else if (activeTab === 'all') {
          // Show all projects for client users
          // No additional filtering needed
        }
      } else {
        // For admin users, use existing category-based filtering
        if (activeTab === 'active') {
          if (project.category !== 'active') return false;
        } else if (activeTab === 'pipeline') {
          if (project.category !== 'pipeline') return false;
        } else if (activeTab === 'archived') {
          if (project.category !== 'archived') return false;
        }
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Get manager value using the same logic as display
        const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
        const clientUserAssignments = JSON.parse(localStorage.getItem('clientUserAssignments') || '{}');
        
        const isAssignedToUser = Object.values(userProjectAssignments).some(projectIds => 
          projectIds.includes(project.id)
        );
        
        const isAssignedToClient = Object.keys(clientUserAssignments).some(clientId => 
          clientUserAssignments[clientId] && 
          Object.keys(clientUserAssignments[clientId]).some(projectId => 
            parseInt(projectId) === project.id
          )
        );
        
        let managerRole = '-';
        if (isAssignedToClient) {
          managerRole = 'client';
        } else if (isAssignedToUser) {
          managerRole = 'user';
        }
        
        return project.title.toLowerCase().includes(searchLower) ||
               project.description.toLowerCase().includes(searchLower) ||
               managerRole.includes(searchLower);
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortBy === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else if (sortBy === 'manager') {
        // Get manager value using the same logic as display
        const getUserProjectAssignments = () => JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
        const getClientUserAssignments = () => JSON.parse(localStorage.getItem('clientUserAssignments') || '{}');
        
        const getManagerValue = (project) => {
          const userProjectAssignments = getUserProjectAssignments();
          const clientUserAssignments = getClientUserAssignments();
          
          const isAssignedToUser = Object.values(userProjectAssignments).some(projectIds => 
            projectIds.includes(project.id)
          );
          
          const isAssignedToClient = Object.keys(clientUserAssignments).some(clientId => 
            clientUserAssignments[clientId] && 
            Object.keys(clientUserAssignments[clientId]).some(projectId => 
              parseInt(projectId) === project.id
            )
          );
          
          if (isAssignedToClient) return 'client';
          if (isAssignedToUser) return 'user';
          return 'unassigned';
        };
        
        aVal = getManagerValue(a);
        bVal = getManagerValue(b);
      } else {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  };

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'Annotation':
        return '📄';
      case 'Text-Based':
        return 'Tt';
      case 'Audio':
        return '🔊';
      default:
        return '📄';
    }
  };

  const handleBackToDashboard = () => {
    window.history.back();
  };

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvHeaders = [
        'ID',
        'Project Name', 
        'Project Type',
        'Manager',
        'Status',
        'Created By',
        'Created At',
        'Task Number',
        'Total Annotations',
        'Finished Tasks',
        'Is Published'
      ];

      const csvData = projects.map(project => [
        project.id || '',
        project.title || '',
        'Annotation', // Default project type
        'Admin', // Default manager
        project.is_published ? 'Active' : 'Inactive',
        project.created_by?.email || '',
        project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
        project.task_number || 0,
        project.total_annotations_number || 0,
        project.finished_task_number || 0,
        project.is_published ? 'Yes' : 'No'
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Projects exported successfully');
    } catch (error) {
      console.error('Error exporting projects:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleEyeClick = async (projectId, projectTitle) => {
    try {
      setSelectedProjectTitle(projectTitle);
      setShowUserModal(true);
      
      // Get all users assigned to this project from localStorage
      const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
      const clientUserAssignments = JSON.parse(localStorage.getItem('clientUserAssignments') || '{}');
      
      // Find all users assigned to this project
      const assignedUsers = [];
      
      if (isAdmin) {
        // Admin sees all users assigned to this project
        // Check regular user assignments
        Object.keys(userProjectAssignments).forEach(userId => {
          const userProjects = userProjectAssignments[userId] || [];
          if (userProjects.includes(projectId)) {
            assignedUsers.push({ userId: parseInt(userId), assignmentType: 'user' });
          }
        });
        
        // Check client user assignments
        Object.keys(clientUserAssignments).forEach(clientId => {
          const clientProjects = clientUserAssignments[clientId] || {};
          Object.keys(clientProjects).forEach(projectIdKey => {
            if (parseInt(projectIdKey) === projectId) {
              const clientProjectUsers = clientProjects[projectIdKey] || [];
              clientProjectUsers.forEach(userId => {
                assignedUsers.push({ userId: parseInt(userId), assignmentType: 'client' });
              });
            }
          });
        });
      } else {
        // Client sees only their own users assigned to this project
        const currentClientId = user?.id;
        if (currentClientId && clientUserAssignments[currentClientId]) {
          const clientProjects = clientUserAssignments[currentClientId] || {};
          const projectUsers = clientProjects[projectId] || [];
          projectUsers.forEach(userId => {
            assignedUsers.push({ userId: parseInt(userId), assignmentType: 'client' });
          });
        }
      }
      
      // Fetch user details for all assigned users
      if (assignedUsers.length > 0) {
        try {
          const usersResponse = await api.callApi("memberships", {
            params: {
              pk: 1,
              contributed_to_projects: 1,
              page_size: 1000,
              include: "id,email,first_name,last_name,date_joined,last_activity"
            }
          });
          
          if (usersResponse.results) {
            const assignedUserIds = [...new Set(assignedUsers.map(u => u.userId))];
            const projectUsers = usersResponse.results
              .filter(({ user }) => assignedUserIds.includes(user.id))
              .map(({ user }) => ({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                date_joined: user.date_joined,
                last_activity: user.last_activity
              }));
            
            setSelectedProjectUsers(projectUsers);
          } else {
            setSelectedProjectUsers([]);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setSelectedProjectUsers([]);
        }
      } else {
        // If no assigned users found, show the project creator
        const project = projects.find(p => p.id === projectId);
        if (project && project.created_by) {
          setSelectedProjectUsers([{
            id: project.created_by.id,
            email: project.created_by.email,
            first_name: project.created_by.first_name,
            last_name: project.created_by.last_name,
            created_at: project.created_at
          }]);
        } else {
          setSelectedProjectUsers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching project users:", error);
      setSelectedProjectUsers([]);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedProjectUsers([]);
    setSelectedProjectTitle('');
  };

  const handleActionsClick = (projectId, event) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    setSelectedProjectId(projectId);
    setSelectedProjectPosition({
      top: rect.bottom + 5,
      left: rect.left - 100
    });
    setShowActionsMenu(true);
  };

  const closeActionsMenu = () => {
    setShowActionsMenu(false);
    setSelectedProjectId(null);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      // Update project status in backend
      await api.callApi(`projects/${projectId}`, {
        method: 'PATCH',
        data: {
          status: newStatus
        }
      });

      // Store the manual status change in localStorage for persistence
      const manualStatusChanges = JSON.parse(localStorage.getItem('projectManualStatus') || '{}');
      manualStatusChanges[projectId] = newStatus;
      localStorage.setItem('projectManualStatus', JSON.stringify(manualStatusChanges));

      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            let category = 'active';
            let statusText = 'working on';
            
            if (newStatus === 'annotated') {
              category = 'pipeline';
              statusText = 'annotated';
            } else if (newStatus === 'completed') {
              category = 'archived';
              statusText = 'completed';
            }
            
            return { ...project, category, statusText };
          }
          return project;
        })
      );

      console.log(`Project ${projectId} status changed to ${newStatus} and saved to localStorage`);
      closeActionsMenu();
    } catch (error) {
      console.error("Error updating project status:", error);
      
      // Still store the manual status change in localStorage even if API fails
      const manualStatusChanges = JSON.parse(localStorage.getItem('projectManualStatus') || '{}');
      manualStatusChanges[projectId] = newStatus;
      localStorage.setItem('projectManualStatus', JSON.stringify(manualStatusChanges));
      
      // Still update local state for better UX
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            let category = 'active';
            let statusText = 'working on';
            
            if (newStatus === 'annotated') {
              category = 'pipeline';
              statusText = 'annotated';
            } else if (newStatus === 'completed') {
              category = 'archived';
              statusText = 'completed';
            }
            
            return { ...project, category, statusText };
          }
          return project;
        })
      );
      closeActionsMenu();
    }
  };

  const handleChartClick = async (projectId, projectTitle) => {
    try {
      setSelectedProjectForAssign(projectId);
      setSelectedProjectTitleForAssign(projectTitle);
      setShowAssignModal(true);
      
      // Fetch users assigned to this specific project
      const usersResponse = await api.callApi("projects", {
        params: {
          created_by: projectId, // This will get users who created this project
          page_size: 100
        }
      });

      if (usersResponse.results && usersResponse.results.length > 0) {
        // Get unique users who created this project
        const uniqueUsers = usersResponse.results.map(project => ({
          id: project.created_by?.id,
          email: project.created_by?.email,
          first_name: project.created_by?.first_name,
          last_name: project.created_by?.last_name,
          created_at: project.created_at,
          isAssigned: true // These users are currently assigned
        }));

        // Remove duplicates based on user ID
        const uniqueUsersMap = new Map();
        uniqueUsers.forEach(user => {
          if (user.id && !uniqueUsersMap.has(user.id)) {
            uniqueUsersMap.set(user.id, user);
          }
        });

        // Apply localStorage assignment changes
        const usersWithAssignmentStatus = Array.from(uniqueUsersMap.values()).map(user => {
          const assignmentKey = `project_${projectId}_user_${user.id}`;
          const assignmentStatus = localStorage.getItem(assignmentKey);
          
          console.log(`User ${user.email}: assignmentKey=${assignmentKey}, assignmentStatus=${assignmentStatus}`);
          
          if (assignmentStatus === 'removed') {
            console.log(`User ${user.email}: Setting isAssigned to false`);
            return { ...user, isAssigned: false };
          } else if (assignmentStatus === 'assigned') {
            console.log(`User ${user.email}: Setting isAssigned to true`);
            return { ...user, isAssigned: true };
          } else {
            console.log(`User ${user.email}: Default to assigned (no localStorage entry)`);
            return { ...user, isAssigned: true }; // Default to assigned if no localStorage entry
          }
        });
        
        setSelectedProjectUsers(usersWithAssignmentStatus);
      } else {
        // If no specific users found, show the project creator
        const project = projects.find(p => p.id === projectId);
        if (project && project.created_by) {
          const assignmentKey = `project_${projectId}_user_${project.created_by.id}`;
          const assignmentStatus = localStorage.getItem(assignmentKey);
          const isAssigned = assignmentStatus !== 'removed';
          
          setSelectedProjectUsers([{
            id: project.created_by.id,
            email: project.created_by.email,
            first_name: project.created_by.first_name,
            last_name: project.created_by.last_name,
            created_at: project.created_at,
            isAssigned: isAssigned
          }]);
        } else {
          setSelectedProjectUsers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching project users:", error);
      setSelectedProjectUsers([]);
    }
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedProjectUsers([]);
    setSelectedProjectForAssign(null);
    setSelectedProjectTitleForAssign('');
  };

  const handleAssignUser = async (userId, action) => {
    console.log(`handleAssignUser called: userId=${userId}, action=${action}`);
    try {
      if (action === 'assign') {
        // Update UI immediately for instant feedback
        setSelectedProjectUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? { ...u, isAssigned: true } : u)
        );

        // Save assignment change to localStorage for persistence
        const assignmentKey = `project_${selectedProjectForAssign}_user_${userId}`;
        localStorage.setItem(assignmentKey, 'assigned');
        
        console.log(`User ${userId} assigned to project ${selectedProjectForAssign} - UI updated instantly`);
        
        // Try API call in background (don't wait for it)
        try {
          await api.callApi(`projects/${selectedProjectForAssign}/assign`, {
            method: 'POST',
            data: {
              user_id: userId
            }
          });
          console.log(`User ${userId} assigned to project ${selectedProjectForAssign} via API`);
        } catch (apiError) {
          console.log(`API call failed, but UI already updated:`, apiError);
        }
      } else if (action === 'remove') {
        // Update UI immediately for instant feedback
        setSelectedProjectUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? { ...u, isAssigned: false } : u)
        );

        // Save assignment change to localStorage for persistence
        const assignmentKey = `project_${selectedProjectForAssign}_user_${userId}`;
        localStorage.setItem(assignmentKey, 'removed');
        
        console.log(`User ${userId} removed from project ${selectedProjectForAssign} - UI updated instantly`);
        
        // Try API call in background (don't wait for it)
        try {
          await api.callApi(`projects/${selectedProjectForAssign}/unassign`, {
            method: 'POST',
            data: {
              user_id: userId
            }
          });
          console.log(`User ${userId} removed from project ${selectedProjectForAssign} via API`);
        } catch (apiError) {
          console.log(`API call failed, but UI already updated:`, apiError);
        }
        
        // Client-specific logic: If current user is removed, show message and remove from list
        if (!isAdmin && userId === user?.id) {
          alert("You have been removed from this project.");
          
          // Remove project from client's list
          setProjects(prevProjects => 
            prevProjects.filter(project => project.id !== selectedProjectForAssign)
          );
          
          // Save to localStorage so project stays hidden on reload
          const hiddenProjects = JSON.parse(localStorage.getItem(`hiddenProjects_${user.id}`) || '[]');
          if (!hiddenProjects.includes(selectedProjectForAssign)) {
            hiddenProjects.push(selectedProjectForAssign);
            localStorage.setItem(`hiddenProjects_${user.id}`, JSON.stringify(hiddenProjects));
          }
          
          // Close modal
          closeAssignModal();
          return;
        }
        
        // Show success message
        alert(`User has been removed from the project successfully!`);
        
        // Just log the removal - no project deletion
        console.log(`User ${userId} removed from project ${selectedProjectForAssign}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      // Just log the error - no project deletion
      console.log(`Error ${action}ing user ${userId} from project ${selectedProjectForAssign}`);
    }
  };

  const filteredProjects = getFilteredProjects();
  
  // Calculate counts based on user role and project visibility
  const getVisibleProjects = () => {
    return projects.filter(project => {
      // Apply role-based visibility filtering
      if (isClient) {
        const isProjectCreatedByUser = project.created_by?.id === user?.id;
        
        // Get user's assigned projects from localStorage
        const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
        const userAssignments = userProjectAssignments[user?.id] || [];
        const isProjectAssignedToUser = userAssignments.includes(project.id);
        
        // Show project if: created by user OR assigned to user
        return isProjectCreatedByUser || isProjectAssignedToUser;
      }
      return true;
    });
  };

  const visibleProjects = getVisibleProjects();
  
  const activeCount = isClient 
    ? visibleProjects.filter(p => p.statusText === 'working on').length
    : visibleProjects.filter(p => p.category === 'active').length;
  const pipelineCount = isClient 
    ? visibleProjects.filter(p => p.statusText === 'annotated').length
    : visibleProjects.filter(p => p.category === 'pipeline').length;
  const archivedCount = isClient 
    ? visibleProjects.filter(p => p.statusText === 'completed').length
    : visibleProjects.filter(p => p.category === 'archived').length;

  if (loading) {
    return (
      <Block name="projects-overview-page">
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "20px",
          background: "#ffffff",
          minHeight: "100vh",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
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
        </div>
      </Block>
    );
  }

  return (
    <Block name="projects-overview-page">
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        background: "#ffffff",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Top Navigation Bar */}
        <TopNavigationBar />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px",
          paddingBottom: "10px",
          borderBottom: "2px solid #e5e7eb"
        }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: "0 0 8px 0"
            }}>
              Projects Overview
            </h1>
            <p style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: "0"
            }}>
              Complete list of all projects across the organization
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "0",
          marginBottom: "10px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          {isClient && (
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: "12px 24px",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === 'all' ? "2px solid #1a1a1a" : "2px solid transparent",
                color: activeTab === 'all' ? "#1a1a1a" : "#6b7280",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <span>📋</span>
              All Projects ({visibleProjects.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === 'active' ? "2px solid #1a1a1a" : "2px solid transparent",
              color: activeTab === 'active' ? "#1a1a1a" : "#6b7280",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            <span>📄</span>
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === 'pipeline' ? "2px solid #1a1a1a" : "2px solid transparent",
              color: activeTab === 'pipeline' ? "#1a1a1a" : "#6b7280",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            <span>🔄</span>
            Pipeline Projects ({pipelineCount})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === 'archived' ? "2px solid #1a1a1a" : "2px solid transparent",
              color: activeTab === 'archived' ? "#1a1a1a" : "#6b7280",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            <span>📦</span>
            Archived ({archivedCount})
          </button>
        </div>

        {/* Action Buttons and Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "16px"
        }}>
          <div style={{
            display: "flex",
            gap: "12px"
          }}>
            <button
              onClick={handleExport}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#8b5cf6",
                border: "1px solid #8b5cf6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#8b5cf6";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#8b5cf6";
              }}
            >
              <span>📥</span>
              EXPORT
            </button>
          </div>
          
          <div style={{
            position: "relative",
            flex: "1",
            maxWidth: "300px"
          }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: "100%",
                padding: "8px 12px 8px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                background: "white"
              }}
            />
            <span style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: "16px"
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
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
        )}

        {/* Projects Table */}
        <div style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 120px 120px 120px 80px",
            gap: "16px",
            padding: "16px 20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151"
          }}>
            <div>ID</div>
            <div 
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              onClick={() => handleSort('name')}
            >
              Project name
              {sortBy === 'name' && (
                <span style={{ fontSize: "12px" }}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div>Project Type</div>
            <div 
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              onClick={() => handleSort('manager')}
            >
              Manager
              {sortBy === 'manager' && (
                <span style={{ fontSize: "12px" }}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div>Manage</div>
            <div>{isClient ? 'Status' : 'Actions'}</div>
          </div>

          {/* Table Body */}
          <div style={{
            maxHeight: "600px",
            overflowY: "auto"
          }}>
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 120px 120px 120px 80px",
                  gap: "16px",
                  padding: "16px 20px",
                  borderBottom: index < filteredProjects.length - 1 ? "1px solid #f3f4f6" : "none",
                  fontSize: "14px",
                  alignItems: "center",
                  transition: "background-color 0.2s ease"
                }}
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
                    backgroundColor: "#1a1a1a",
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
                    cursor: "pointer",
                    marginBottom: "4px"
                  }}>
                    {project.title} {isAdmin && <span style={{
                      color: "#6b7280",
                      fontWeight: "400",
                      fontSize: "12px"
                    }}>({project.statusText})</span>}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280"
                  }}>
                    {project.description}
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <span style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>{getProjectTypeIcon(project.project_type)}</span>
                    {project.project_type}
                  </span>
                </div>

                {/* Manager */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#6b7280"
                }}>
                  {/* <span>👤</span> */}
                  {(() => {
                    // Check if project is assigned to any client or user
                    const userProjectAssignments = JSON.parse(localStorage.getItem('userProjectAssignments') || '{}');
                    const clientUserAssignments = JSON.parse(localStorage.getItem('clientUserAssignments') || '{}');
                    
                    // Check if project is assigned to any user
                    const isAssignedToUser = Object.values(userProjectAssignments).some(projectIds => 
                      projectIds.includes(project.id)
                    );
                    
                    // Check if project is assigned to any client
                    const isAssignedToClient = Object.keys(clientUserAssignments).some(clientId => 
                      clientUserAssignments[clientId] && 
                      Object.keys(clientUserAssignments[clientId]).some(projectId => 
                        parseInt(projectId) === project.id
                      )
                    );
                    
                    if (isAssignedToClient) {
                      return 'Client';
                    } else if (isAssignedToUser) {
                      return 'User';
                    } else {
                      return '-';
                    }
                  })()}
                </div>

                {/* Manage */}
                <div style={{
                  display: "flex",
                  gap: "8px"
                }}>
                  <button 
                    onClick={() => handleEyeClick(project.id, project.title)}
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#2563eb",
                      fontSize: "16px"
                    }}
                  >
                    👤
                  </button>
                  <button 
                    onClick={() => handleChartClick(project.id, project.title)}
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#2563eb",
                      fontSize: "16px"
                    }}
                  >
                    📊
                  </button>
                </div>

                {/* Actions or Status */}
                <div>
                  {user?.email === 'dhaneshwari.tosscss@gmail.com' ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: project.statusText === 'working on' ? "#10b981" : 
                               project.statusText === 'annotated' ? "#f59e0b" : "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <span style={{
                          color: project.statusText === 'working on' ? "#10b981" : 
                                 project.statusText === 'annotated' ? "#f59e0b" : "#6b7280"
                        }}>●</span>
                        {project.statusText === 'working on' ? 'Active' : 
                         project.statusText === 'annotated' ? 'Annotated' : 'Completed'}
                      </span>
                      <button 
                        onClick={(e) => handleActionsClick(project.id, e)}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#6b7280",
                          fontSize: "16px",
                          padding: "4px"
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                  ) : isClient ? (
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: project.statusText === 'working on' ? "#10b981" : 
                             project.statusText === 'annotated' ? "#f59e0b" : "#6b7280"
                    }}>
                      {project.statusText === 'working on' ? 'Active' : 
                       project.statusText === 'annotated' ? 'Annotated' : 'Completed'}
                    </span>
                  ) : (
                    <button 
                      onClick={(e) => handleActionsClick(project.id, e)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                        fontSize: "16px",
                        padding: "4px"
                      }}
                    >
                      ⋯
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
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
              {searchTerm ? `No projects found matching "${searchTerm}"` : `No ${activeTab} projects found`}
            </p>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
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
              maxWidth: "500px",
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
                  Users for "{selectedProjectTitle}"
                </h3>
                <button
                  onClick={closeUserModal}
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

              {/* Users List */}
              <div>
                {selectedProjectUsers.length > 0 ? (
                  <div>
                    <p style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 16px 0"
                    }}>
                      {selectedProjectUsers.length} user(s) worked on this project:
                    </p>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}>
                      {selectedProjectUsers.map((user, index) => (
                        <div
                          key={user.id || index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb"
                          }}
                        >
                          <div style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#6366f1",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "16px",
                            fontWeight: "600"
                          }}>
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : 
                             user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              marginBottom: "4px"
                            }}>
                              {user.first_name && user.last_name ? 
                                `${user.first_name} ${user.last_name}` :
                                user.first_name || user.email || 'Unknown User'
                              }
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#6b7280"
                            }}>
                              {user.email}
                            </div>
                            {user.created_at && (
                              <div style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                marginTop: "2px"
                              }}>
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#6b7280"
                  }}>
                    <div style={{
                      fontSize: "48px",
                      marginBottom: "16px"
                    }}>
                      👥
                    </div>
                    <h4 style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#374151",
                      margin: "0 0 8px 0"
                    }}>
                      No Users Found
                    </h4>
                    <p style={{
                      fontSize: "14px",
                      margin: "0"
                    }}>
                      No users found for this project.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={closeUserModal}
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions Menu Dropdown - Only for Admin users */}
        {showActionsMenu && isAdmin && (
          <div style={{
            position: "fixed",
            top: selectedProjectPosition.top,
            left: selectedProjectPosition.left,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
            minWidth: "150px"
          }}>
            <div style={{
              padding: "8px 0"
            }}>
              <button
                onClick={() => handleStatusChange(selectedProjectId, 'active')}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ color: "#10b981" }}>●</span>
                Active
              </button>
              <button
                onClick={() => handleStatusChange(selectedProjectId, 'annotated')}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ color: "#f59e0b" }}>●</span>
                Annotated
              </button>
              <button
                onClick={() => handleStatusChange(selectedProjectId, 'completed')}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ color: "#6b7280" }}>●</span>
                Completed
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close actions menu - Only for Admin users */}
        {showActionsMenu && isAdmin && (
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: 999
            }}
            onClick={closeActionsMenu}
          />
        )}

        {/* Assign/Remove User Modal */}
        {showAssignModal && (
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
                  Manage Users for "{selectedProjectTitleForAssign}"
                </h3>
                <button
                  onClick={closeAssignModal}
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

              {/* Users List */}
              <div>
                {selectedProjectUsers.length > 0 ? (
                  <div>
                    <p style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 16px 0"
                    }}>
                      {selectedProjectUsers.length} user(s) assigned to this project:
                    </p>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}>
                      {selectedProjectUsers.map((user, index) => (
                        <div
                          key={user.id || index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flex: 1
                          }}>
                            <div style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#6366f1",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "16px",
                              fontWeight: "600"
                            }}>
                              {user.first_name ? user.first_name.charAt(0).toUpperCase() : 
                               user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#1a1a1a",
                                marginBottom: "4px"
                              }}>
                                {user.first_name && user.last_name ? 
                                  `${user.first_name} ${user.last_name}` :
                                  user.first_name || user.email || 'Unknown User'
                                }
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#6b7280"
                              }}>
                                {user.email}
                              </div>
                              {user.created_at && (
                                <div style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  marginTop: "2px"
                                }}>
                                  Joined: {new Date(user.created_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{
                            display: "flex",
                            gap: "8px"
                          }}>
                            {isAdmin ? (
                              // Admin Logic
                              <>
                                {console.log(`Rendering buttons for user ${user.email}: isAssigned=${user.isAssigned}`)}
                                {user.isAssigned ? (
                                  <button
                                    disabled
                                    style={{
                                      padding: "6px 12px",
                                      backgroundColor: "#6b7280",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "not-allowed",
                                      opacity: 0.6
                                    }}
                                  >
                                    Assigned
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignUser(user.id, 'assign')}
                                    style={{
                                      padding: "6px 12px",
                                      backgroundColor: "#10b981",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#059669";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#10b981";
                                    }}
                                  >
                                    Assign
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    console.log(`Remove button clicked for user: ${user.id}, isAssigned: ${user.isAssigned}`);
                                    handleAssignUser(user.id, 'remove');
                                  }}
                                  disabled={!user.isAssigned}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: user.isAssigned ? "#ef4444" : "#6b7280",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: user.isAssigned ? "pointer" : "not-allowed",
                                    transition: "all 0.2s ease",
                                    opacity: user.isAssigned ? 1 : 0.6
                                  }}
                                  onMouseEnter={(e) => {
                                    if (user.isAssigned) {
                                      e.target.style.backgroundColor = "#dc2626";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (user.isAssigned) {
                                      e.target.style.backgroundColor = "#ef4444";
                                    }
                                  }}
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              // Client Logic
                              <>
                                {user.isAssigned ? (
                                  <button
                                    disabled
                                    style={{
                                      padding: "6px 12px",
                                      backgroundColor: "#6b7280",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "not-allowed",
                                      opacity: 0.6
                                    }}
                                  >
                                    Assigned
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignUser(user.id, 'assign')}
                                    style={{
                                      padding: "6px 12px",
                                      backgroundColor: "#10b981",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#059669";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#10b981";
                                    }}
                                  >
                                    Assign
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#6b7280"
                  }}>
                    <div style={{
                      fontSize: "48px",
                      marginBottom: "16px"
                    }}>
                      👥
                    </div>
                    <h4 style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#374151",
                      margin: "0 0 8px 0"
                    }}>
                      No Users Assigned
                    </h4>
                    <p style={{
                      fontSize: "14px",
                      margin: "0"
                    }}>
                      No users are currently assigned to this project.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={closeAssignModal}
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Block>
  );
};

ProjectsOverview.title = "Projects Overview";
ProjectsOverview.path = "/projects-overview";
ProjectsOverview.exact = true;
