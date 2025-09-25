import React from 'react';
import { useProjectSettingsFieldAccess } from '../../hooks/useProjectSettingsAccess';

/**
 * Component that guards access to specific project settings fields
 */
export const SettingsAccessGuard = ({ 
  projectId, 
  fieldName, 
  requiredLevel = 'read', 
  children, 
  fallback = null,
  showAccessDenied = true 
}) => {
  const { hasAccess, loading, error } = useProjectSettingsFieldAccess(projectId, fieldName, requiredLevel);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error checking access: {error}</p>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    if (showAccessDenied) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Access Restricted
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You don't have {requiredLevel} access to {fieldName} settings. 
                  Contact your administrator to request access.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return children;
};

/**
 * Higher-order component for wrapping settings sections with access control
 */
export const withSettingsAccess = (fieldName, requiredLevel = 'read') => {
  return function SettingsAccessWrapper(WrappedComponent) {
    return function SettingsAccessComponent({ projectId, ...props }) {
      return (
        <SettingsAccessGuard 
          projectId={projectId} 
          fieldName={fieldName} 
          requiredLevel={requiredLevel}
        >
          <WrappedComponent {...props} />
        </SettingsAccessGuard>
      );
    };
  };
};

/**
 * Access level indicator component
 */
export const AccessLevelIndicator = ({ projectId, fieldName }) => {
  const { getFieldAccessLevel, loading } = useProjectSettingsAccess(projectId);

  if (loading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  const accessLevel = getFieldAccessLevel(fieldName);
  
  const getAccessColor = (level) => {
    switch (level) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'write': return 'text-yellow-600 bg-yellow-100';
      case 'read': return 'text-blue-600 bg-blue-100';
      case 'none': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccessLabel = (level) => {
    switch (level) {
      case 'admin': return 'Full Access';
      case 'write': return 'Read/Write';
      case 'read': return 'Read Only';
      case 'none': return 'No Access';
      default: return 'Unknown';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessColor(accessLevel)}`}>
      {getAccessLabel(accessLevel)}
    </span>
  );
};

/**
 * Settings field wrapper with access control and indicator
 */
export const SettingsFieldWrapper = ({ 
  projectId, 
  fieldName, 
  requiredLevel = 'read', 
  children, 
  showIndicator = true,
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      {showIndicator && (
        <div className="absolute top-2 right-2">
          <AccessLevelIndicator projectId={projectId} fieldName={fieldName} />
        </div>
      )}
      
      <SettingsAccessGuard 
        projectId={projectId} 
        fieldName={fieldName} 
        requiredLevel={requiredLevel}
      >
        {children}
      </SettingsAccessGuard>
    </div>
  );
};








