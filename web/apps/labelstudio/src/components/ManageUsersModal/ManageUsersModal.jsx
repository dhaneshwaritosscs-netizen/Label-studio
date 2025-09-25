import React, { useState, useEffect } from "react";
import { useAPI } from "../../providers/ApiProvider";
import { IconClose, IconUserAdd } from "@humansignal/icons";
import { Userpic } from "@humansignal/ui";
import { formatDistance } from "date-fns";

export const ManageUsersModal = ({ isOpen, onClose }) => {
  const api = useAPI();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Fetch users from the backend
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the same API endpoint as the Organization page
      const response = await api.callApi("memberships", {
        params: {
          pk: 1,
          contributed_to_projects: 1,
          page,
          page_size: pageSize,
        },
      });

      if (response.results) {
        setUsers(response.results);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers(currentPage);
    }
  }, [isOpen, currentPage]);

  // Filter users based on search term
  const filteredUsers = users.filter(({ user }) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
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
        maxWidth: "900px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 24px 16px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <IconUserAdd style={{
              width: "24px",
              height: "24px",
              color: "#3b82f6",
            }} />
            <h2 style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1f2937",
              margin: 0,
            }}>
              Manage Users
            </h2>
          </div>
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
            <IconClose style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s ease",
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

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "0 24px",
        }}>
          {loading ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
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
              padding: "40px",
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
              padding: "16px 0",
            }}>
              {/* Users Table */}
              <div style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
                {/* Table Header */}
                <div style={{
                  backgroundColor: "#f9fafb",
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 120px 120px",
                  gap: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  <div>Avatar</div>
                  <div>User Details</div>
                  <div>Last Activity</div>
                  <div>Status</div>
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
                        padding: "16px",
                        borderBottom: "1px solid #f3f4f6",
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 120px 120px",
                        gap: "16px",
                        alignItems: "center",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Avatar */}
                      <div>
                        <Userpic user={user} style={{ width: "32px", height: "32px" }} />
                      </div>

                      {/* User Details */}
                      <div>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#1f2937",
                          marginBottom: "2px",
                        }}>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.email
                          }
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}>
                          {user.email}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          marginTop: "2px",
                        }}>
                          ID: {user.id}
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}>
                        {user.last_activity 
                          ? formatDistance(new Date(user.last_activity), new Date(), { addSuffix: true })
                          : "Never"
                        }
                      </div>

                      {/* Status */}
                      <div>
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
                    </div>
                  ))
                )}
              </div>

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
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          borderRadius: "0 0 12px 12px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{
              fontSize: "14px",
              color: "#6b7280",
            }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

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
