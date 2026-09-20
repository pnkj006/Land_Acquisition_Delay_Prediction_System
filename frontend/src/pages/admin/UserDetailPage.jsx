import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi } from '../../api/users.api.js';

export default function UserDetailPage() {
  const { userId } = useParams();
  const [permissionsData, setPermissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await usersApi.getPermissions(userId);
        setPermissionsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [userId]);

  const handleGrantToggle = (grant) => {
    if (!permissionsData) return;
    const currentGrants = permissionsData.grants;
    let newGrants;
    if (currentGrants.includes(grant)) {
      newGrants = currentGrants.filter(g => g !== grant);
    } else {
      newGrants = [...currentGrants, grant];
    }
    setPermissionsData({ ...permissionsData, grants: newGrants });
  };

  const handleSave = async () => {
    if (!permissionsData) return;
    setSaving(true);
    try {
      // API expects an array of {resource, action} objects
      const grantsPayload = permissionsData.grants.map(g => {
        const [resource, action] = g.split(':');
        return { resource, action };
      });
      await usersApi.setPermissions(userId, grantsPayload);
      alert('Permissions saved successfully');
    } catch (err) {
      alert(`Error saving permissions: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading user details...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!permissionsData) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Permissions (ID: {userId})</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4">Role: {permissionsData.role}</h2>
        
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Defaults (Read-only)</h3>
          <div className="flex flex-wrap gap-2">
            {permissionsData.defaults.length > 0 ? permissionsData.defaults.map(d => (
              <span key={d} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{d}</span>
            )) : <span className="text-sm text-gray-500">None</span>}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Specific Grants</h3>
          <p className="text-sm text-gray-500 mb-3">Toggle to grant or revoke specific permissions.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {permissionsData.grantable.map(grant => {
              // Defaults cannot be specifically granted/revoked
              if (permissionsData.defaults.includes(grant)) return null;
              
              const isGranted = permissionsData.grants.includes(grant);
              return (
                <label key={grant} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGranted}
                    onChange={() => handleGrantToggle(grant)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-sm">{grant}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}
