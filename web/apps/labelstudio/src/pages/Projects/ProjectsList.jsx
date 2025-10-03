import chr from "chroma-js";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { IconCheck, IconEllipsis, IconMinus, IconSparks, IconSearch } from "@humansignal/icons";
import { Userpic } from "@humansignal/ui";
import { Button, Dropdown, Menu } from "../../components";
import { Block, Elem } from "../../utils/bem";
import { absoluteURL } from "../../utils/helpers";

const DEFAULT_CARD_COLORS = ["#FFFFFF", "#FDFDFC"];
const ROWS_PER_PAGE = 15; // number of rows per page

export const ProjectsList = ({ projects, pageSize }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true); // 👈 loader state

  useEffect(() => {
    // simulate loader, jab projects aa jaye to hide loader
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [projects]);

  const totalPages = Math.ceil(projects.length / ROWS_PER_PAGE);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1)),
    onSwipedRight: () => setCurrentPage((prev) => Math.max(prev - 1, 0)),
    trackMouse: true,
  });

  const filteredProjects = projects.filter((project) =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = currentPage * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;

  const visibleProjects =
    filteredProjects.length <= ROWS_PER_PAGE
      ? filteredProjects
      : filteredProjects.slice(startIndex, endIndex);

  return (
    <div>
      {/* Search Section */}
      <div style={{ display: "flex", justifyContent: "center", padding: "5px 20px" }}>
        {showSearch ? (
          <input
            type="text"
            autoFocus
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            onBlur={() => {
              if (searchQuery === "") setShowSearch(false);
            }}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",   // 👈 lighter border (#e5e7eb is lighter grey)
              fontSize: "14px",
              transition: "all 0.3s ease-in-out",
            }}

          />
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <IconSearch style={{ width: 22, height: 22, color: "#374151" }} />
          </button>
        )}
      </div>

      {/* Loader Section */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#6b7280" }}>
          <div className="spinner" style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #374151",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 1s linear infinite"
          }} />
          <p>Loading projects...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      ) : (
        <div {...(filteredProjects.length > ROWS_PER_PAGE ? handlers : {})} style={{ overflow: "hidden" }}>
          <Elem
            name="list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
              padding: "5px",
              transition: "transform 0.3s ease",
            }}
          >
            {visibleProjects.length > 0 ? (
              visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>
                No projects found.
              </p>
            )}
          </Elem>

          {filteredProjects.length > ROWS_PER_PAGE && (
            <Elem
              name="pages"
              style={{ 
                marginTop: "30px", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap"
              }}
            >
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: currentPage === 0 ? "#f9fafb" : "#ffffff",
                  color: currentPage === 0 ? "#9ca3af" : "#374151",
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  opacity: currentPage === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 0) {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 0) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {(() => {
                const totalPages = Math.ceil(filteredProjects.length / ROWS_PER_PAGE);
                const pages = [];
                
                // Show first page
                if (totalPages > 0) {
                  pages.push(
                    <button
                      key={0}
                      onClick={() => setCurrentPage(0)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: currentPage === 0 ? "#374151" : "#ffffff",
                        color: currentPage === 0 ? "#ffffff" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        minWidth: "40px",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 0) {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== 0) {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                      }}
                    >
                      1
                    </button>
                  );
                }

                // Show ellipsis if needed
                if (currentPage > 3) {
                  pages.push(
                    <span key="ellipsis1" style={{ padding: "0 8px", color: "#6b7280" }}>
                      ...
                    </span>
                  );
                }

                // Show pages around current page
                const startPage = Math.max(1, currentPage - 1);
                const endPage = Math.min(totalPages - 1, currentPage + 1);
                
                for (let i = startPage; i <= endPage; i++) {
                  if (i !== 0 && i !== totalPages - 1) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          background: currentPage === i ? "#374151" : "#ffffff",
                          color: currentPage === i ? "#ffffff" : "#374151",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "all 0.2s ease",
                          minWidth: "40px",
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== i) {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#9ca3af";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== i) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                }

                // Show ellipsis if needed
                if (currentPage < totalPages - 4) {
                  pages.push(
                    <span key="ellipsis2" style={{ padding: "0 8px", color: "#6b7280" }}>
                      ...
                    </span>
                  );
                }

                // Show last page
                if (totalPages > 1) {
                  pages.push(
                    <button
                      key={totalPages - 1}
                      onClick={() => setCurrentPage(totalPages - 1)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: currentPage === totalPages - 1 ? "#374151" : "#ffffff",
                        color: currentPage === totalPages - 1 ? "#ffffff" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        minWidth: "40px",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages - 1) {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== totalPages - 1) {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1, currentPage + 1))}
                disabled={currentPage === Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: currentPage === Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1 ? "#f9fafb" : "#ffffff",
                  color: currentPage === Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1 ? "#9ca3af" : "#374151",
                  cursor: currentPage === Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  opacity: currentPage === Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1) {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== Math.ceil(filteredProjects.length / ROWS_PER_PAGE) - 1) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
              >
                Next
              </button>

              {/* Page Info */}
              <div style={{
                marginLeft: "16px",
                fontSize: "14px",
                color: "#6b7280",
                fontWeight: "500",
              }}>
                Page {currentPage + 1} of {Math.ceil(filteredProjects.length / ROWS_PER_PAGE)}
              </div>
            </Elem>
          )}
        </div>
      )}
    </div>
  );
};

export const EmptyProjectsList = ({ openModal, showCreateButton = true }) => {
  return (
    <Block name="empty-projects-page">

      <Elem name="header" tag="h1">
        Heidi doesn't see any projects here!
      </Elem>
      <p>Create one and start labeling your data.</p>
      {showCreateButton && (
        <Elem name="action" tag={Button} onClick={openModal} look="primary">
          Create Project
        </Elem>
      )}
    </Block>
  );
};

const ProjectCard = ({ project }) => {
  const color = useMemo(() => {
    return DEFAULT_CARD_COLORS.includes(project.color) ? null : project.color;
  }, [project]);

  const projectColors = useMemo(() => {
    const textColor =
      color && chr(color).luminance() > 0.3
        ? "var(--color-neutral-inverted-content)"
        : "var(--color-neutral-inverted-content)";
    return color
      ? {
        "--header-color": color,
        "--background-color": chr(color).alpha(0.08).css(),
        "--text-color": textColor,
        "--border-color": chr(color).alpha(0.3).css(),
      }
      : {};
  }, [color]);

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  // Get project status for status dot
  const getProjectStatus = () => {
    // Check if project has a status field first
    if (project.status) {
      console.log(`Project ${project.id} has status field:`, project.status);
      if (project.status === 'completed' || project.status === 'finished') {
        return 'completed';
      } else if (project.status === 'annotated' || project.status === 'in_progress') {
        return 'annotated';
      } else {
        return 'active';
      }
    }
    
    // Fallback logic based on available data
    const totalAnnotations = project.total_annotations_number || 0;
    const skippedAnnotations = project.skipped_annotations_number || 0;
    const totalPredictions = project.total_predictions_number || 0;
    const finishedTasks = project.finished_task_number || 0;
    const totalTasks = project.total_task_number || 0;
    const isArchived = project.is_archived || false;
    
    // Debug logging to see what data we have
    console.log(`Project ${project.id} (${project.title}):`, {
      totalAnnotations,
      skippedAnnotations,
      totalPredictions,
      isArchived: project.is_archived,
      finishedTaskNumber: project.finished_task_number,
      totalTaskNumber: project.total_task_number,
      allProjectFields: Object.keys(project),
      project: project
    });
    
    // If project is archived, it's completed
    if (isArchived) {
      return 'completed'; // Green dot - archived project
    }
    // If project has finished all tasks, it's completed
    else if (totalTasks > 0 && finishedTasks >= totalTasks) {
      return 'completed'; // Green dot - all tasks finished
    }
    // If project has some work done (annotations, predictions, or finished tasks)
    else if (totalAnnotations > 0 || totalPredictions > 0 || finishedTasks > 0) {
      return 'annotated'; // Yellow dot - project is being worked on
    }
    // If project has no work done at all
    else {
      return 'active'; // Green dot - new project
    }
  };

  return (
    <Elem
      tag={NavLink}
      name="link"
      to={`/projects/${project.id}/data`}
      data-external
      style={{ textDecoration: "none" }}
    >
      <Block
        name="project-card"
        mod={{ colored: !!color }}
        style={{
          background: "#000000 !important",
          border: "1px solid #333333 !important",
          borderRadius: "8px !important",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5) !important",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          width: "100px !important",
          minWidth: "100px !important",
          maxWidth: "100px !important",
          minHeight: "140px",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.3s ease",
          padding: "12px",
          margin: "0 auto",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";
        }}
      >
        {/* Project Title - Black text on white background with enhanced styling */}
        <div style={{
          color: "black",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          marginBottom: "12px",
          letterSpacing: "0.3px",
          background: "linear-gradient(135deg, #ffffff, #f8fafc)",
          padding: "8px 10px",
          borderRadius: "10px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          position: "relative"
        }}>
          {project.title ?? "New project"}
          
          {/* Status Dot - Top Right Corner */}
          <div style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: getProjectStatus() === 'active' ? '#22c55e' : 
                            getProjectStatus() === 'annotated' ? '#f59e0b' : '#22c55e',
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            zIndex: 10
          }} />
        </div>

        {/* Three Stats Boxes - Very small and compact with enhanced styling */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "6px",
          marginBottom: "12px",
        }}>
          {/* Completed Box */}
          <div style={{
            flex: 1,
            background: "linear-gradient(135deg, #ffffff, #f0f9ff)",
            borderRadius: "8px",
            padding: "6px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
          }}
          >
            <IconCheck style={{ width: "12px", height: "12px", color: "#22c55e" }} />
            <div style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "black",
            }}>
              {project.total_annotations_number || 0}
            </div>
            <div style={{
              fontSize: "9px",
              color: "black",
              textAlign: "center",
            }}>
              Done
            </div>
          </div>
          
          {/* Skipped Box */}
          <div style={{
            flex: 1,
            background: "linear-gradient(135deg, #ffffff, #fef2f2)",
            borderRadius: "8px",
            padding: "6px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
          }}
          >
            <IconMinus style={{ width: "12px", height: "12px", color: "#ef4444" }} />
            <div style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "black",
            }}>
              {project.skipped_annotations_number || 0}
            </div>
            <div style={{
              fontSize: "9px",
              color: "black",
              textAlign: "center",
            }}>
              Skip
            </div>
          </div>
          
          {/* Predictions Box */}
          <div style={{
            flex: 1,
            background: "linear-gradient(135deg, #ffffff, #f0f9ff)",
            borderRadius: "8px",
            padding: "6px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
          }}
          >
            <IconSparks style={{ width: "12px", height: "12px", color: "#3b82f6" }} />
            <div style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "black",
            }}>
              {project.total_predictions_number || 0}
            </div>
            <div style={{
              fontSize: "9px",
              color: "black",
              textAlign: "center",
            }}>
              Pred
            </div>
          </div>
        </div>

        {/* Description Box - Small white box with black text and enhanced styling */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff, #f8fafc)",
          borderRadius: "8px",
          padding: "8px",
          marginBottom: "12px",
          minHeight: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
        }}>
          <div style={{
            color: "black",
            fontSize: "10px",
            textAlign: "center",
            lineHeight: "1.3",
            fontWeight: "400",
          }}>
            {project.description || "No description available."}
          </div>
        </div>

        {/* Footer - Black text on white background with enhanced styling */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "9px",
          color: "black",
          padding: "8px 10px",
          background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
        }}>
          <div>Updated {getTimeAgo(project.updated_at || project.created_at)}</div>
          <div>by {project.created_by?.username || "dhaneshwari"}</div>
        </div>

        {/* Three Dots Menu - Small and positioned */}
        <div style={{
          position: "absolute",
          top: "8px",
          right: "8px",
        }}>
          <Dropdown.Trigger
            content={
              <Menu contextual style={{ 
                backgroundColor: "white", 
                border: "1px solid #e5e7eb", 
                borderRadius: "6px", 
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                padding: "4px 0",
                minWidth: "140px",
              }}>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} href={`/projects/${project.id}/data`}>View Data</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} to={`/projects/${project.id}/data?labeling=1`}>Label</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} to={`/projects/${project.id}/settings`}>Settings</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} href={`/projects/${project.id}/export`}>Export</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} href={`/projects/${project.id}/import`}>Import</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #f3f4f6",
                }} href={`/projects/${project.id}/model`}>Model</Menu.Item>
                <Menu.Item style={{ 
                  backgroundColor: "white", 
                  color: "black", 
                  padding: "8px 12px", 
                  fontSize: "12px",
                  fontWeight: "500",
                }} href={`/projects/${project.id}/webhooks`}>Webhooks</Menu.Item>
              </Menu>
            }
          >
            <Button
              size="small"
              type="text"
              icon={<IconEllipsis style={{ color: "white", transform: "rotate(90deg)" }} />}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                padding: "4px",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
          </Dropdown.Trigger>
        </div>
      </Block>
    </Elem>
  );
};
