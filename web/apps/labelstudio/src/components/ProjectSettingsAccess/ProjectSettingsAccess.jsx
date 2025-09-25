import React, { useState, useEffect } from 'react';
import { Button } from '../../../../libs/ui/src/lib/Button/Button';
import { Modal } from '../../../../libs/ui/src/lib/Modal/Modal';
import { Select } from '../../../../libs/ui/src/lib/Select/Select';
import { Input } from '../../../../libs/ui/src/lib/Input/Input';
import { useCurrentUser } from '../../providers/CurrentUser';

const ACCESS_LEVELS = [
  { value: 'none', label: 'No Access' },
  { value: 'read', label: 'Read Only' },
  { value: 'write', label: 'Read/Write' },
  { value: 'admin', label: 'Full Access' }
];

const SETTINGS_FIELDS = [
  { key: 'general', label: 'General Settings' },
  { key: 'labeling_interface', label: 'Labeling Interface' },
  { key: 'annotation', label: 'Annotation Settings' },
  { key: 'model', label: 'Model Settings' },
  { key: 'predictions', label: 'Predictions' },
  { key: 'cloud_storage', label: 'Cloud Storage' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'danger_zone', label: 'Danger Zone' }
];

export const ProjectSettingsAccess = ({ projectId, projectTitle, onClose }) => {
  const { user } = useCurrentUser();
  const [accessData, setAccessData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [accessLevels, setAccessLevels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectAccess();
      fetchUsers();
    }
  }, [projectId]);

  const fetchProjectAccess = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/access/project-settings-access/?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAccessData(data);
      }
    } catch (err) {
      setError('Failed to fetch project access data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.results || data);
      }
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleAccessLevelChange = (field, level) => {
    setAccessLevels(prev => ({
      ...prev,
      [field]: level
    }));
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    try {
      setLoading(true);
      const accessPayload = {
        user: selectedUser.id,
        project: projectId,
        ...accessLevels,
        granted_by: user.id
      };

      const response = await fetch('/api/access/project-settings-access/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accessPayload)
      });

      if (response.ok) {
        await fetchProjectAccess();
        setShowUserModal(false);
        setSelectedUser(null);
        setAccessLevels({});
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save access settings');
      }
    } catch (err) {
      setError('Failed to save access settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (accessId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/access/project-settings-access/${accessId}/revoke_access/`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchProjectAccess();
      } else {
        setError('Failed to revoke access');
      }
    } catch (err) {
      setError('Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'write': return 'bg-yellow-100 text-yellow-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelLabel = (level) => {
    const accessLevel = ACCESS_LEVELS.find(al => al.value === level);
    return accessLevel ? accessLevel.label : 'Unknown';
  };

  return (
    <Modal
      title={`Project Settings Access - ${projectTitle}`}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Header with Add User Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Manage User Access to Project Settings
          </h3>
          <Button
            onClick={() => setShowUserModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add User Access
          </Button>
        </div>

        {/* Current Access List */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Current Access</h4>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : accessData && accessData.length > 0 ? (
            <div className="space-y-3">
              {accessData.map((access) => (
                <div key={access.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="font-medium text-gray-900">
                          {access.user_username}
                        </h5>
                        <span className="text-sm text-gray-500">
                          {access.user_email}
                        </span>
                        {!access.access_valid && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      {/* Access Levels Grid */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {SETTINGS_FIELDS.map((field) => (
                          <div key={field.key} className="text-sm">
                            <div className="text-gray-600">{field.label}</div>
                            <span className={`px-2 py-1 text-xs rounded ${getAccessLevelColor(access[`${field.key}_access`])}`}>
                              {getAccessLevelLabel(access[`${field.key}_access`])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleRevokeAccess(access.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No users have been granted access to this project's settings.
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showUserModal && (
          <Modal
            title="Grant Project Settings Access"
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
              setAccessLevels({});
              setError(null);
            }}
            size="medium"
          >
            <div className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <Select
                  value={selectedUser?.id || ''}
                  onChange={(value) => {
                    const user = users.find(u => u.id === parseInt(value));
                    setSelectedUser(user);
                  }}
                  options={users.map(u => ({ value: u.id, label: `${u.username} (${u.email})` }))}
                  placeholder="Choose a user..."
                />
              </div>

              {/* Access Levels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Set Access Levels for Each Settings Field
                </label>
                <div className="space-y-4">
                  {SETTINGS_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-48">{field.label}</span>
                      <Select
                        value={accessLevels[field.key] || 'read'}
                        onChange={(value) => handleAccessLevelChange(field.key, value)}
                        options={ACCESS_LEVELS}
                        className="w-32"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setAccessLevels({});
                    setError(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAccess}
                  disabled={loading || !selectedUser}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Saving...' : 'Grant Access'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};








