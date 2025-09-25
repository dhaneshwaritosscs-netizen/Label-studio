import React, { useState, useEffect } from "react";
import { IconSearch, IconRefresh, IconFileDownload, IconClose, IconChevronLeft } from "@humansignal/icons";
import { useAPI } from "../../providers/ApiProvider";

export const ProjectStatusPage = ({ onClose }) => {
  const api = useAPI();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Active");
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [selectedMainTab, setSelectedMainTab] = useState("Project Status");
  const [selectedSubTab, setSelectedSubTab] = useState("Submitted Tasks");
  const [startDate, setStartDate] = useState("12/09/2025");
  const [endDate, setEndDate] = useState("12/09/2025");
  const [selectedProject, setSelectedProject] = useState("");
  const [userTargetsData, setUserTargetsData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [tenantReportData, setTenantReportData] = useState([]);
  const [monthlyProductivityData, setMonthlyProductivityData] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState("");
  const [selectedMonthYear, setSelectedMonthYear] = useState("September 2025");
  const [cumulativeProductivityData, setCumulativeProductivityData] = useState([]);
  const [isDaywiseReport, setIsDaywiseReport] = useState(false);

  // Fetch project status data from backend
  const fetchProjectStatus = async () => {
    try {
      setLoading(true);
      // Fetch projects data
      const projectsResponse = await api.callApi("projects");
      if (projectsResponse && projectsResponse.results) {
        setProjects(projectsResponse.results);
      }
    } catch (error) {
      console.error("Error fetching project status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user targets data from backend
  const fetchUserTargets = async () => {
    try {
      setLoading(true);
      const response = await api.callApi("memberships");
      if (response && response.results) {
        // Transform user data to include targets
        const targetsData = response.results.map((user, index) => ({
          id: user.id,
          username: user.user?.username || `User${index + 1}`,
          achievedTransaction: Math.floor(Math.random() * 100), // Mock data - replace with actual API
          transactionTarget: Math.floor(Math.random() * 1000) + 100,
          ahtTarget: Math.floor(Math.random() * 200) + 50,
        }));
        setUserTargetsData(targetsData);
      }
    } catch (error) {
      console.error("Error fetching user targets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch billing report data from backend
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      // Mock billing data - replace with actual API call
      const mockBillingData = [
        {
          id: 1,
          orgName: "Org Billing Report",
          totalTransactions: 1,
          totalDatasets: 1,
          totalTimeTaken: "00:01:58",
          totalUsers: 1,
        }
      ];
      setBillingData(mockBillingData);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenant report data from backend
  const fetchTenantReport = async () => {
    try {
      setLoading(true);
      // Mock tenant report data - replace with actual API call
      const mockTenantData = [
        {
          id: 1,
          projectName: "USA 434:ICD: Labelling",
          level: "2",
          noOfUser: "1",
          activeUsersCount: "1",
          actualCompletedTasks: "1",
          totalTimeTaken: "00:07:29",
          avgTimeTakenPerTask: "00:07:29",
          utilization: "1",
        },
        {
          id: 2,
          projectName: "TOTAL",
          level: "2",
          noOfUser: "1",
          activeUsersCount: "1",
          actualCompletedTasks: "1",
          totalTimeTaken: "00:07:29",
          avgTimeTakenPerTask: "00:07:29",
          utilization: "1",
        }
      ];
      setTenantReportData(mockTenantData);
    } catch (error) {
      console.error("Error fetching tenant report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly productivity data from backend
  const fetchMonthlyProductivity = async () => {
    try {
      setLoading(true);
      // Mock monthly productivity data - replace with actual API call
      const mockProductivityData = [
        {
          id: 1,
          projectName: "1210 - affinity",
          totalTasks: 150,
          completedTasks: 120,
          productivity: 80,
          utilization: 75,
        },
        {
          id: 2,
          projectName: "3901 - Fruit and Food Annotation",
          totalTasks: 200,
          completedTasks: 180,
          productivity: 90,
          utilization: 85,
        }
      ];
      setMonthlyProductivityData(mockProductivityData);
    } catch (error) {
      console.error("Error fetching monthly productivity data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle project selection modal
  const handleProjectSelect = () => {
    if (selectedProjectForModal) {
      fetchMonthlyProductivity();
      setShowProjectModal(false);
    }
  };

  // Fetch cumulative productivity data from backend
  const fetchCumulativeProductivity = async () => {
    try {
      setLoading(true);
      // Mock cumulative productivity data - replace with actual API call
      const mockCumulativeData = [
        {
          id: 1,
          projectName: "USA 434:ICD: Labelling",
          totalTasks: 500,
          completedTasks: 450,
          productivity: 90,
          utilization: 85,
          daywiseData: isDaywiseReport ? [
            { date: "2025-09-01", tasks: 50, completed: 45 },
            { date: "2025-09-02", tasks: 60, completed: 55 },
            { date: "2025-09-03", tasks: 70, completed: 65 },
          ] : null,
        },
        {
          id: 2,
          projectName: "ROW 441 Timestamping",
          totalTasks: 300,
          completedTasks: 280,
          productivity: 93,
          utilization: 88,
          daywiseData: isDaywiseReport ? [
            { date: "2025-09-01", tasks: 30, completed: 28 },
            { date: "2025-09-02", tasks: 35, completed: 33 },
            { date: "2025-09-03", tasks: 40, completed: 38 },
          ] : null,
        }
      ];
      setCumulativeProductivityData(mockCumulativeData);
    } catch (error) {
      console.error("Error fetching cumulative productivity data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStatus();
  }, []);

  // Filter projects based on search term and active/archived status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === "Active" ? !project.is_archived : project.is_archived;
    return matchesSearch && matchesStatus;
  });

  // Calculate project statistics
  const calculateProjectStats = (project) => {
    // These would typically come from the backend API
    // For now, we'll use placeholder calculations
    const total = project.task_count || 0;
    const complete = Math.floor(total * 0.7); // 70% complete as example
    const pending = total - complete;
    const active = 0; // No active tasks in the example
    const completePercentage = total > 0 ? Math.round((complete / total) * 100) : 0;
    const users = project.members?.length || 0;
    const batches = project.batches?.length || 1;

    return {
      total,
      pending,
      complete,
      active,
      completePercentage,
      users,
      batches
    };
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      minHeight: "100vh",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <button
            onClick={onClose}
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
            <IconChevronLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1f2937",
            margin: 0,
          }}>
            Project Status
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "32px",
        marginBottom: "24px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        {["Project Status", "Users Status", "Users Target", "Billing Report", "Tenant Report", "Monthly Productivity", "Cumulative Productivity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedMainTab(tab)}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: "14px",
              fontWeight: tab === selectedMainTab ? "600" : "500",
              color: tab === selectedMainTab ? "#7c3aed" : "#6b7280",
              cursor: "pointer",
              borderBottom: tab === selectedMainTab ? "2px solid #7c3aed" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (tab !== selectedMainTab) {
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== selectedMainTab) {
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Info Banner */}
      {showInfoBanner && (
        <div style={{
          backgroundColor: "#dbeafe",
          border: "1px solid #93c5fd",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
              fontSize: "12px",
              fontWeight: "600",
            }}>
              i
            </div>
            <span style={{
              fontSize: "14px",
              color: "#1e40af",
            }}>
              {selectedMainTab === "Users Status" 
                ? "View the consolidated task summary for each user for a selected period. Filter the report by execution level, if required. Use the controls at the top-right corner to toggle report format, download the report."
                : selectedMainTab === "Users Target"
                ? "View the performance of each user against the targets set for them. Filter the report by execution level, if required. Use the controls at the top-right corner to toggle report format, download the report."
                : selectedMainTab === "Billing Report"
                ? "View the billing report grouped at various levels, such as organization, project, batch, execution level, and user."
                : selectedMainTab === "Tenant Report"
                ? "View the tenant report grouped at various levels, such as execution level, and number of user."
                : selectedMainTab === "Monthly Productivity"
                ? "View the performance and utilization for all your users grouped by the assigned projects."
                : selectedMainTab === "Cumulative Productivity"
                ? "View the cumulative performance and utilization for all your users across all projects and execution levels."
                : "View consolidated task status for all projects. View the User Status Report and the Batch Status Report for a given project. Use the controls at the top-right corner to toggle report format, download the report."
              }
            </span>
          </div>
          <button
            onClick={() => setShowInfoBanner(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
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
            <IconClose style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      )}

      {/* Search and Actions Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
      }}>
        {/* Left side - Date pickers for Users Status/Users Target/Billing Report/Tenant Report, Checkbox+Date for Cumulative Productivity, Search for Monthly Productivity and others */}
        {(selectedMainTab === "Users Status" || selectedMainTab === "Users Target" || selectedMainTab === "Billing Report" || selectedMainTab === "Tenant Report") ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                width: "120px",
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
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                width: "120px",
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
            <button
              onClick={() => {
                if (selectedMainTab === "Users Target") {
                  fetchUserTargets();
                } else if (selectedMainTab === "Billing Report") {
                  fetchBillingData();
                } else if (selectedMainTab === "Tenant Report") {
                  fetchTenantReport();
                }
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#6d28d9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#7c3aed";
              }}
            >
              SUBMIT
            </button>
          </div>
        ) : selectedMainTab === "Cumulative Productivity" ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={isDaywiseReport}
                onChange={(e) => setIsDaywiseReport(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              Daywise Report
            </label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                width: "120px",
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
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                width: "120px",
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
            <button
              onClick={() => {
                fetchCumulativeProductivity();
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#6d28d9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#7c3aed";
              }}
            >
              SUBMIT
            </button>
          </div>
        ) : (
          /* Search for other tabs */
          <div style={{
            position: "relative",
            width: "300px",
          }}>
            <IconSearch style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "#9ca3af",
            }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
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
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <button
            onClick={fetchProjectStatus}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            <IconRefresh style={{ width: "18px", height: "18px", color: "#6b7280" }} />
          </button>
          
          <button
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            <div style={{
              width: "18px",
              height: "18px",
              background: "linear-gradient(45deg, #3b82f6, #1d4ed8)",
              borderRadius: "2px",
            }} />
          </button>
          
          <button
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            <IconFileDownload style={{ width: "18px", height: "18px", color: "#6b7280" }} />
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div style={{
        display: "flex",
        gap: "32px",
        marginBottom: "24px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        {selectedMainTab === "Users Status" ? (
          ["Submitted Tasks", "Daywise Report", "Other Tasks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedSubTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: selectedSubTab === tab ? "600" : "500",
                color: selectedSubTab === tab ? "#7c3aed" : "#6b7280",
                cursor: "pointer",
                borderBottom: selectedSubTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {tab}
            </button>
          ))
        ) : selectedMainTab === "Users Target" ? (
          ["User Targets", "Transactions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedSubTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: selectedSubTab === tab ? "600" : "500",
                color: selectedSubTab === tab ? "#7c3aed" : "#6b7280",
                cursor: "pointer",
                borderBottom: selectedSubTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {tab}
            </button>
          ))
        ) : selectedMainTab === "Billing Report" ? (
          ["Org Wise", "Project Wise", "Batch Wise(Completed)", "Batch Wise", "Level Wise", "User Wise", "Batch(Input Received)"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedSubTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: selectedSubTab === tab ? "600" : "500",
                color: selectedSubTab === tab ? "#7c3aed" : "#6b7280",
                cursor: "pointer",
                borderBottom: selectedSubTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSubTab !== tab) {
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {tab}
            </button>
          ))
        ) : (
          ["Active", "Archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: activeTab === tab ? "600" : "500",
                color: activeTab === tab ? "#7c3aed" : "#6b7280",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {tab}
            </button>
          ))
        )}
      </div>

      {/* Project Dropdown for Users Status/Users Target */}
      {(selectedMainTab === "Users Status" || selectedMainTab === "Users Target") && (
        <div style={{
          marginBottom: "24px",
        }}>
          <div style={{
            position: "relative",
            width: "200px",
          }}>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
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
              <option value="">Project Name</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {/* Table Header - Only for Project Status */}
        {selectedMainTab === "Project Status" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 80px 80px 80px 80px 120px 80px 80px",
            gap: "16px",
            padding: "16px 20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "12px",
            fontWeight: "600",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            <div>Project</div>
            <div>Process</div>
            <div style={{ textAlign: "right" }}>Total</div>
            <div style={{ textAlign: "right" }}>Pending</div>
            <div style={{ textAlign: "right" }}>Complete</div>
            <div style={{ textAlign: "right" }}>Active</div>
            <div style={{ textAlign: "right" }}>Complete Percentage</div>
            <div style={{ textAlign: "right" }}>Users</div>
            <div style={{ textAlign: "right" }}>Batches</div>
          </div>
        )}

        {/* Table Body */}
        <div>
          {loading ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }} />
              Loading project data...
            </div>
          ) : selectedMainTab === "Users Status" ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
            }}>
              No reports generated.
            </div>
          ) : selectedMainTab === "Users Target" ? (
            <div style={{
              padding: "20px",
            }}>
              {/* Users Target Table */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
                fontWeight: "600",
                fontSize: "14px",
                color: "#374151",
              }}>
                <div>Users</div>
                <div style={{ textAlign: "right" }}>Achieved Transaction</div>
                <div style={{ textAlign: "right" }}>Transaction Target</div>
                <div style={{ textAlign: "right" }}>AHT Target(SLA)</div>
              </div>
              
              {userTargetsData.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <div style={{ fontWeight: "500" }}>{user.username}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{user.achievedTransaction}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{user.transactionTarget}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{user.ahtTarget}</div>
                </div>
              ))}
            </div>
          ) : selectedMainTab === "Billing Report" ? (
            <div style={{
              padding: "20px",
            }}>
              {/* Billing Report Table */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
                fontWeight: "600",
                fontSize: "14px",
                color: "#374151",
              }}>
                <div>Org Name</div>
                <div style={{ textAlign: "right" }}>Total Transactions</div>
                <div style={{ textAlign: "right" }}>Total Datasets</div>
                <div style={{ textAlign: "right" }}>Total Time Taken(HH:MM:SS)</div>
                <div style={{ textAlign: "right" }}>Total Users</div>
              </div>
              
              {billingData.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <div style={{ fontWeight: "500" }}>{item.orgName}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.totalTransactions}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.totalDatasets}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.totalTimeTaken}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.totalUsers}</div>
                </div>
              ))}
            </div>
          ) : selectedMainTab === "Tenant Report" ? (
            <div style={{
              padding: "20px",
            }}>
              {/* Tenant Report Table */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
                fontWeight: "600",
                fontSize: "14px",
                color: "#374151",
              }}>
                <div>Project Name</div>
                <div style={{ textAlign: "right" }}>Level</div>
                <div style={{ textAlign: "right" }}>No Of User</div>
                <div style={{ textAlign: "right" }}>Active Users Count</div>
                <div style={{ textAlign: "right" }}>Actual (# Completed Tasks)</div>
                <div style={{ textAlign: "right" }}>Total Time Taken (HH:MM:SS)</div>
                <div style={{ textAlign: "right" }}>Avg Time Taken Per Task (HH:MM:SS)</div>
                <div style={{ textAlign: "right" }}>Utilization (timeTaken*100/workHours)</div>
              </div>
              
              {tenantReportData.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <div style={{ fontWeight: item.projectName === "TOTAL" ? "600" : "500" }}>{item.projectName}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.level}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.noOfUser}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.activeUsersCount}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.actualCompletedTasks}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.totalTimeTaken}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.avgTimeTakenPerTask}</div>
                  <div style={{ textAlign: "right", color: "#3b82f6" }}>{item.utilization}</div>
                </div>
              ))}
            </div>
          ) : selectedMainTab === "Monthly Productivity" ? (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "16px",
            }}>
              No reports generated.
            </div>
          ) : selectedMainTab === "Cumulative Productivity" ? (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "16px",
            }}>
              No reports generated.
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
            }}>
              No projects found
            </div>
          ) : (
            filteredProjects.map((project, index) => {
              const stats = calculateProjectStats(project);
              return (
                <div
                  key={project.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 80px 80px 80px 80px 120px 80px 80px",
                    gap: "16px",
                    padding: "16px 20px",
                    borderBottom: index < filteredProjects.length - 1 ? "1px solid #f3f4f6" : "none",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {/* Project */}
                  <div style={{
                    fontWeight: "500",
                    color: "#1f2937",
                  }}>
                    {project.title || `Project ${project.id}`}
                  </div>

                  {/* Process */}
                  <div style={{
                    color: "#6b7280",
                  }}>
                    {project.description || "Text Annotation"}
                  </div>

                  {/* Total */}
                  <div style={{
                    textAlign: "right",
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}>
                    {stats.total}
                  </div>

                  {/* Pending */}
                  <div style={{
                    textAlign: "right",
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}>
                    {stats.pending}
                  </div>

                  {/* Complete */}
                  <div style={{
                    textAlign: "right",
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}>
                    {stats.complete}
                  </div>

                  {/* Active */}
                  <div style={{
                    textAlign: "right",
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}>
                    {stats.active}
                  </div>

                  {/* Complete Percentage */}
                  <div style={{
                    textAlign: "right",
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}>
                    {stats.completePercentage}%
                  </div>

                  {/* Users */}
                  <div style={{
                    textAlign: "right",
                    color: "#6b7280",
                  }}>
                    {stats.users} USER{stats.users !== 1 ? 'S' : ''}
                  </div>

                  {/* Batches */}
                  <div style={{
                    textAlign: "right",
                    color: "#6b7280",
                  }}>
                    {stats.batches} BATCH{stats.batches !== 1 ? 'ES' : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Project Selection Modal */}
      {showProjectModal && (
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
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            width: "400px",
            maxHeight: "80vh",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                margin: 0,
              }}>
                Select Project and Date
              </h3>
              <div style={{
                display: "flex",
                gap: "8px",
              }}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <IconRefresh style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                </button>
                <button
                  onClick={() => setShowProjectModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <IconClose style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Project Selection */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}>
                Project name
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={selectedProjectForModal}
                  onChange={(e) => setSelectedProjectForModal(e.target.value)}
                  placeholder="Select project..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #3b82f6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                />
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}>
                  <IconChevronDown style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                </div>
              </div>
              
              {/* Project Dropdown */}
              <div style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginTop: "4px",
                backgroundColor: "#ffffff",
              }}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectForModal(project.title)}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#374151",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {project.id} - {project.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Month and Year Selection */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}>
                Month and Year
              </label>
              <input
                type="text"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            {/* OK Button */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={handleProjectSelect}
                disabled={!selectedProjectForModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: selectedProjectForModal ? "#6b7280" : "#d1d5db",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: selectedProjectForModal ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedProjectForModal) {
                    e.currentTarget.style.backgroundColor = "#4b5563";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProjectForModal) {
                    e.currentTarget.style.backgroundColor = "#6b7280";
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
