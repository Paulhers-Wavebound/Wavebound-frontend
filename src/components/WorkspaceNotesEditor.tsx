import { useRef, useEffect, useState } from 'react';
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Save, Loader2, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Palette } from 'lucide-react';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import PhotoCarouselModal from '@/components/PhotoCarouselModal';
import { Video as BaseVideo, PhotoCarousel as BasePhotoCarousel } from '@/types/content';
import * as BadgeDragDrop from '@/utils/badgeDragDrop';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';

// Extend base types with database-specific fields
type Video = BaseVideo & {
  Artist?: string;
};

type PhotoCarousel = BasePhotoCarousel & {
  "who?"?: string;
};

type Reel = {
  id: number;
  embedded_url: string;
  video_url?: string;
  video_file_url?: string;
  video_views: number;
  video_likes: number;
  profile_followers: number;
  outliar_score: number;
  thumbnail_url?: string | null;
  content_style?: string;
  genre?: string;
  hook?: string;
  caption?: string;
  [key: string]: any;
};

interface WorkspaceNotesEditorProps {
  compact?: boolean;
  autoFocus?: boolean;
}

export const WorkspaceNotesEditor = ({ compact = false, autoFocus = false }: WorkspaceNotesEditorProps) => {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedWordCount, setLastSavedWordCount] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoCarousel | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<{ type: 'video' | 'photo' | 'reel', id: number, x: number, y: number, video?: Video, photo?: PhotoCarousel, reel?: Reel } | null>(null);
  const notesEditorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedContentRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const draggedBadgeRef = useRef<HTMLElement | null>(null);
  const dropIndicatorRef = useRef<HTMLElement | null>(null);
  const savedCursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load workspace notes
  useEffect(() => {
    if (!user) return;
    
    // Reset the loaded flag when user changes or component mounts
    hasLoadedContentRef.current = false;
    
    console.log('WorkspaceNotesEditor: Loading workspace for user', user.id);
    loadWorkspace();
  }, [user]);

  // Auto-focus editor when autoFocus prop is true
  useEffect(() => {
    if (autoFocus && notesEditorRef.current) {
      setTimeout(() => {
        notesEditorRef.current?.focus();
      }, 50);
    }
  }, [autoFocus]);


  // Listen for save event from parent
  useEffect(() => {
    const handleSaveEvent = () => {
      console.log('WorkspaceNotesEditor: Save event triggered');
      saveNotes(false);
    };

    document.addEventListener('save-workspace-notes', handleSaveEvent);
    return () => {
      document.removeEventListener('save-workspace-notes', handleSaveEvent);
    };
  }, [user, workspaceId]);


  const loadWorkspace = async () => {
    try {
      // First check if there's unsaved content in localStorage
      const cachedContent = localStorage.getItem('workspace_notes_cache');
      console.log('WorkspaceNotesEditor: Cached content from localStorage:', cachedContent ? `${cachedContent.substring(0, 50)}...` : 'null');
      
      const { data, error } = await supabase
        .from('workspace_notes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      console.log('WorkspaceNotesEditor: Database content:', data?.notes ? `${data.notes.substring(0, 50)}...` : 'null');

      if (data) {
        setWorkspaceId(data.id);
        setNotes(data.notes || '');
        setLastSavedWordCount(countWords(data.notes || ''));
        
        // Use cached content if available, otherwise use database content
        const contentToLoad = cachedContent !== null ? cachedContent : (data.notes || '');
        console.log('WorkspaceNotesEditor: Content to load:', contentToLoad ? `${contentToLoad.substring(0, 50)}...` : 'empty');
        
        // Set editor content
        setTimeout(() => {
          if (notesEditorRef.current) {
            console.log('WorkspaceNotesEditor: Setting editor content');
            notesEditorRef.current.innerHTML = contentToLoad;
            hasLoadedContentRef.current = true;
            
            // Setup badges immediately after content is loaded
            setTimeout(() => {
              const badges = notesEditorRef.current?.querySelectorAll('[data-type]');
              console.log('WorkspaceNotesEditor: Setting up badges after load, found:', badges?.length);
              badges?.forEach(setupBadgeDraggable);
            }, 50);
            
            // Restore cursor position after content is loaded
            setTimeout(() => {
              if (autoFocus) {
                restoreCursorPosition();
              }
            }, 100);
            
            // Now that content is loaded, we can clear cache if DB has matching content
            if (cachedContent && data.notes && cachedContent === data.notes) {
              console.log('WorkspaceNotesEditor: Cache matches DB, clearing cache');
              localStorage.removeItem('workspace_notes_cache');
            }
          }
        }, 0);
      } else if (cachedContent !== null) {
        // No database record but have cached content
        console.log('WorkspaceNotesEditor: No DB record, using cached content');
        setTimeout(() => {
          if (notesEditorRef.current) {
            notesEditorRef.current.innerHTML = cachedContent;
            hasLoadedContentRef.current = true;
            
            // Setup badges immediately after content is loaded
            setTimeout(() => {
              const badges = notesEditorRef.current?.querySelectorAll('[data-type]');
              console.log('WorkspaceNotesEditor: Setting up badges after cached load, found:', badges?.length);
              badges?.forEach(setupBadgeDraggable);
            }, 50);
            
            // Restore cursor position after content is loaded
            setTimeout(() => {
              if (autoFocus) {
                restoreCursorPosition();
              }
            }, 100);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    }
  };

  const saveNotes = async (showToast = true) => {
    if (!user || !notesEditorRef.current) return;

    try {
      setSaving(true);
      const content = notesEditorRef.current.innerHTML;
      console.log('WorkspaceNotesEditor: Saving content:', content ? `${content.substring(0, 50)}...` : 'empty');

      if (workspaceId) {
        const { error } = await supabase
          .from('workspace_notes')
          .update({ notes: content })
          .eq('id', workspaceId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workspace_notes')
          .insert({ user_id: user.id, notes: content })
          .select()
          .single();

        if (error) throw error;
        setWorkspaceId(data.id);
      }

      setLastSaved(new Date());
      console.log('WorkspaceNotesEditor: Save successful, NOT clearing cache yet');
      
      // DON'T clear cache here - let it persist until next successful load
      // This ensures content doesn't disappear between close/reopen
      
      if (showToast) {
        toast({
          title: 'Saved! ✨',
          description: 'Your notes have been saved.',
        });
      }
      
      if (notesEditorRef.current) {
        setLastSavedWordCount(countWords(notesEditorRef.current.innerText));
      }
    } catch (error) {
      console.error('Error saving workspace:', error);
      if (showToast) {
        toast({
          title: 'Error saving notes',
          description: 'Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const triggerAutoSave = (immediate = false) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (immediate) {
      // Save immediately for important changes like badge drops
      saveNotes(false);
    } else {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveNotes(false);
      }, 2000);
    }
  };

  // Save on unmount or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (notesEditorRef.current && user) {
        const content = notesEditorRef.current.innerHTML;
        localStorage.setItem('workspace_notes_cache', content);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      // Save content to localStorage on unmount
      if (notesEditorRef.current) {
        const content = notesEditorRef.current.innerHTML;
        localStorage.setItem('workspace_notes_cache', content);
      }
    };
  }, [user]);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    notesEditorRef.current?.focus();
  };

  const applyHeading = (level: 'h1' | 'h2') => {
    const formatBlock = level === 'h1' ? 'h1' : 'h2';
    document.execCommand('formatBlock', false, formatBlock);
    notesEditorRef.current?.focus();
  };

  const applyColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    notesEditorRef.current?.focus();
  };

  const applyFont = (fontClass: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = fontClass;
    
    try {
      range.surroundContents(span);
    } catch {
      span.textContent = 'Sample Text';
      range.insertNode(span);
    }
    
    notesEditorRef.current?.focus();
  };

  const countWords = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, ' ').trim();
    if (!plainText) return 0;
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleNotesInput = () => {
    if (notesEditorRef.current && user && !isUpdatingRef.current) {
      const content = notesEditorRef.current.innerHTML;
      console.log('WorkspaceNotesEditor: Input changed, caching to localStorage:', content ? `${content.substring(0, 50)}...` : 'empty');
      // Cache content immediately to localStorage
      localStorage.setItem('workspace_notes_cache', content);
      // Save cursor position
      saveCursorPosition();
      // Trigger debounced auto-save
      triggerAutoSave();
    }
  };

  // Save cursor position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !notesEditorRef.current) return;

    try {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(notesEditorRef.current);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;

      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const end = preCaretRange.toString().length;

      const position = { start, end };
      savedCursorPositionRef.current = position;
      // Save to localStorage so it persists across modal opens/closes
      localStorage.setItem('workspace_cursor_position', JSON.stringify(position));
      console.log('Saved cursor position:', position);
    } catch (e) {
      console.error('Error saving cursor position:', e);
    }
  };

  // Restore cursor position
  const restoreCursorPosition = () => {
    // Load from localStorage if not in ref
    if (!savedCursorPositionRef.current) {
      const saved = localStorage.getItem('workspace_cursor_position');
      if (saved) {
        savedCursorPositionRef.current = JSON.parse(saved);
      }
    }
    
    if (!savedCursorPositionRef.current || !notesEditorRef.current) return;

    try {
      const { start, end } = savedCursorPositionRef.current;
      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      let charCount = 0;
      let foundStart = false;
      let foundEnd = false;

      const traverseNodes = (node: Node) => {
        if (foundEnd) return;

        if (node.nodeType === Node.TEXT_NODE) {
          const textLength = node.textContent?.length || 0;
          
          if (!foundStart && charCount + textLength >= start) {
            range.setStart(node, start - charCount);
            foundStart = true;
          }
          
          if (foundStart && charCount + textLength >= end) {
            range.setEnd(node, end - charCount);
            foundEnd = true;
            return;
          }
          
          charCount += textLength;
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            traverseNodes(node.childNodes[i]);
            if (foundEnd) return;
          }
        }
      };

      traverseNodes(notesEditorRef.current);

      if (foundStart && foundEnd) {
        selection.removeAllRanges();
        selection.addRange(range);
        console.log('Restored cursor position:', { start, end });
      }
    } catch (e) {
      console.error('Error restoring cursor position:', e);
    }
  };

  // Badge interaction handlers
  const handleBadgeClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const badge = target.closest('[data-type]') as HTMLElement;
    
    if (!badge) return;
    
    const type = badge.getAttribute('data-type');
    const videoId = badge.getAttribute('data-video-id');
    const photoId = badge.getAttribute('data-photo-id');
    const reelId = badge.getAttribute('data-reel-id');
    
    if (type === 'video' && videoId) {
      const { data } = await supabase.from('tiktok_videos_all').select('*').eq('id', parseInt(videoId)).single();
      if (data) setSelectedVideo(data);
    } else if (type === 'photo' && photoId) {
      const { data } = await supabase.from('tiktok_photo_carousel').select('*').eq('id', parseInt(photoId)).single();
      if (data) setSelectedPhoto(data);
    } else if (type === 'reel' && reelId) {
      // First get reel data
      const { data: reelData } = await supabase.from('reels_all').select('*').eq('id', parseInt(reelId)).single();
      
      // Then get thumbnail from assets table
      const { data: thumbnailData } = await supabase
        .from('media_assets_gif_thumbnail_Reels')
        .select('thumbnail_url, url')
        .eq('video_id', parseInt(reelId))
        .maybeSingle();
      
      if (reelData) {
        const thumbnailUrl = thumbnailData?.thumbnail_url || thumbnailData?.url || null;
        
        // Convert reel to video format for VideoDetailsModal
        const reelAsVideo: Video = {
          id: reelData.id,
          video_url: reelData.video_url || reelData.embedded_url,
          embedded_ulr: reelData.embedded_url,
          outliar_score: reelData.outliar_score || 0,
          video_views: reelData.video_views || 0,
          video_likes: reelData.video_likes || 0,
          comments: reelData.comments || '',
          profile_followers: reelData.profile_followers || 0,
          caption: reelData.caption,
          hook: reelData.hook,
          genre: reelData.genre,
          sub_genre: reelData.sub_genre,
          content_style: reelData.content_style,
          gender: reelData.gender,
          date_posted: reelData.date_posted,
          Artist: reelData.Artist,
          profile_bio: reelData.profile_bio,
          gif_url: null,
          thumbnail_url: thumbnailUrl,
          video_file_url: reelData.video_file_url,
          is_reel: true,
        };
        setSelectedVideo(reelAsVideo);
      }
    }
  };

  const handleBadgeHover = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const badge = target.closest('[data-type]') as HTMLElement;
    
    if (!badge) {
      setHoveredBadge(null);
      return;
    }
    
    const type = badge.getAttribute('data-type') as 'video' | 'photo' | 'reel';
    const videoId = badge.getAttribute('data-video-id');
    const photoId = badge.getAttribute('data-photo-id');
    const reelId = badge.getAttribute('data-reel-id');
    const rect = badge.getBoundingClientRect();
    
    if (type === 'video' && videoId) {
      const { data } = await supabase.from('tiktok_videos_all').select('*').eq('id', parseInt(videoId)).single();
      if (data) {
        setHoveredBadge({ 
          type: 'video', 
          id: parseInt(videoId),
          x: rect.left,
          y: rect.bottom + 8,
          video: data
        });
      }
    } else if (type === 'photo' && photoId) {
      const { data } = await supabase.from('tiktok_photo_carousel').select('*').eq('id', parseInt(photoId)).single();
      if (data) {
        setHoveredBadge({ 
          type: 'photo', 
          id: parseInt(photoId),
          x: rect.left,
          y: rect.bottom + 8,
          photo: data
        });
      }
    } else if (type === 'reel' && reelId) {
      // Get reel data
      const { data: reelData } = await supabase.from('reels_all').select('*').eq('id', parseInt(reelId)).single();
      
      // Get thumbnail from assets table
      const { data: thumbnailData } = await supabase
        .from('media_assets_gif_thumbnail_Reels')
        .select('thumbnail_url, url')
        .eq('video_id', parseInt(reelId))
        .maybeSingle();
      
      if (reelData) {
        setHoveredBadge({ 
          type: 'reel', 
          id: parseInt(reelId),
          x: rect.left,
          y: rect.bottom + 8,
          reel: {
            ...reelData,
            thumbnail_url: thumbnailData?.thumbnail_url || thumbnailData?.url || null
          }
        });
      }
    }
  };

  const handleBadgeLeave = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const badge = target.closest('[data-type]') as HTMLElement;
    
    if (badge) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredBadge(null);
      }, 100);
    }
  };

  const handlePopupEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePopupLeave = () => {
    setHoveredBadge(null);
  };

  const handleEditorDragOver = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDragOver(event, notesEditorRef.current, draggedBadgeRef, dropIndicatorRef);
  };

  const handleEditorDrop = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDrop(
      event,
      notesEditorRef.current,
      draggedBadgeRef,
      dropIndicatorRef,
      () => triggerAutoSave(true), // Immediate save for badge drops
      (badge) => setupBadgeDraggable(badge)
    );
    
    // Re-setup all badges after drop and immediately save
    setTimeout(() => {
      const badges = notesEditorRef.current?.querySelectorAll('[data-type]');
      badges?.forEach(setupBadgeDraggable);
      
      // Immediately cache and save after drop
      if (notesEditorRef.current) {
        const content = notesEditorRef.current.innerHTML;
        console.log('WorkspaceNotesEditor: Drop complete, caching and saving');
        localStorage.setItem('workspace_notes_cache', content);
        saveNotes(false); // Immediate save to database
      }
    }, 100);
  };

  const handleEditorDragLeave = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDragLeave(event, notesEditorRef.current, dropIndicatorRef);
  };

  const setupBadgeDraggable = (badge: Element) => {
    BadgeDragDrop.setupBadgeDraggable(
      badge,
      draggedBadgeRef,
      dropIndicatorRef,
      () => setHoveredBadge(null)
    );
  };

  useEffect(() => {
    const editor = notesEditorRef.current;
    if (!editor) return;

    let setupTimeout: NodeJS.Timeout | null = null;
    let isSettingUp = false;

    const setupAllBadges = () => {
      if (isSettingUp) return;
      isSettingUp = true;
      
      const badges = editor.querySelectorAll('[data-type]');
      console.log('Workspace: Setting up badges, found:', badges.length);
      badges.forEach(setupBadgeDraggable);
      
      // Clear flag after setup completes
      setTimeout(() => {
        isSettingUp = false;
      }, 50);
    };

    // Run setup after a short delay to ensure content is rendered
    const timeoutId = setTimeout(setupAllBadges, 100);

    const observer = new MutationObserver((mutations) => {
      // Filter out drop indicator and other temporary elements
      let shouldSetup = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Skip drop indicators and other temporary elements
              if (element.classList?.contains('bg-primary') && element.classList?.contains('animate-pulse')) {
                return;
              }
              if (element.hasAttribute?.('data-type') || element.querySelector?.('[data-type]')) {
                shouldSetup = true;
              }
            }
          });
        }
      });
      
      if (shouldSetup && !isSettingUp) {
        // Debounce badge setup to prevent rapid re-triggers
        if (setupTimeout) clearTimeout(setupTimeout);
        setupTimeout = setTimeout(() => {
          console.log('Workspace: Mutations detected, re-setting up badges');
          setupAllBadges();
        }, 100);
      }
    });

    observer.observe(editor, {
      childList: true,
      subtree: true
    });

    editor.addEventListener('click', handleBadgeClick);
    editor.addEventListener('mouseover', handleBadgeHover);
    editor.addEventListener('mouseout', handleBadgeLeave);
    editor.addEventListener('dragover', handleEditorDragOver);
    editor.addEventListener('drop', handleEditorDrop);
    editor.addEventListener('dragleave', handleEditorDragLeave);
    
    return () => {
      clearTimeout(timeoutId);
      if (setupTimeout) clearTimeout(setupTimeout);
      observer.disconnect();
      editor.removeEventListener('click', handleBadgeClick);
      editor.removeEventListener('mouseover', handleBadgeHover);
      editor.removeEventListener('mouseout', handleBadgeLeave);
      editor.removeEventListener('dragover', handleEditorDragOver);
      editor.removeEventListener('drop', handleEditorDrop);
      editor.removeEventListener('dragleave', handleEditorDragLeave);
    };
  }, []);


  const currentWordCount = notesEditorRef.current ? countWords(notesEditorRef.current.innerText) : 0;
  const unsavedChanges = currentWordCount !== lastSavedWordCount;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col h-full">
          {/* Toolbar */}
          <div className={`flex flex-wrap items-center gap-2 p-3 bg-muted/50 border-b ${compact ? 'sticky top-0 z-10' : ''}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat('bold')}
              className="h-8 w-8 p-0"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat('italic')}
              className="h-8 w-8 p-0"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat('underline')}
              className="h-8 w-8 p-0"
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyHeading('h1')}
              className="h-8 w-8 p-0"
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyHeading('h2')}
              className="h-8 w-8 p-0"
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat('insertUnorderedList')}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat('insertOrderedList')}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border shadow-lg">
                <DropdownMenuItem onClick={() => applyColor('#000000')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-black" />
                    <span>Black</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('#ef4444')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span>Red</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('#3b82f6')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span>Blue</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('#10b981')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>Green</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  {unsavedChanges ? 'Unsaved changes' : `Saved ${lastSaved.toLocaleTimeString()}`}
                </span>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => saveNotes(true)}
                disabled={saving}
                className="h-8"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

        {/* Editor */}
        <div className={`flex-1 p-4 bg-background focus:outline-none overflow-y-auto ${compact ? 'min-h-[300px]' : 'min-h-[600px]'}`}>
          <div
            ref={notesEditorRef}
            contentEditable
            onInput={handleNotesInput}
            className="w-full h-full focus:outline-none"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
            }}
            data-placeholder="Start writing your ideas..."
          />
        </div>

        {/* Word count footer */}
        <div className="p-2 bg-muted/30 border-t text-xs text-muted-foreground text-right">
          {currentWordCount} words
        </div>
      </div>

      {/* Modals */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {selectedPhoto && (
        <PhotoCarouselModal
          photoCarousel={selectedPhoto}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Badge Hover Card */}
      {hoveredBadge && (() => {
        const content = hoveredBadge.type === 'video' 
          ? hoveredBadge.video
          : hoveredBadge.type === 'photo'
            ? hoveredBadge.photo
            : hoveredBadge.reel;
        
        if (!content) return null;

        // Get thumbnail based on type
        const getThumbnailUrl = () => {
          if (hoveredBadge.type === 'video') {
            return (content as Video).thumbnail_url || (content as Video).gif_url;
          } else if (hoveredBadge.type === 'photo') {
            return fixSupabaseStorageUrl((content as PhotoCarousel).photo_url_1) || '';
          } else {
            return (content as Reel).thumbnail_url || (content as Reel).video_file_url || '';
          }
        };

        // Get views based on type
        const getViews = () => {
          if (hoveredBadge.type === 'video' || hoveredBadge.type === 'reel') {
            return (content as Video | Reel).video_views || 0;
          } else {
            return (content as PhotoCarousel).photo_views || 0;
          }
        };

        // Get type label
        const getTypeLabel = () => {
          if (hoveredBadge.type === 'video') return 'TikTok';
          if (hoveredBadge.type === 'photo') return 'Photo';
          return 'Reel';
        };

        return (
          <div 
            className="fixed z-50 animate-fade-in"
            style={{ 
              left: `${hoveredBadge.x}px`, 
              top: `${hoveredBadge.y}px`,
              maxWidth: '300px'
            }}
            onMouseEnter={handlePopupEnter}
            onMouseLeave={handlePopupLeave}
          >
            <Card className="p-3 bg-slate-800 border-slate-700 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-16 h-20 bg-slate-700 rounded overflow-hidden relative">
                    {hoveredBadge.type === 'reel' && (content as Reel).video_file_url && !(content as Reel).thumbnail_url ? (
                      <video 
                        src={(content as Reel).video_file_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={getThumbnailUrl()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-bold text-orange-400">
                       #{Math.round(content.outliar_score || 0)}
                     </span>
                     <span className="text-xs text-slate-400">
                       {getTypeLabel()}
                     </span>
                   </div>
                  <h3 className="text-sm font-medium text-white mb-1 truncate">
                    {content.content_style || content.genre || getTypeLabel()}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-1">
                    <span>▶ {formatNumber(getViews())} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>👥 {formatNumber(Number(content.profile_followers) || 0)} followers</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};
