import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X, Mail, User as UserIcon, Shield, Loader2, CheckCircle } from 'lucide-react';
import { userService } from '../../services/user';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'DEVELOPER'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userService.inviteUser(formData);
      onSuccess();
      setCreated(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create user");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-color shadow-2xl rounded-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border-color bg-surface-hover/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create User</h2>
            <p className="text-xs text-muted mt-1">Add a new user to Escalora.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          {created ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">User created successfully</h3>
              <p className="text-sm text-muted mt-2 mb-6">
                The user can now log in. Initial password: <code className="bg-surface-hover px-2 py-1 rounded border border-border-color text-accent font-bold">password</code>
              </p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border-color rounded-lg text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border-color rounded-lg text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border-color rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="SENIOR_DEVELOPER">Senior Developer</option>
                  <option value="PROJECT_LEAD">Project Lead</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Create User
              </Button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};
