import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Search, UserPlus, Filter, Mail, Shield, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { userService } from '../services/user';
import type { User } from '../store/authStore';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { useAuthStore } from '../store/authStore';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user: currentUser } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResendInvite = async (id: string) => {
    // Deprecated
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await userService.updateUserStatus(id, newStatus);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 size={10} /> ACTIVE</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20"><Clock size={10} /> PENDING</span>;
      case 'INACTIVE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={10} /> INACTIVE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Users Directory</h2>
          <p className="text-sm text-muted">Manage team members, roles, and access control.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <UserPlus size={16} />
            Create User
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border-color rounded-xl flex-1 flex flex-col overflow-hidden h-0 min-h-[400px]">
        <div className="p-4 border-b border-border-color flex flex-col sm:flex-row gap-3 rounded-t-xl shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-background border border-border-color rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <Button variant="outline" className="h-9 gap-2">
            <Filter size={14} />
            Filters
          </Button>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap relative">
            <thead className="text-xs uppercase bg-surface-hover/30 text-muted sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted animate-pulse">
                    Loading directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted">
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors group relative hover:bg-surface-hover/40 z-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs border border-accent/20 uppercase">
                          {u.full_name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{u.full_name}</div>
                          <div className="text-xs text-muted flex items-center gap-1">
                            <Mail size={10} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Shield size={12} className={u.role === 'ADMIN' ? 'text-accent' : ''} />
                        {u.role.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        {u.id !== currentUser?.id && u.status === 'ACTIVE' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(u.id, 'INACTIVE')} className="h-7 text-xs px-2 text-red-400 hover:text-red-500 hover:bg-red-500/10">
                            Deactivate
                          </Button>
                        )}
                        {u.id !== currentUser?.id && u.status === 'INACTIVE' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(u.id, 'ACTIVE')} className="h-7 text-xs px-2 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10">
                            Reactivate
                          </Button>
                        )}
                        
                        {u.id !== currentUser?.id && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateUserModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={fetchUsers} 
        />
      )}
    </div>
  );
};
