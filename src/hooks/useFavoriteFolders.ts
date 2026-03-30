import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FOLDERS_QUERY_KEY = ['favorite-folders'];

export const useFavoriteFolders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorite_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('favorite_folders')
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newFolder) => {
      queryClient.setQueryData(FOLDERS_QUERY_KEY, (old: any[]) => 
        [...(old || []), newFolder]
      );
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      toast({ title: 'Folder created! 📁' });
    },
    onError: () => {
      toast({ title: 'Failed to create folder', variant: 'destructive' });
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
      const { error } = await supabase
        .from('favorite_folders')
        .update({ ...(name && { name }), ...(color && { color }) })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      toast({ title: 'Folder updated! ✏️' });
    },
    onError: () => {
      toast({ title: 'Failed to update folder', variant: 'destructive' });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('favorite_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      toast({ title: 'Folder deleted! 🗑️' });
    },
    onError: () => {
      toast({ title: 'Failed to delete folder', variant: 'destructive' });
    },
  });

  const moveFavoriteToFolder = useMutation({
    mutationFn: async ({ videoId, videoType, folderId }: { 
      videoId: number; 
      videoType: string;
      folderId: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // RLS does not allow UPDATE on user_favorites, so we delete and re-insert
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .eq('video_type', videoType);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          video_id: videoId,
          video_type: videoType,
          folder_id: folderId,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast({ title: 'Moved to folder! 📂' });
    },
    onError: (error) => {
      console.error('Failed to move favorite to folder:', error);
      toast({ title: 'Failed to move item', variant: 'destructive' });
    },
  });

  return {
    folders,
    isLoading,
    createFolder: createFolder.mutate,
    createFolderAsync: createFolder.mutateAsync,
    updateFolder: updateFolder.mutate,
    deleteFolder: deleteFolder.mutate,
    moveFavoriteToFolder: moveFavoriteToFolder.mutate,
  };
};