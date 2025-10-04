import { useState, useEffect } from 'react';
import { useCurrentUser } from '../providers/CurrentUser';

export const useUserRoles = () => {
  const { user } = useCurrentUser();
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      console.log("=== useUserRoles useEffect START ===");
      console.log("useUserRoles: Current user object:", user);
      console.log("useUserRoles: User email:", user?.email);
      console.log("useUserRoles: User object keys:", user ? Object.keys(user) : 'No user object');
      console.log("useUserRoles: User object type:", typeof user);
      
      if (!user?.email) {
        console.log("useUserRoles: No user email, skipping fetch");
        console.log("useUserRoles: User object:", user);
        setLoadingRoles(false);
        return;
      }
      
      try {
        setError(null);
        console.log("Fetching user roles for:", user.email);
        
        // Try to get the base URL from window.location
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/simple-user-roles/?email=${encodeURIComponent(user.email)}`;
        console.log("API URL:", apiUrl);
        console.log("Current port:", window.location.port);
        console.log("Current hostname:", window.location.hostname);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (response.ok) {
          const data = await response.json();
          console.log("API response data:", data);
          if (data.status === 'success') {
            setUserRoles(data.user_roles || []);
          } else {
            setError(data.message || 'Failed to fetch user roles');
          }
        } else {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          setError('Failed to fetch user roles');
        }
      } catch (err) {
        console.error("Error fetching user roles:", err);
        console.error("Error details:", err.message);
        console.error("Error type:", err.name);
        
        // If it's a timeout or network error, set empty roles but don't fail completely
        if (err.name === 'TimeoutError' || err.name === 'TypeError' || err.message.includes('fetch')) {
          console.log("Network/timeout error, setting empty roles but continuing");
          setUserRoles([]);
          setError('Network error - using fallback role detection');
        } else {
          setError(err.message || 'Error fetching user roles');
        }
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchUserRoles();
  }, [user?.email]);

  const hasRole = (roleName) => {
    console.log("=== hasRole DEBUG START ===");
    console.log("hasRole called with:", roleName, "for user:", user?.email);
    console.log("User object:", user);
    console.log("User email:", user?.email);
    console.log("Email comparison:", user?.email === 'dhaneshwari.tosscss@gmail.com');
    console.log("Role name:", roleName);
    console.log("Role name lowercase:", roleName.toLowerCase());
    console.log("Current userRoles:", userRoles);
    console.log("Loading roles:", loadingRoles);
    
    // Check for hardcoded admin email first - this should always work regardless of API
    const userEmail = user?.email?.toLowerCase()?.trim();
    const adminEmail = 'dhaneshwari.tosscss@gmail.com'.toLowerCase().trim();
    const isAdminRole = roleName.toLowerCase() === 'admin';
    
    console.log("Email comparison details:");
    console.log("- User email (lowercase):", userEmail);
    console.log("- Admin email (lowercase):", adminEmail);
    console.log("- Emails match:", userEmail === adminEmail);
    console.log("- Is admin role:", isAdminRole);
    
    if (userEmail === adminEmail && isAdminRole) {
      console.log("✅ Hardcoded admin check passed for:", user.email);
      console.log("=== hasRole DEBUG END (ADMIN) ===");
      return true;
    }
    
    console.log("❌ Hardcoded admin check failed");
    console.log("Email match:", user?.email === 'dhaneshwari.tosscss@gmail.com');
    console.log("Role match:", roleName.toLowerCase() === 'admin');
    
    // If still loading, return false for now (except for hardcoded admin)
    if (loadingRoles) {
      console.log("Still loading roles, returning false");
      console.log("=== hasRole DEBUG END (LOADING) ===");
      return false;
    }
    
    const result = userRoles.some(role => {
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
    
    console.log("hasRole result:", result, "for role:", roleName);
    console.log("=== hasRole DEBUG END ===");
    return result;
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

