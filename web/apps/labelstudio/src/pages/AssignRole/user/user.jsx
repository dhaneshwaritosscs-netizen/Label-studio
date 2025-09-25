import React, { useState, useRef, useEffect } from "react";
import { Block, Elem } from "../../../utils/bem";
import { Button } from "../../../components";
import { IconCheck, IconUser, IconSettings, IconChevronDown, IconPersonInCircle } from "@humansignal/icons";
import { useAPI } from "../../../providers/ApiProvider";
import { ManageUsersPage } from "../../../components/ManageUsersPage/ManageUsersPage";
import "./user.scss";

export const AssignRole = () => {
  const api = useAPI();
  const [email, setEmail] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showUsersPage, setShowUsersPage] = useState(false);
  const dropdownRef = useRef(null);

  const roleOptions = [
    { id: "general", label: "General", description: "General access to basic features" },
   
  { id: "labeling-interface", label: "Labeling Interface", description: "Access to labeling tools and interface" },
    { id: "annotation", label: "Annotation", description: "Create and manage annotations" },
    { id: "model", label: "Model", description: "Access to ML models and predictions" },
    { id: "predictions", label: "Predictions", description: "View and manage model predictions" },
    { id: "cloud-storage", label: "Cloud Storage", description: "Access to cloud storage settings" },
    { id: "webhooks", label: "Webhooks", description: "Configure and manage webhooks" },
    { id: "danger-zone", label: "Danger Zone", description: "Critical system settings and operations" },
    
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Persist which sub-page is open using URL hash
  useEffect(() => {
    if (window.location.hash === '#manage-users') {
      setShowUsersPage(true);
    }
  }, []);

  const openUsersPage = () => {
    setShowUsersPage(true);
    try {
      window.history.replaceState(null, '', '#manage-users');
    } catch (e) {
      // no-op
    }
  };

  const closeUsersPage = () => {
    setShowUsersPage(false);
    try {
      if (window.location.hash === '#manage-users') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {
      // no-op
    }
  };

  const handleOptionChange = (optionId) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (selectedOptions.length === 0) {
      setError("Please select at least one role option");
      return;
    }


    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // First test server connection with direct fetch
      console.log("Testing server connection...");
      try {
        const healthResponse = await fetch('http://localhost:8010/api/server-response/');
        const healthData = await healthResponse.json();
        console.log("Health check response:", healthData);
      } catch (healthErr) {
        console.warn("Health check failed:", healthErr);
      }

      // Use direct fetch API to bypass any API provider issues
      console.log("Making direct API call...");
      
      const response = await fetch('http://localhost:8010/api/role-assignment-enhanced/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          selected_roles: selectedOptions
        })
      });

      console.log("Fetch response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      // Check if response is null or undefined
      if (!data) {
        throw new Error("No response data received from server");
      }

      if (data.status === 'success' || data.success) {
        setLoading(false);
        setSuccess(true);
        setEmail("");
        setSelectedOptions([]);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        throw new Error(data.message || data.error || "Failed to assign roles");
      }
      
    } catch (err) {
      setLoading(false);
      console.error("Role assignment error:", err);
      setError(err.message || "An error occurred while assigning roles. Please try again.");
    }
  };


  // If showing users page, render it instead of the assign role form
  if (showUsersPage) {
    return <ManageUsersPage onClose={closeUsersPage} />;
  }

  return (
    <Block name="assign-role-page">
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: "0",
            right: "0",
          }}>
            <button
              onClick={openUsersPage}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.color = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }}
              title="View All Users"
            >
              <IconPersonInCircle style={{ width: "24px", height: "24px" }} />
            </button>
          </div>
          
          <h1 style={{
            fontSize: "36px",
            fontWeight: "700",
            margin: "0 0 16px",
            background: "linear-gradient(135deg, #2d3748, #4a5568)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Assign Role
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: "#4a5568",
            margin: "0",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.6",
          }}>
            Assign specific roles and permissions to users by email
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              background: "#ef4444",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}>
              !
            </div>
            <div>
              <div style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#dc2626",
                marginBottom: "4px",
              }}>
                Error
              </div>
              <div style={{
                fontSize: "14px",
                color: "#991b1b",
              }}>
                {error}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#dc2626",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              background: "#22c55e",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}>
              ✓
            </div>
            <div>
              <div style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#16a34a",
                marginBottom: "4px",
              }}>
                Success
              </div>
              <div style={{
                fontSize: "14px",
                color: "#15803d",
              }}>
                Roles have been assigned successfully!
              </div>
            </div>
            <button
              onClick={() => setSuccess(false)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#16a34a",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Main Form */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}>
          {/* Email Input */}
          <div style={{
            marginBottom: "32px",
          }}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email address"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "all 0.2s ease",
                outline: "none",
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

          {/* Role Options Dropdown */}
          <div style={{
            marginBottom: "32px",
            position: "relative",
          }} ref={dropdownRef}>
            <label style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "16px",
            }}>
              Select Role Options
            </label>
            
            {/* Dropdown Button */}
            <div
              onClick={toggleDropdown}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
                minHeight: "48px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                color: selectedOptions.length > 0 ? "#374151" : "#9ca3af",
                fontSize: "16px",
              }}>
                {selectedOptions.length > 0 
                  ? `${selectedOptions.length} option${selectedOptions.length > 1 ? 's' : ''} selected`
                  : "Click to select role options"
                }
              </div>
              <IconChevronDown style={{
                width: "20px",
                height: "20px",
                color: "#6b7280",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }} />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: "0",
                right: "0",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                maxHeight: "300px",
                overflowY: "auto",
                marginTop: "4px",
              }}>
                {roleOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionChange(option.id)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      border: selectedOptions.includes(option.id) ? "2px solid #3b82f6" : "2px solid #d1d5db",
                      borderRadius: "4px",
                      background: selectedOptions.includes(option.id) ? "#3b82f6" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}>
                      {selectedOptions.includes(option.id) && (
                        <IconCheck style={{
                          width: "10px",
                          height: "10px",
                          color: "#ffffff",
                        }} />
                      )}
                    </div>
                    
                    <div style={{
                      flex: 1,
                    }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "2px",
                      }}>
                        {option.label}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !email.trim() || selectedOptions.length === 0}
            look="primary"
            size="large"
            style={{
              width: "100%",
              background: "#3b82f6",
              border: "none",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              opacity: (!email.trim() || selectedOptions.length === 0) ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && email.trim() && selectedOptions.length > 0) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email.trim() && selectedOptions.length > 0) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
          >
            {loading ? "Assigning Roles..." : "Assign Roles"}
          </Button>
        </div>

        {/* Summary */}
        {selectedOptions.length > 0 && (
          <div style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bae6fd",
          }}>
            <div style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#0369a1",
              marginBottom: "8px",
            }}>
              Selected Options ({selectedOptions.length}):
            </div>
            <div style={{
              fontSize: "14px",
              color: "#0c4a6e",
            }}>
              {selectedOptions.map(id => roleOptions.find(opt => opt.id === id)?.label).join(", ")}
            </div>
          </div>
        )}
      </div>
    </Block>
  );
};

AssignRole.title = "User Role Assignment";
AssignRole.path = "/user-role-assignment";
AssignRole.exact = true;
