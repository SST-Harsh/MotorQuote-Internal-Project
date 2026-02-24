import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Trash2, User, MoreVertical, X, Check } from 'lucide-react';
import roleService from '../../../services/roleService';
import userService from '../../../services/userService';
import Swal from 'sweetalert2';
import Loader from '../../common/Loader';
import { useAuth } from '@/context/AuthContext';

export default function RoleUsersTab({ roleId, roleName }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add User State
  const [isAddMode, setIsAddMode] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [addingUsers, setAddingUsers] = useState(false);

  const fetchUsersInRole = useCallback(async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const data = await roleService.getUsersWithRole(roleId);
      // Handle various response structures
      const userList = Array.isArray(data) ? data : data.users || data.data || [];
      setUsers(userList);
    } catch (error) {
      console.error('Failed to fetch users for role', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load users for this role',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchUsersInRole();
  }, [fetchUsersInRole]);

  // Fetch all users for assignment
  const handleOpenAdd = async () => {
    setIsAddMode(true);
    try {
      // Ideally this should be a search endpoint, but for now getting all users (paginated usually)
      // We might need a specific endpoint to "search users to add" or similar
      const response = await userService.getAllUsers();
      const allUsers = Array.isArray(response) ? response : response.users || response.data || [];

      // Filter out users already in this role
      const existingIds = new Set(users.map((u) => u.id));
      setAvailableUsers(allUsers.filter((u) => !existingIds.has(u.id)));
    } catch (error) {
      console.error('Failed to load available users', error);
    }
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;
    setAddingUsers(true);
    try {
      // Process in parallel
      await Promise.all(
        selectedUsers.map((userId) => roleService.assignRoleToUser(userId, roleId))
      );

      Swal.fire({
        icon: 'success',
        title: 'Users Added',
        text: `Successfully added ${selectedUsers.length} users to ${roleName}`,
        timer: 1500,
        showConfirmButton: false,
      });

      setIsAddMode(false);
      setSelectedUsers([]);
      fetchUsersInRole();
    } catch (error) {
      console.error('Failed to assign roles', error);
      Swal.fire('Error', 'Failed to assign users to role', 'error');
    } finally {
      setAddingUsers(false);
    }
  };

  const handleRemoveUser = async (user) => {
    const result = await Swal.fire({
      title: 'Remove User?',
      text: `Are you sure you want to remove ${user.name} from ${roleName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove',
    });

    if (result.isConfirmed) {
      try {
        await roleService.removeRoleFromUser(user.id, roleId);
        Swal.fire('Removed', 'User removed from role successfully', 'success');
        fetchUsersInRole();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Failed to remove user', 'error');
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(addSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] outline-none transition-all"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary))]/20"
        >
          <UserPlus size={18} />
          <span>Add Users</span>
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[rgb(var(--color-border))] rounded-2xl bg-[rgb(var(--color-surface))]">
          <div className="w-12 h-12 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center mx-auto mb-3 text-[rgb(var(--color-text-muted))]">
            <User size={24} />
          </div>
          <h3 className="font-bold text-[rgb(var(--color-text))]">No Users Found</h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            {searchQuery
              ? 'No users match your search'
              : 'There are no users assigned to this role yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all hover:border-[rgb(var(--color-primary))]/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] font-bold text-sm">
                  {user.name?.charAt(0) || <User size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[rgb(var(--color-text))] line-clamp-1">
                    {user.name}
                  </h4>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveUser(user)}
                className="p-2 text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from role"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal/Overlay */}
      {isAddMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddMode(false)}
          />
          <div className="relative w-full max-w-lg bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl border border-[rgb(var(--color-border))] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">
                Assign Users to {roleName}
              </h3>
              <button
                onClick={() => setIsAddMode(false)}
                className="p-2 hover:bg-[rgb(var(--color-background))] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-[rgb(var(--color-border))]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search available users..."
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-sm outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
                  No users found
                </div>
              ) : (
                filteredAvailableUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        if (isSelected)
                          setSelectedUsers((prev) => prev.filter((id) => id !== user.id));
                        else setSelectedUsers((prev) => [...prev, user.id]);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-[rgb(var(--color-primary))]/5 border border-[rgb(var(--color-primary))]/20' : 'hover:bg-[rgb(var(--color-background))] border border-transparent'}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]' : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]'}`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[rgb(var(--color-text))]">
                          {user.name}
                        </p>
                        <p className="text-xs text-[rgb(var(--color-text-muted))]">{user.email}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex justify-between items-center">
              <span className="text-xs text-[rgb(var(--color-text-muted))]">
                {selectedUsers.length} users selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddMode(false)}
                  className="px-4 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUsers}
                  disabled={selectedUsers.length === 0 || addingUsers}
                  className="bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))]/20 disabled:opacity-50 transition-all hover:bg-[rgb(var(--color-primary-dark))]"
                >
                  {addingUsers ? 'Assigning...' : 'Assign Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
