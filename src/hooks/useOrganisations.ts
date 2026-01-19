import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../lib/api/organisationsApi';
import { getCurrentOrganizationId } from '../utils/organisationUtils';

// Define a proper type for your organization data
interface Organization {
  id: string;
  name: string;
  slug: string;
  // Add other organization fields as needed
}

interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  // Add other updatable fields as needed
}

// Get organization by slug
export const useOrganizationBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['organizations', 'slug', slug],
    queryFn: () => organizationsApi.getBySlug(slug),
    enabled: !!slug,
  });
};

// Get team members
export const useTeamMembers = () => {
  const organizationId = getCurrentOrganizationId();
  
  return useQuery({
    queryKey: ['organizations', organizationId, 'team'],
    queryFn: () => organizationsApi.getTeamMembers(organizationId),
  });
};

// Get organization stats
export const useOrganizationStats = () => {
  return useQuery({
    queryKey: ['organizations', 'stats'],
    queryFn: () => organizationsApi.getStats(),
  });
};

// Update organization
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<UpdateOrganizationData>) => organizationsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

// Remove user from organization
export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};