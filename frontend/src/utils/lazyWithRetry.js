import { lazy } from 'react';

/**
 * Enhanced React.lazy with automatic retry logic for ChunkLoadErrors.
 * This happens when a new version is deployed and the old chunk hashes no longer exist.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Log the error and refresh once
        console.warn('ChunkLoadError detected. Force refreshing page to sync with latest version...');
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }

      // If we already refreshed and it still fails, bubble up the error
      console.error('Failed to load chunk after refresh:', error);
      throw error;
    }
  });
