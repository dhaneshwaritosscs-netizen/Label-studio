import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface TopNavigationBarProps {
  className?: string;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({ className = "" }) => {
  const [activeIcon, setActiveIcon] = useState('home');
  const location = useLocation();

  // Update active icon based on current route
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname === '/' || pathname.includes('assign-role')) {
      setActiveIcon('home');
    } else if (pathname.includes('projects-overview')) {
      setActiveIcon('chart');
    } else if (pathname.includes('user-role-assignment')) {
      setActiveIcon('user');
    } else if (pathname.includes('project-settings')) {
      setActiveIcon('settings');
    } else if (pathname.includes('project-status')) {
      setActiveIcon('download');
    }
  }, [location.pathname]);

  const handleIconClick = (iconName: string) => {
    console.log(`${iconName} icon clicked`);
    setActiveIcon(iconName);
    
    // Navigation logic
    switch(iconName) {
      case 'home':
        // Navigate to home or refresh
        window.location.href = '/assign-role';
        break;
      case 'user':
        // Navigate to User Role Assignment page
        window.location.href = '/user-role-assignment';
        break;
      case 'chart':
        // Navigate to Projects Overview page
        window.location.href = '/projects-overview';
        break;
      case 'settings':
        // Navigate to project settings page
        window.location.href = '/project-settings';
        break;
      case 'download':
        // Navigate to Project Status page
        window.location.href = '/project-status';
        break;
      default:
        break;
    }
  };

  const iconStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    position: "relative" as const,
  };

  const iconContainerStyle = {
    width: "24px",
    height: "24px",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const labelStyle = {
    fontSize: "12px",
    color: "#6366f1",
    fontWeight: "600" as const,
  };

  return (
    <div 
      className={className}
      style={{
        display: "flex",
        gap: "20px",
        marginBottom: "8px",
        paddingBottom: "4px",
        borderBottom: "1px solid #e5e7eb"
      }}
    >
      {/* Home Icon */}
      <div 
        style={{
          ...iconStyle,
          background: activeIcon === 'home' ? "#f3f4f6" : "transparent"
        }}
        title="Home"
        onClick={() => handleIconClick('home')}
        onMouseEnter={(e) => {
          if (activeIcon !== 'home') {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (activeIcon !== 'home') {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <div style={{
          ...iconContainerStyle,
          color: activeIcon === 'home' ? "#6366f1" : "#6b7280"
        }}>🏠</div>
        {activeIcon === 'home' && (
          <span style={labelStyle}>Home</span>
        )}
      </div>

      {/* Projects Icon */}
      <div 
        style={{
          ...iconStyle,
          background: activeIcon === 'chart' ? "#f3f4f6" : "transparent"
        }}
        title="Projects"
        onClick={() => handleIconClick('chart')}
        onMouseEnter={(e) => {
          if (activeIcon !== 'chart') {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (activeIcon !== 'chart') {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <div style={{
          ...iconContainerStyle,
          color: activeIcon === 'chart' ? "#6366f1" : "#6b7280"
        }}>📁</div>
        {activeIcon === 'chart' && (
          <span style={labelStyle}>Projects</span>
        )}
      </div>

      {/* User Icon */}
      <div 
        style={{
          ...iconStyle,
          background: activeIcon === 'user' ? "#f3f4f6" : "transparent"
        }}
        title="User"
        onClick={() => handleIconClick('user')}
        onMouseEnter={(e) => {
          if (activeIcon !== 'user') {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (activeIcon !== 'user') {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <div style={{
          ...iconContainerStyle,
          color: activeIcon === 'user' ? "#6366f1" : "#6b7280"
        }}>👤</div>
        {activeIcon === 'user' && (
          <span style={labelStyle}>User</span>
        )}
      </div>

      {/* Settings Icon */}
      <div 
        style={{
          ...iconStyle,
          background: activeIcon === 'settings' ? "#f3f4f6" : "transparent"
        }}
        title="Settings"
        onClick={() => handleIconClick('settings')}
        onMouseEnter={(e) => {
          if (activeIcon !== 'settings') {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (activeIcon !== 'settings') {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <div style={{
          ...iconContainerStyle,
          color: activeIcon === 'settings' ? "#6366f1" : "#6b7280"
        }}>⚙️</div>
        {activeIcon === 'settings' && (
          <span style={labelStyle}>Settings</span>
        )}
      </div>

      {/* Report Icon */}
      <div 
        style={{
          ...iconStyle,
          background: activeIcon === 'download' ? "#f3f4f6" : "transparent"
        }}
        title="Report"
        onClick={() => handleIconClick('download')}
        onMouseEnter={(e) => {
          if (activeIcon !== 'download') {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (activeIcon !== 'download') {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        <div style={{
          ...iconContainerStyle,
          color: activeIcon === 'download' ? "#6366f1" : "#6b7280"
        }}>📊</div>
        {activeIcon === 'download' && (
          <span style={labelStyle}>Report</span>
        )}
      </div>

    </div>
  );
};
