import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * TabCloseHandler Component
 * 
 * This component handles automatic logout when the browser tab is closed.
 * It uses multiple strategies to detect tab closure:
 * 
 * 1. beforeunload event - Fires when the page is about to be unloaded
 * 2. pagehide event - Fires when the page is being hidden (tab close, refresh, navigation)
 * 3. visibilitychange event - Fires when the tab becomes hidden/visible
 * 4. Heartbeat mechanism - Updates sessionStorage every second to track active tabs
 * 5. Storage event - Listens for changes in sessionStorage from other tabs
 * 
 * The component also handles multi-tab scenarios:
 * - If one tab logs out, other tabs will also logout
 * - Each tab has a unique identifier in sessionStorage
 * - Session data is cleared when tabs are closed
 */
const TabCloseHandler: React.FC = () => {
    const { logout, isAuthenticated } = useAuth();
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const tabIdRef = useRef<string>('');

    useEffect(() => {
        if (!isAuthenticated) {
            return; // Don't set up handlers if not authenticated
        }

        // Generate a unique tab ID
        const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        tabIdRef.current = tabId;

        // Set up session storage for this tab
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('activeTab', tabId);
        sessionStorage.setItem(`tab_${tabId}_active`, 'true');

        // Heartbeat mechanism to detect if tab is still active
        const startHeartbeat = () => {
            heartbeatRef.current = setInterval(() => {
                const currentTime = Date.now().toString();
                sessionStorage.setItem(`tab_${tabId}_heartbeat`, currentTime);
            }, 1000); // Update heartbeat every second
        };

        // Check if this tab should be logged out (e.g., if another tab logged out)
        const shouldLogout = sessionStorage.getItem('tabClosing') === 'true';
        if (shouldLogout) {
            sessionStorage.removeItem('tabClosing');
            logout();
            return;
        }

        const handleTabClose = () => {
            // Clear authentication data when tab is closed
            sessionStorage.removeItem(`tab_${tabId}_active`);
            sessionStorage.removeItem(`tab_${tabId}_heartbeat`);
            logout();
        };

        const handlePageHide = (event: PageTransitionEvent) => {
            // Check if the page is being unloaded (tab close, refresh, navigation)
            if (event.persisted === false) {
                // For page refresh, we don't want to logout immediately
                // Instead, we'll set a flag and check it when the page loads
                if (document.visibilityState === 'hidden') {
                    sessionStorage.setItem('tabClosing', 'true');
                } else {
                    handleTabClose();
                }
            }
        };

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // This event fires when the page is about to be unloaded
            handleTabClose();
        };

        const handleVisibilityChange = () => {
            // When tab becomes hidden, it might be closing
            if (document.visibilityState === 'hidden') {
                // Set a flag that this tab is closing
                sessionStorage.setItem('tabClosing', 'true');
            } else if (document.visibilityState === 'visible') {
                // Tab became visible again, remove the closing flag
                sessionStorage.removeItem('tabClosing');
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            // If another tab clears the authentication, this tab should also logout
            if (event.key === 'isAuthenticated' && event.newValue === null) {
                logout();
            }
        };

        // Start heartbeat
        startHeartbeat();

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('storage', handleStorageChange);

        // Cleanup function
        return () => {
            // Clear heartbeat
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }

            // Remove event listeners
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('storage', handleStorageChange);
            
            // Clear the tab-specific storage
            const currentTabId = tabIdRef.current;
            if (currentTabId) {
                sessionStorage.removeItem(`tab_${currentTabId}_active`);
                sessionStorage.removeItem(`tab_${currentTabId}_heartbeat`);
            }

            // Clear the active tab flag if this is the active tab
            if (sessionStorage.getItem('activeTab') === currentTabId) {
                sessionStorage.removeItem('activeTab');
                sessionStorage.removeItem('isAuthenticated');
            }
        };
    }, [logout, isAuthenticated]);

    return null; // This component doesn't render anything
};

export default TabCloseHandler; 