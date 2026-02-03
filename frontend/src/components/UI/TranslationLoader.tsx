import React from 'react';
import { useI18n } from '../../contexts/I18nProvider';
import LoadingSpinner from './LoadingSpinner';

interface TranslationLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingIndicator?: boolean;
  className?: string;
}

/**
 * TranslationLoader component that shows loading state while translations are being loaded
 */
export const TranslationLoader: React.FC<TranslationLoaderProps> = ({
  children,
  fallback,
  showLoadingIndicator = true,
  className = ''
}) => {
  const { isLoading, isReady, loadingNamespaces } = useI18n();

  // Check if any namespaces are currently loading
  const hasLoadingNamespaces = Object.keys(loadingNamespaces).length > 0;

  // Show loading state if i18n is not ready or namespaces are loading
  if (!isReady || (isLoading && showLoadingIndicator)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`translation-loader ${className}`}>
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">
            Loading translations...
          </span>
        </div>
      </div>
    );
  }

  // Show namespace loading indicator if specific namespaces are loading
  if (hasLoadingNamespaces && showLoadingIndicator) {
    const loadingKeys = Object.keys(loadingNamespaces);
    
    return (
      <div className={`translation-loader ${className}`}>
        {children}
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-xs text-gray-600">
              Loading {loadingKeys.length} translation{loadingKeys.length > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Hook to load a specific namespace on demand
 */
export const useTranslationNamespace = (namespace: string) => {
  const { loadNamespace, loadingNamespaces } = useI18n();
  
  const isLoading = React.useMemo(() => {
    return Object.keys(loadingNamespaces).some(key => key.includes(namespace));
  }, [loadingNamespaces, namespace]);

  const loadTranslations = React.useCallback(async () => {
    return await loadNamespace(namespace);
  }, [loadNamespace, namespace]);

  return {
    loadTranslations,
    isLoading
  };
};

/**
 * Higher-order component for lazy loading translations
 */
export const withTranslationLoader = <P extends object>(
  Component: React.ComponentType<P>,
  requiredNamespaces: string[] = []
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const { loadNamespace } = useI18n();
    const [namespacesLoaded, setNamespacesLoaded] = React.useState(false);
    const [loadingError, setLoadingError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const loadRequiredNamespaces = async () => {
        try {
          const loadPromises = requiredNamespaces.map(ns => loadNamespace(ns));
          const results = await Promise.all(loadPromises);
          
          const allLoaded = results.every(result => result);
          if (!allLoaded) {
            setLoadingError('Some translations failed to load');
          }
          
          setNamespacesLoaded(true);
        } catch (error) {
          console.error('Failed to load required namespaces:', error);
          setLoadingError('Failed to load translations');
          setNamespacesLoaded(true); // Continue anyway
        }
      };

      if (requiredNamespaces.length > 0) {
        loadRequiredNamespaces();
      } else {
        setNamespacesLoaded(true);
      }
    }, [loadNamespace]);

    if (!namespacesLoaded) {
      return (
        <TranslationLoader>
          <div>Loading component translations...</div>
        </TranslationLoader>
      );
    }

    if (loadingError) {
      console.warn('Translation loading error:', loadingError);
      // Continue rendering component even with loading errors
    }

    // Check if Component accepts refs
    if (React.isValidElement(React.createElement(Component, props as P))) {
      return React.createElement(Component, { ...props, ref } as P & { ref: any });
    }
    
    return React.createElement(Component, props as P);
  });

  WrappedComponent.displayName = `withTranslationLoader(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default TranslationLoader;