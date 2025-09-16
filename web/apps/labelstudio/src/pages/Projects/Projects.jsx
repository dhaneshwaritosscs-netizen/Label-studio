import React, { useState } from "react";
import { useParams as useRouterParams } from "react-router";
import { Redirect } from "react-router-dom";
import { Button } from "../../components";
import { Oneof } from "../../components/Oneof/Oneof";
import { ApiContext } from "../../providers/ApiProvider";
import { useContextProps } from "../../providers/RoutesProvider";
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
  const [projectsList, setProjectsList] = React.useState([]);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const setContextProps = useContextProps();
  const defaultPageSize = Number.parseInt(localStorage.getItem("pages:projects-list") ?? 30);

  const [modal, setModal] = React.useState(false);

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  const fetchProjects = async (page = currentPage, pageSize = defaultPageSize) => {
    abortController.renew(); // Cancel any in flight requests

    const requestParams = { page, page_size: pageSize };

    requestParams.include = [
      "id",
      "title",
      "created_by",
      "created_at",
      "color",
      "is_published",
      "assignment_settings",
    ].join(",");

    const data = await api.callApi("projects", {
      params: requestParams,
      signal: abortController.controller.current.signal,
      errorFilter: (e) => e.error.includes("aborted"),
    });

    setTotalItems(data?.count ?? 1);
    setProjectsList(data.results ?? []);

    if (data?.results?.length) {
      const additionalData = await api.callApi("projects", {
        params: {
          ids: data?.results?.map(({ id }) => id).join(","),
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

      if (additionalData?.results?.length) {
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
    }
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  React.useEffect(() => {
    fetchProjects();
  }, []);

  React.useEffect(() => {
    // there is a nice page with Create button when list is empty
    // so don't show the context button in that case
    setContextProps({ openModal, showButton: projectsList.length > 0 });
  }, [projectsList.length]);

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
          Manage Your Projects
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
          Organize, track, and collaborate on your labeling projects with powerful tools and insights
        </p>
        <div style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
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
        <EmptyProjectsList openModal={openModal} />
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
