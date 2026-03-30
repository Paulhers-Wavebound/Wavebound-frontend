import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarItem {
  id: string;
  date: string;
  title: string;
  type: 'video' | 'photo' | 'idea';
  description?: string;
  time?: string;
  sourceId?: number;
  thumbnailUrl?: string;
  projectColor?: string;
}

interface DbCalendarItem {
  id: string;
  user_id: string;
  date: string;
  title: string;
  type: string;
  description: string | null;
  time: string | null;
  source_id: number | null;
  thumbnail_url: string | null;
  project_color: string | null;
  created_at: string;
  updated_at: string;
}

export function useCalendarItems() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load items from Supabase
  useEffect(() => {
    const loadItems = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('calendar_items')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading calendar items:', error);
        toast({
          title: 'Error loading calendar',
          description: 'Failed to load your calendar items',
          variant: 'destructive',
        });
      } else if (data) {
        const mapped: CalendarItem[] = (data as DbCalendarItem[]).map(item => ({
          id: item.id,
          date: item.date,
          title: item.title,
          type: item.type as 'video' | 'photo' | 'idea',
          description: item.description || undefined,
          time: item.time || undefined,
          sourceId: item.source_id || undefined,
          thumbnailUrl: item.thumbnail_url || undefined,
          projectColor: item.project_color || undefined,
        }));
        setItems(mapped);
      }
      
      setLoading(false);
    };

    loadItems();
  }, [toast]);

  const addItem = useCallback(async (item: Omit<CalendarItem, 'id'>) => {
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add calendar items',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('calendar_items')
      .insert({
        user_id: userId,
        date: item.date,
        title: item.title,
        type: item.type,
        description: item.description || null,
        time: item.time || null,
        source_id: item.sourceId || null,
        thumbnail_url: item.thumbnailUrl || null,
        project_color: item.projectColor || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding calendar item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to calendar',
        variant: 'destructive',
      });
      return null;
    }

    const newItem: CalendarItem = {
      id: data.id,
      date: data.date,
      title: data.title,
      type: data.type as 'video' | 'photo' | 'idea',
      description: data.description || undefined,
      time: data.time || undefined,
      sourceId: data.source_id || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
      projectColor: data.project_color || undefined,
    };

    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [userId, toast]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('calendar_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from calendar',
        variant: 'destructive',
      });
      return false;
    }

    setItems(prev => prev.filter(item => item.id !== id));
    return true;
  }, [toast]);

  const updateItem = useCallback(async (id: string, updates: Partial<CalendarItem>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.time !== undefined) dbUpdates.time = updates.time || null;
    if (updates.sourceId !== undefined) dbUpdates.source_id = updates.sourceId || null;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl || null;
    if (updates.projectColor !== undefined) dbUpdates.project_color = updates.projectColor || null;

    const { error } = await supabase
      .from('calendar_items')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating calendar item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update calendar item',
        variant: 'destructive',
      });
      return false;
    }

    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    return true;
  }, [toast]);

  const getItemsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return items.filter(item => item.date === dateStr);
  }, [items]);

  return {
    items,
    loading,
    addItem,
    deleteItem,
    updateItem,
    getItemsForDate,
    isAuthenticated: !!userId,
  };
}
