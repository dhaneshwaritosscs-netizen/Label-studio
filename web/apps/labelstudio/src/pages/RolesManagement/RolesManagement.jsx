import React, { useState, useEffect } from "react";
import { useAPI } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { TopNavigationBar } from "../../components/TopNavigationBar";

export const RolesManagement = () => {
  const api = useAPI();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("Roles");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [apiUsers, setApiUsers] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBanner, setShowBanner] = useState(true);

  // Fetch roles data
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.callApi("roles", {
        params: { page_size: 1000 }
      });
      setRoles(response.results || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users data
  const fetchUsers = async () => {
    try {
      const response = await api.callApi("listRoleBasedUsers", {
        params: { page_size: 1000 }
      });
      setUsers(response.results || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  // Fetch deactivated users data
  const fetchDeactivatedUsers = async () => {
    try {
      const response = await api.callApi("listRoleBasedUsers", {
        params: { page_size: 1000, is_active: false }
      });
      setDeactivatedUsers(response.results || []);
    } catch (error) {
      console.error("Error fetching deactivated users:", error);
      setDeactivatedUsers([]);
    }
  };

  // Fetch API users data
  const fetchApiUsers = async () => {
    try {
      const response = await api.callApi("apiUsers", {
        params: { page_size: 1000 }
      });
      setApiUsers(response.results || []);
    } catch (error) {
      console.error("Error fetching API users:", error);
      setApiUsers([]);
    }
  };

  // Fetch project groups data
  const fetchProjectGroups = async () => {
    try {
      const response = await api.callApi("projectGroups", {
        params: { page_size: 1000 }
      });
      setProjectGroups(response.results || []);
    } catch (error) {
      console.error("Error fetching project groups:", error);
      setProjectGroups([]);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "Roles":
        fetchRoles();
        break;
      case "Users":
        fetchUsers();
        break;
      case "Deactivated Users":
        fetchDeactivatedUsers();
        break;
      case "API Users":
        fetchApiUsers();
        break;
      case "Project Groups":
        fetchProjectGroups();
        break;
      default:
        break;
    }
  }, [activeTab]);

  // Filter data based on search term
  const getFilteredData = () => {
    const data = {
      "Roles": roles,
      "Users": users,
      "Deactivated Users": deactivatedUsers,
      "API Users": apiUsers,
      "Project Groups": projectGroups
    }[activeTab] || [];

    if (!searchTerm) return data;

    return data.filter(item => {
      if (activeTab === "Roles") {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.id?.toString().includes(searchTerm);
      } else if (activeTab === "Users" || activeTab === "Deactivated Users") {
        return item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (activeTab === "API Users") {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.token?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (activeTab === "Project Groups") {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });
  };

  const filteredData = getFilteredData();

  // Export data as CSV
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      filteredData.map(item => {
        if (activeTab === "Roles") {
          return `${item.id},${item.name}`;
        } else if (activeTab === "Users" || activeTab === "Deactivated Users") {
          return `${item.user?.id},${item.user?.email},${item.user?.first_name},${item.user?.last_name}`;
        } else if (activeTab === "API Users") {
          return `${item.id},${item.name},${item.token}`;
        } else if (activeTab === "Project Groups") {
          return `${item.id},${item.name},${item.description}`;
        }
        return "";
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab.toLowerCase().replace(" ", "_")}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = ["Roles", "Users", "Deactivated Users", "Platform Setup", "API Users", "Project Groups"];

  const styles = {
    page: {
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    tabsContainer: {
      display: 'flex',
      backgroundColor: 'white',
      borderRadius: '8px 8px 0 0',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: 0
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      borderBottom: '3px solid transparent',
      color: '#6b7280',
      fontWeight: 500,
      transition: 'all 0.2s ease'
    },
    activeTab: {
      padding: '12px 24px',
      cursor: 'pointer',
      borderBottom: '3px solid #7c3aed',
      color: '#7c3aed',
      fontWeight: 500,
      backgroundColor: 'white',
      transition: 'all 0.2s ease'
    },
    tabHover: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    infoBanner: {
      backgroundColor: '#dbeafe',
      border: '1px solid #93c5fd',
      borderRadius: '0 0 8px 8px',
      padding: '16px',
      marginBottom: '20px'
    },
    bannerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    infoIcon: {
      width: '20px',
      height: '20px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      flexShrink: 0
    },
    bannerText: {
      flex: 1,
      color: '#1e40af',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    closeBanner: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '18px',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    searchActionBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    searchContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    searchInput: {
      padding: '8px 12px 8px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      width: '300px',
      backgroundColor: 'white'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      color: '#6b7280',
      fontSize: '16px'
    },
    createButton: {
      backgroundColor: '#374151',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    tableHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end'
    },
    exportButton: {
      background: 'none',
      border: 'none',
      color: '#7c3aed',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    dataTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeaderCell: {
      backgroundColor: '#f9fafb',
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: 600,
      color: '#374151',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    tableCell: {
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#374151'
    },
    loadingCell: {
      textAlign: 'center',
      color: '#6b7280',
      fontStyle: 'italic',
      padding: '40px 16px'
    },
    noDataCell: {
      textAlign: 'center',
      color: '#6b7280',
      fontStyle: 'italic',
      padding: '40px 16px'
    },
    tableRowEven: {
      backgroundColor: 'white',
      transition: 'background-color 0.2s ease'
    },
    tableRowOdd: {
      backgroundColor: '#fafafa',
      transition: 'background-color 0.2s ease'
    }
  };

  return (
    <div style={styles.page}>
      {/* Top Navigation Bar */}
      <TopNavigationBar />
      
      {/* Navigation Tabs */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <div
            key={tab}
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab)}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = styles.tabHover.backgroundColor;
                e.target.style.color = styles.tabHover.color;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = styles.tab.color;
              }
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Information Banner */}
      {showBanner && (
        <div style={styles.infoBanner}>
          <div style={styles.bannerContent}>
            <div style={styles.infoIcon}>ℹ</div>
            <div style={styles.bannerText}>
              Manage roles, their access and privileges. Sort or filter the columns as required. Select which columns to show and download roles data as a CSV file.
            </div>
            <button 
              style={styles.closeBanner} 
              onClick={() => setShowBanner(false)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
              }}
            >×</button>
          </div>
        </div>
      )}

      {/* Search and Action Bar */}
      <div style={styles.searchActionBar}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={styles.searchIcon}>🔍</div>
        </div>
        <button 
          style={styles.createButton}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#374151';
          }}
        >CREATE ROLE</button>
      </div>

      {/* Data Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <button 
            style={styles.exportButton} 
            onClick={exportData}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            📥 EXPORT
          </button>
        </div>
        
        <div style={styles.tableWrapper}>
          <table style={styles.dataTable}>
            <thead>
              <tr>
                {activeTab === "Roles" && (
                  <>
                    <th style={styles.tableHeaderCell}>ID ⋮</th>
                    <th style={styles.tableHeaderCell}>Name ⋮</th>
                  </>
                )}
                {(activeTab === "Users" || activeTab === "Deactivated Users") && (
                  <>
                    <th style={styles.tableHeaderCell}>ID ⋮</th>
                    <th style={styles.tableHeaderCell}>Email ⋮</th>
                    <th style={styles.tableHeaderCell}>First Name ⋮</th>
                    <th style={styles.tableHeaderCell}>Last Name ⋮</th>
                    <th style={styles.tableHeaderCell}>Status ⋮</th>
                  </>
                )}
                {activeTab === "API Users" && (
                  <>
                    <th style={styles.tableHeaderCell}>ID ⋮</th>
                    <th style={styles.tableHeaderCell}>Name ⋮</th>
                    <th style={styles.tableHeaderCell}>Token ⋮</th>
                    <th style={styles.tableHeaderCell}>Created ⋮</th>
                  </>
                )}
                {activeTab === "Project Groups" && (
                  <>
                    <th style={styles.tableHeaderCell}>ID ⋮</th>
                    <th style={styles.tableHeaderCell}>Name ⋮</th>
                    <th style={styles.tableHeaderCell}>Description ⋮</th>
                    <th style={styles.tableHeaderCell}>Projects ⋮</th>
                  </>
                )}
                {activeTab === "Platform Setup" && (
                  <>
                    <th style={styles.tableHeaderCell}>Setting ⋮</th>
                    <th style={styles.tableHeaderCell}>Value ⋮</th>
                    <th style={styles.tableHeaderCell}>Status ⋮</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={styles.loadingCell}>Loading...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" style={styles.noDataCell}>No data available</td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa';
                    }}
                  >
                    {activeTab === "Roles" && (
                      <>
                        <td style={styles.tableCell}>{item.id}</td>
                        <td style={styles.tableCell}>{item.name}</td>
                      </>
                    )}
                    {(activeTab === "Users" || activeTab === "Deactivated Users") && (
                      <>
                        <td style={styles.tableCell}>{item.user?.id}</td>
                        <td style={styles.tableCell}>{item.user?.email}</td>
                        <td style={styles.tableCell}>{item.user?.first_name}</td>
                        <td style={styles.tableCell}>{item.user?.last_name}</td>
                        <td style={styles.tableCell}>{item.user?.is_active ? 'Active' : 'Inactive'}</td>
                      </>
                    )}
                    {activeTab === "API Users" && (
                      <>
                        <td style={styles.tableCell}>{item.id}</td>
                        <td style={styles.tableCell}>{item.name}</td>
                        <td style={styles.tableCell}>{item.token ? `${item.token.substring(0, 20)}...` : 'N/A'}</td>
                        <td style={styles.tableCell}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                    {activeTab === "Project Groups" && (
                      <>
                        <td style={styles.tableCell}>{item.id}</td>
                        <td style={styles.tableCell}>{item.name}</td>
                        <td style={styles.tableCell}>{item.description || 'N/A'}</td>
                        <td style={styles.tableCell}>{item.projects?.length || 0}</td>
                      </>
                    )}
                    {activeTab === "Platform Setup" && (
                      <>
                        <td style={styles.tableCell}>Platform Status</td>
                        <td style={styles.tableCell}>Active</td>
                        <td style={styles.tableCell}>✓</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

RolesManagement.title = "Roles Management";
RolesManagement.path = "/roles-management";
RolesManagement.exact = true;
