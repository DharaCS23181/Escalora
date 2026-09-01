import { apiClient } from './api';
import type { User } from '../store/authStore';

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type Role = 'ADMIN' | 'PROJECT_LEAD' | 'SENIOR_DEVELOPER' | 'DEVELOPER';

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  project_lead_id?: string;
  project_lead?: User;
  team_size: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  user: User;
}

export interface ProjectDetailed extends Project {
  members: ProjectMember[];
  creator?: User;
}

export interface ProjectActivity {
  id: string;
  action: string;
  created_at: string;
  actor: User;
  target_user?: User;
  metadata_json?: string;
}

export interface ProjectCreateData {
  name: string;
  key: string;
  description?: string;
  project_lead_id: string;
}

export interface ProjectUpdateData {
  name?: string;
  key?: string;
  description?: string;
  status?: ProjectStatus;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  getProject: async (id: string): Promise<ProjectDetailed> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: ProjectCreateData): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: ProjectUpdateData): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data;
  },

  archiveProject: async (id: string): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}/archive`);
    return response.data;
  },

  changeLead: async (id: string, userId: string): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}/lead?user_id=${userId}`);
    return response.data;
  },

  addMember: async (id: string, userId: string, role: Role): Promise<ProjectMember> => {
    const response = await apiClient.post(`/projects/${id}/members`, { user_id: userId, role });
    return response.data;
  },

  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/members/${userId}`);
  },

  getEligibleLeads: async (): Promise<User[]> => {
    const response = await apiClient.get('/projects/eligible-leads');
    return response.data;
  },

  getEligibleMembers: async (): Promise<User[]> => {
    const response = await apiClient.get('/projects/eligible-members');
    return response.data;
  },

  getActivity: async (id: string): Promise<ProjectActivity[]> => {
    const response = await apiClient.get(`/projects/${id}/activity`);
    return response.data;
  },

  getMembers: async (id: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.members || [];
  }
};
