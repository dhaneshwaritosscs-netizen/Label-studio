import { useState, useEffect } from 'react';
import { useCurrentUser } from '../providers/CurrentUser';

export const useUserRoles = () => {
  const { user } = useCurrentUser();
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.email) {
        setLoadingRoles(false);
        return;
      }
      
      try {
        setError(null);
        const response = await fetch(`http://localhost:8010/api/simple-user-roles/?email=${encodeURIComponent(user.email)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setUserRoles(data.user_roles || []);
          } else {
            setError(data.message || 'Failed to fetch user roles');
          }
        } else {
          setError('Failed to fetch user roles');
        }
      } catch (err) {
        console.error("Error fetching user roles:", err);
        setError(err.message || 'Error fetching user roles');
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchUserRoles();
  }, [user?.email]);

  const hasRole = (roleName) => {
    return userRoles.some(role => {
      const roleNameLower = role.name.toLowerCase();
      const checkNameLower = roleName.toLowerCase();
      
      // Handle different role name formats
      if (checkNameLower === 'admin') {
        return roleNameLower === 'admin' || roleNameLower === 'administrator';
      }
      if (checkNameLower === 'client') {
        return roleNameLower === 'client';
      }
      if (checkNameLower === 'user') {
        return roleNameLower === 'user';
      }
      if (checkNameLower === 'qcr') {
        return roleNameLower === 'qcr';
      }
      
      // Default exact match
      return role.name === roleName;
    });
  };

  const hasAnyRole = (roleNames) => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  return {
    userRoles,
    loadingRoles,
    error,
    hasRole,
    hasAnyRole,
  };
};

