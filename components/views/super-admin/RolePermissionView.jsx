'use client';
import React, { useState, useEffect } from 'react';
import DataTable from '../../common/DataTable';
import * as yup from 'yup';
import Loader from '../../common/Loader';
import GenericFormModal from '../../common/FormModal';
import DetailViewModal from '../../common/DetailViewModal';
import Swal from 'sweetalert2';
import {
  Plus,
  Shield,
  Users,
  Lock,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  Briefcase,
  DollarSign,
  Headphones,
  Wrench,
} from 'lucide-react';

const roleSchema = yup.object().shape({
  name: yup.string().required('Role Name is required').min(3),
  description: yup.string().required('Description is required'),
  status: yup.string().required('Status is required'),
  permissions: yup.array().min(1, 'At least one permission is required'),
  usersCount: yup.number().typeError('Must be a number').integer().min(0, 'Cannot be negative'),
});

const initialRoles = [
  {
    id: 'r-1',
    name: 'Manager',
    description: 'Can manage dealerships and quotes',
    usersCount: 2,
    status: 'active',
    lastUpdated: 'Dec 12, 2024',
  },
  {
    id: 'r-2',
    name: 'Manager',
    description: 'Can manage dealerships and quotes',
    usersCount: 5,
    status: 'active',
    lastUpdated: 'Dec 15, 2024',
  },
  {
    id: 'r-3',
    name: 'Seller',
    description: 'Can create quotes and view assigned leads',
    usersCount: 12,
    status: 'active',
    lastUpdated: 'Dec 20, 2024',
  },
  {
    id: 'r-4',
    name: 'Support',
    description: 'Can view tickets and basic details',
    usersCount: 3,
    status: 'active',
    lastUpdated: 'Dec 18, 2024',
  },
];

export default function RolesPermissionsView() {
  // --- STATE ---
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);

  // --- DATA FETCHING (Local Storage) ---
  useEffect(() => {
    const loadRoles = () => {
      try {
        const stored = localStorage.getItem('roles_data');
        if (stored) setRoles(JSON.parse(stored));
        else setRoles(initialRoles);
      } catch (error) {
        console.error('Failed to load roles', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(loadRoles, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (roles.length > 0) localStorage.setItem('roles_data', JSON.stringify(roles));
  }, [roles]);

  if (isLoading) return <Loader />;

  const handleSave = (roleData) => {
    if (roleData.id && roles.some((r) => r.id === roleData.id)) {
      // Edit
      setRoles((prev) => prev.map((r) => (r.id === roleData.id ? { ...r, ...roleData } : r)));
      Swal.fire('Updated!', 'Role updated successfully.', 'success');
    } else {
      // Create
      const newRole = {
        ...roleData,
        id: `r-${Date.now()}`,
        usersCount: 0,
        status: 'active',
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
      };
      setRoles((prev) => [newRole, ...prev]);
      Swal.fire('Created!', 'New role added successfully.', 'success');
    }
    setIsAddModalOpen(false);
    setEditingRole(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This might affect users assigned to this role!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        Swal.fire('Deleted!', 'Role has been removed.', 'success');
      }
    });
  };

  const handleStatusChange = (id, newStatus) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };
  const handlePermissionsChange = (id, newPermissions) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, permissions: newPermissions } : r)));
  };

  const getRoleIcon = (roleName) => {
    const name = roleName?.toLowerCase() || '';
    if (name.includes('manager')) return <Briefcase size={20} />;
    if (name.includes('seller')) return <DollarSign size={20} />;
    if (name.includes('support')) return <Headphones size={20} />;
    return <Shield size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Roles & Permissions</h1>
          <p className="text-[rgb(var(--color-text))] text-sm">
            Manage access levels and system capabilities
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)]"
        >
          <Plus size={18} />
          <span>Add Role</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={roles}
        searchKeys={['name', 'description']}
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        columns={[
          {
            header: 'Role Name',
            sortable: true,
            accessor: (role) => (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]">
                  {getRoleIcon(role.name)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[rgb(var(--color-text))]">{role.name}</p>
                </div>
              </div>
            ),
          },
          {
            header: 'Description',
            accessor: 'description',
            className: 'text-sm text-[rgb(var(--color-text))]',
          },
          {
            header: 'Users',
            accessor: (role) => (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
                <Users size={16} className="text-[rgb(var(--color-text))]" />
                {role.usersCount}
              </div>
            ),
          },
          {
            header: 'Last Updated',
            accessor: 'lastUpdated',
            sortable: true,
            className: 'text-sm text-[rgb(var(--color-text))]',
          },
          {
            header: 'Status',
            accessor: (role) => {
              const statusColors = {
                active: 'bg-green-500/10 text-green-500 border-green-500/20',
                inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
              };
              return (
                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={role.status}
                    onChange={(e) => handleStatusChange(role.id, e.target.value)}
                    className={`appearance-none pl-8 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[rgb(var(--color-primary))] ${statusColors[role.status] || statusColors.active}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {role.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  </div>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <ChevronDown size={12} />
                  </div>
                </div>
              );
            },
            className: 'text-center',
          },
          {
            header: 'Actions',
            accessor: (role) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRole(role);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.1)] rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRole(role);
                    setIsAddModalOpen(true);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-info))] hover:bg-[rgb(var(--color-info)/0.1)] rounded-lg transition-colors"
                  title="Edit Role"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(role.id);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.1)] rounded-lg transition-colors"
                  title="Delete Role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
            className: 'text-center',
          },
        ]}
      />

      {/* Modals */}
      <GenericFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSave}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        initialData={editingRole}
        validationSchema={roleSchema}
        fields={[
          {
            name: 'name',
            label: 'Role Name',
            placeholder: 'e.g. Manager',
            icon: Shield,
            type: 'select',
            options: [
              { value: 'Manager', label: 'Manager' },
              { value: 'Seller', label: 'Seller' },
              { value: 'Support', label: 'Support' },
            ],
          },
          {
            name: 'description',
            label: 'Description',
            placeholder: 'Access level description...',
            icon: FileText,
            type: 'textarea',
          },
          {
            name: 'status',
            label: 'Status',
            placeholder: 'Select status',
            icon: Shield,
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
          {
            name: 'permissions',
            label: 'Permissions',
            type: 'checkbox-group',
            options: [
              { value: 'all', label: 'All Access' },
              { value: 'read', label: 'View Only' },
              { value: 'write', label: 'Edit/Write' },
              { value: 'delete', label: 'Delete Capabilities' },
            ],
          },
        ]}
      />

      <DetailViewModal
        isOpen={!!viewingRole}
        onClose={() => setViewingRole(null)}
        data={viewingRole}
        title="Role Details"
        onEdit={(r) => {
          setViewingRole(null);
          setEditingRole(r);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDelete}
        sections={[
          {
            title: 'Role Info',
            icon: Shield,
            fields: [
              { label: 'Role Name', key: 'name' },
              { label: 'Status', key: 'status' },
              { label: 'Last Updated', key: 'lastUpdated' },
            ],
          },
          {
            title: 'Configuration',
            icon: Lock,
            fields: [
              { label: 'Description', key: 'description' },
              { label: 'Assigned Users', key: 'usersCount' },
            ],
          },
        ]}
      />
    </div>
  );
}
