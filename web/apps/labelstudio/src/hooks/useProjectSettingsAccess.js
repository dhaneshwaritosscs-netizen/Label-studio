import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '../providers/CurrentUser';

/**
 * Hook for managing project settings access
 */
export const useProjectSettingsAccess = (projectId) => {
  const { user } = useCurrentUser();
  const [accessData, setAccessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccessData = useCallback(async () => {
    if (!projectId || !user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/access/project-settings-access/my_project_access/?project_id=${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAccessData(data);
        setError(null);
      } else if (response.status === 404) {
        setAccessData(null);
        setError('No access profile found for this project');
      } else {
        setError('Failed to fetch access data');
      }
    } catch (err) {
      setError('Failed to fetch access data');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  const checkFieldAccess = useCallback(async (fieldName, requiredLevel = 'read') => {
    if (!projectId || !user) return false;

    try {
      const response = await fetch(
        `/api/access/project-settings-access/check_field_access/?project_id=${projectId}&field_name=${fieldName}&required_level=${requiredLevel}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.has_access;
      }
      return false;
    } catch (err) {
      console.error('Error checking field access:', err);
      return false;
    }
  }, [projectId, user]);

  const hasFieldAccess = useCallback((fieldName, requiredLevel = 'read') => {
    if (!accessData || !accessData.access_valid) return false;
    
    const fieldAccess = accessData[`${fieldName}_access`];
    const accessLevels = { none: 0, read: 1, write: 2, admin: 3 };
    
    const currentLevel = accessLevels[fieldAccess] || 0;
    const requiredLevelValue = accessLevels[requiredLevel] || 0;
    
    return currentLevel >= requiredLevelValue;
  }, [accessData]);

  const canReadField = useCallback((fieldName) => {
    return hasFieldAccess(fieldName, 'read');
  }, [hasFieldAccess]);

  const canWriteField = useCallback((fieldName) => {
    return hasFieldAccess(fieldName, 'write');
  }, [hasFieldAccess]);

  const canAdminField = useCallback((fieldName) => {
    return hasFieldAccess(fieldName, 'admin');
  }, [hasFieldAccess]);

  const getFieldAccessLevel = useCallback((fieldName) => {
    if (!accessData || !accessData.access_valid) return 'none';
    return accessData[`${fieldName}_access`] || 'none';
  }, [accessData]);

  const getAllAccessLevels = useCallback(() => {
    if (!accessData || !accessData.access_valid) return {};
    return accessData.all_access_levels || {};
  }, [accessData]);

  return {
    accessData,
    loading,
    error,
    hasFieldAccess,
    canReadField,
    canWriteField,
    canAdminField,
    getFieldAccessLevel,
    getAllAccessLevels,
    checkFieldAccess,
    refetch: fetchAccessData
  };
};

/**
 * Hook for checking if user can access specific project settings fields
 */
export const useProjectSettingsFieldAccess = (projectId, fieldName, requiredLevel = 'read') => {
  const { hasFieldAccess, loading, error } = useProjectSettingsAccess(projectId);
  
  const hasAccess = hasFieldAccess(fieldName, requiredLevel);
  
  return {
    hasAccess,
    loading,
    error
  };
};

/**
 * Component wrapper for conditional rendering based on field access
 */
export const withFieldAccess = (WrappedComponent, fieldName, requiredLevel = 'read') => {
  return function FieldAccessWrapper({ projectId, ...props }) {
    const { hasAccess, loading } = useProjectSettingsFieldAccess(projectId, fieldName, requiredLevel);
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!hasAccess) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            You don't have {requiredLevel} access to {fieldName} settings.
          </p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};








