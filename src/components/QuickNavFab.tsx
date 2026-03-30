import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, FileText, Sparkles, ArrowRight, StickyNote } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { WorkspaceNotesEditor } from '@/components/WorkspaceNotesEditor';

export const QuickNavFab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favoriteVideoIds, favoritePhotoIds } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  
  const totalFavorites = favoriteVideoIds.length + favoritePhotoIds.length;
  const isOnExplore = location.pathname === '/explore';
  const isOnWorkspace = location.pathname === '/workspace';
  
  // Only show on Explore or Workspace pages
  if (!isOnExplore && !isOnWorkspace) return null;
  
  const targetPath = isOnExplore ? '/workspace' : '/explore';
  const targetLabel = isOnExplore ? 'Go to Workspace' : 'Back to Explore';
  const TargetIcon = isOnExplore ? FileText : Sparkles;
  
  return (
    <>
      <motion.div
        className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-20 bottom-0"
            >
              <Card className="p-3 bg-slate-800/95 border-slate-700 backdrop-blur-lg shadow-2xl">
                <p className="text-sm text-slate-300 whitespace-nowrap">
                  {isOnExplore 
                    ? `${totalFavorites} favorite${totalFavorites !== 1 ? 's' : ''} ready to plan!` 
                    : 'Find more content to add'}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quick Notes Button */}
        <Button
          onClick={() => setIsNotesOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300"
          size="icon"
          title="Quick Notes"
        >
          <StickyNote className="w-6 h-6 text-white" />
        </Button>
        
        {/* Navigation Button */}
        <Button
          onClick={() => navigate(targetPath)}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all duration-300"
          size="icon"
        >
          <div className="relative flex items-center justify-center">
            <TargetIcon className="w-6 h-6 text-white" />
            {isOnExplore && totalFavorites > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-pink-500 text-white border-2 border-slate-900 animate-pulse"
              >
                {totalFavorites}
              </Badge>
            )}
          </div>
        </Button>
      </motion.div>

      {/* Quick Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Quick Notes</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <WorkspaceNotesEditor compact autoFocus />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
