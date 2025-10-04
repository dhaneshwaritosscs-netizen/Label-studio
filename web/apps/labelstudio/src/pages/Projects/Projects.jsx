import React, { useState, useEffect } from "react";
import { useParams as useRouterParams } from "react-router";
import { Redirect } from "react-router-dom";
import { Button } from "../../components";
import { Oneof } from "../../components/Oneof/Oneof";
import { ApiContext } from "../../providers/ApiProvider";
import { useContextProps } from "../../providers/RoutesProvider";
import { useUserRoles } from "../../hooks/useUserRoles";
import { useCurrentUser } from "../../providers/CurrentUser";
import { Block, Elem } from "../../utils/bem";
import { CreateProject } from "../CreateProject/CreateProject";
import { DataManagerPage } from "../DataManager/DataManager";
import { SettingsPage } from "../Settings";
import "./Projects.scss";
import { EmptyProjectsList, ProjectsList } from "./ProjectsList";
import { useAbortController } from "@humansignal/core";

const getCurrentPage = () => {
  const pageNumberFromURL = new URLSearchParams(location.search).get("page");

  return pageNumberFromURL ? Number.parseInt(pageNumberFromURL) : 1;
};

export const ProjectsPage = () => {
  const api = React.useContext(ApiContext);
  const abortController = useAbortController();
  const { hasRole, userRoles, loadingRoles } = useUserRoles();
  const { user: currentUser } = useCurrentUser();
  const [projectsList, setProjectsList] = React.useState([]);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const [userProjectAssignments, setUserProjectAssignments] = useState({});
  const setContextProps = useContextProps();
  const defaultPageSize = Number.parseInt(localStorage.getItem("pages:projects-list") ?? 30);

  const [modal, setModal] = React.useState(false);

  // Check if user is the specific admin - more robust check
  const userEmail = currentUser?.email?.toLowerCase()?.trim();
  const adminEmail = 'dhaneshwari.tosscss@gmail.com'.toLowerCase().trim();
  const isSpecificAdmin = userEmail === adminEmail;
  
  // Additional check - if currentUser is not loaded yet, check if we're on the right page
  const isAdminByEmail = currentUser?.email === 'dhaneshwari.tosscss@gmail.com' || 
                        userEmail === adminEmail ||
                        (currentUser && currentUser.email && currentUser.email.includes('dhaneshwari.tosscss@gmail.com'));

  // Check if user is admin or client
  const isAdmin = hasRole('admin') || isSpecificAdmin || isAdminByEmail; // Multiple fallbacks
  const isClient = !isAdmin; // If not admin, consider as client

  // Debug user roles
  console.log("=== PROJECTS DEBUG START ===");
  console.log("User roles:", userRoles);
  console.log("Loading roles:", loadingRoles);
  console.log("Is admin:", isAdmin);
  console.log("Is client:", isClient);
  console.log("Current user email:", currentUser?.email);
  console.log("Is specific admin:", isSpecificAdmin);
  console.log("Is admin by email:", isAdminByEmail);
  console.log("Current user object:", currentUser);
  console.log("hasRole('admin') result:", hasRole('admin'));
  console.log("User email comparison:");
  console.log("- User email:", currentUser?.email);
  console.log("- Admin email:", 'dhaneshwari.tosscss@gmail.com');
  console.log("- Match:", currentUser?.email === 'dhaneshwari.tosscss@gmail.com');
  console.log("- Lowercase match:", userEmail === adminEmail);
  console.log("- Final isAdmin result:", isAdmin);
  console.log("=== PROJECTS DEBUG END ===");

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  // Load user project assignments from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userProjectAssignments');

      if (saved) {
        setUserProjectAssignments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading user project assignments:', error);
    }
  }, []);

  const fetchProjects = async (page = currentPage, pageSize = defaultPageSize) => {
    try {
      abortController.renew(); // Cancel any in flight requests

      console.log("User role check - isAdmin:", isAdmin, "isClient:", isClient);
      console.log("Current user:", currentUser);

      const requestParams = { page, page_size: pageSize };
      
      // For admin, increase page size to ensure we get all their projects
      if (isAdmin) {
        requestParams.page_size = 1000; // Large page size to get all admin projects
        console.log("Admin user detected, fetching projects created by:", currentUser.id);
      }

      requestParams.include = [
        "id",
        "title",
        "created_by",
        "created_at",
        "color",
        "is_published",
        "assignment_settings",
      ].join(",");

      // For admin users, fetch only projects created by them
      if (isAdmin) {
        requestParams.created_by = currentUser.id;
        requestParams.show_all = true; // Ensure we get all projects created by admin
        console.log("Fetching projects for admin user ID:", currentUser.id);
      } else {
        // For debugging, let's see what happens if we fetch all projects
        console.log("Fetching all projects for debugging");
        requestParams.show_all = true;
      }

      const data = await api.callApi("projects", {
        params: requestParams,
        signal: abortController.controller.current.signal,
        errorFilter: (e) => e.error.includes("aborted"),
      });

      console.log("API response:", data);
      console.log("Request params:", requestParams);

    // Filter projects based on user role and assignments
    let filteredProjects = (data && data.results) ? data.results : [];
    
    if (currentUser) {
      if (isAdmin) {
        // Admin sees only projects they created (already filtered by backend)
        console.log("Admin projects from backend:", filteredProjects.length);
      } else {
        // Client sees only assigned projects
        const currentUserAssignments = userProjectAssignments[currentUser.id] || [];
        console.log("Current user ID:", currentUser.id);
        console.log("User assignments:", currentUserAssignments);
        console.log("All projects:", filteredProjects.length);
        
        if (currentUserAssignments.length > 0) {
          filteredProjects = filteredProjects.filter(project => 
            currentUserAssignments.includes(project.id)
          );
          console.log("Filtered projects:", filteredProjects.length);
        } else {
          console.log("No assignments found, showing empty list");
          filteredProjects = [];
        }
      }
    }

    setTotalItems(filteredProjects.length);
    setProjectsList(filteredProjects);

    if (filteredProjects.length > 0) {
      try {
        const additionalData = await api.callApi("projects", {
          params: {
            ids: filteredProjects.map(({ id }) => id).join(","),
            include: [
              "id",
              "description",
              "num_tasks_with_annotations",
              "task_number",
              "skipped_annotations_number",
              "total_annotations_number",
              "total_predictions_number",
              "ground_truth_number",
              "finished_task_number",
            ].join(","),
            page_size: pageSize,
          },
          signal: abortController.controller.current.signal,
          errorFilter: (e) => e.error.includes("aborted"),
        });

        if (additionalData && additionalData.results && additionalData.results.length > 0) {
          setProjectsList((prev) =>
            additionalData.results.map((project) => {
              const prevProject = prev.find(({ id }) => id === project.id);

              return {
                ...prevProject,
                ...project,
              };
            }),
          );
        }
      } catch (additionalError) {
        console.error("Error fetching additional project data:", additionalError);
        // Continue with basic project data even if additional data fails
      }
    }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setTotalItems(0);
      setProjectsList([]);
    }
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  React.useEffect(() => {
    // Wait for user roles to load before fetching projects
    if (!loadingRoles && currentUser) {
      fetchProjects();
    }
  }, [loadingRoles, currentUser]);

  // Refetch projects when user assignments change
  React.useEffect(() => {
    if (currentUser && Object.keys(userProjectAssignments).length > 0) {
      fetchProjects();
    }
  }, [userProjectAssignments, currentUser]);

  React.useEffect(() => {
    // there is a nice page with Create button when list is empty
    // so don't show the context button in that case
    setContextProps({ openModal, showButton: projectsList.length > 0 && isSpecificAdmin });
  }, [projectsList.length, isSpecificAdmin]);

  // All users see their assigned projects
  return (
    <Block name="projects-page">
      {/* Header Section without Dashboard Badge */}
      <div style={{
        textAlign: "center",
        padding: "0",
        margin: "0",
        background: "transparent",
        backgroundColor: "transparent",
        borderRadius: "0",
        boxShadow: "none",
        border: "none",
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "700",
          margin: "0 0 16px",
          background: "linear-gradient(135deg, #2d3748, #4a5568)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          {isAdmin ? "Your Created Projects" : "Your Assigned Projects"}
        </h1>
        <p style={{
          fontSize: "20px",
          color: "#4a5568",
          margin: "0 0 32px",
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: "1.6",
        }}>
          {isAdmin ? "View and manage the projects you have created" : "View and manage the projects assigned to you"}
        </p>
        <div style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {isSpecificAdmin && (
            <Button 
              onClick={openModal} 
              look="primary" 
              size="large"
              style={{
                background: "rgb(25 44 89)",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                transition: "all 0.3s ease",
                width: "250px",
                minWidth: "200px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
              }}
            >
              ✨ Create New Project
            </Button>
          )}
          <Button 
            look="secondary" 
            size="large"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              border: "2px solid rgba(102, 126, 234, 0.2)",
              color: "#4a5568",
              padding: "16px 32px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              width: "250px",
              minWidth: "200px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
            }}
          >
            📊 View Analytics
          </Button>
        </div>
      </div>

      {projectsList.length ? (
        <ProjectsList
          projects={projectsList}
          currentPage={currentPage}
          totalItems={totalItems}
          loadNextPage={loadNextPage}
          pageSize={defaultPageSize}
        />
      ) : (
        <EmptyProjectsList openModal={openModal} showCreateButton={isSpecificAdmin} />
      )}
      {modal && <CreateProject onClose={closeModal} />}
    </Block>
  );
};

ProjectsPage.title = "Projects";
ProjectsPage.path = "/projects";
ProjectsPage.exact = true;
ProjectsPage.routes = ({ store }) => [
  {
    title: () => store.project?.title,
    path: "/:id(\\d+)",
    exact: true,
    component: () => {
      const params = useRouterParams();

      return <Redirect to={`/projects/${params.id}/data`} />;
    },
    pages: {
      DataManagerPage,
      SettingsPage,
    },
  },
];
ProjectsPage.context = ({ openModal, showButton }) => {
  if (!showButton) return null;
  return (
    <Button 
      onClick={openModal} 
      look="primary" 
      size="compact"
      style={{
        background: "rgb(25 44 89)",
        border: "none",
        color: "#ffffff",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
      }}
    >
      Create
    </Button>
  );
};
