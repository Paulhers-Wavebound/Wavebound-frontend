import React from 'react';
import { Button } from './ui/button';

interface LoadingStatesProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreVideos: () => void;
}

const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading,
  loadingMore,
  hasMore,
  loadMoreVideos,
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading viral content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Load More Button - now secondary since we have auto-scroll */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMoreVideos}
            disabled={loadingMore}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                Loading more...
              </>
            ) : (
              'Load More Manually'
            )}
          </Button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {loadingMore && (
        <div className="flex justify-center mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading more content...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingStates;