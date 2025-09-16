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
              style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "5px" }}
            >
              {Array.from({ length: Math.ceil(filteredProjects.length / ROWS_PER_PAGE) }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: index === currentPage ? "#374151" : "#d1d5db",
                    cursor: "pointer",
                  }}
                  onClick={() => setCurrentPage(index)}
                />
              ))}
            </Elem>
          )}
        </div>
      )}
    </div>
  );
};

export const EmptyProjectsList = ({ openModal }) => {
  return (
    <Block name="empty-projects-page">

      <Elem name="header" tag="h1">
        Heidi doesn’t see any projects here!
      </Elem>
      <p>Create one and start labeling your data.</p>
      <Elem name="action" tag={Button} onClick={openModal} look="primary">
        Create Project
      </Elem>
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
        }}>
          {project.title ?? "New project"}
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
