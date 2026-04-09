import { useEffect } from 'react';

export function useSecurityHooks(isTestActive, recordViolation, syncProgress) {
  useEffect(() => {
    if (!isTestActive) return;

    // 1. Block Copy, Paste, and Context Menu
    const preventActions = (e) => {
      e.preventDefault();
      recordViolation('clipboard_attempt', 'Copying and pasting is strictly prohibited.');
    };

    const preventContextMenu = (e) => e.preventDefault();

    // 2. Block Forbidden Keys (Ctrl, Alt, Meta, F-Keys)
    const handleKeyDown = (e) => {
      // Identify if a Function key (F1-F12) was pressed
      const isFunctionKey = e.key.startsWith('F') && e.key.length > 1;
      
      // Detect Ctrl, Alt, or Meta (Windows/Command) combinations
      // This covers Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+P, Ctrl+Shift+I (Inspect), etc.
      if (e.ctrlKey || e.altKey || e.metaKey || isFunctionKey) {
        // We allow some very basic keys if needed, but usually block all for exams
        e.preventDefault();
        e.stopPropagation();
        
        recordViolation(
          'keyboard_shortcut', 
          `System alert: Keyboard shortcut "${e.key}" is disabled to ensure exam integrity.`
        );
      }
    };

    // 3. Detect Tab Switching / Minimizing
    const handleVisibilityChange = () => {
      if (document.hidden) {
        syncProgress('user_left_tab_or_window');
        recordViolation('tab_switch', 'Warning: You left the exam screen. This incident has been logged.');
      }
    };

    // 4. Detect Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('fullscreen_exit', 'Warning: Full-screen mode disabled. Please return to full-screen to continue.');
      }
    };

    // 5. Final Background Sync on Window Close
    const handleUnload = () => {
      syncProgress('user_closed_tab_or_browser');
    };

    // Register Listeners
    document.addEventListener('copy', preventActions);
    document.addEventListener('paste', preventActions);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('pagehide', handleUnload);

    // Cleanup Listeners
    return () => {
      document.removeEventListener('copy', preventActions);
      document.removeEventListener('paste', preventActions);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [isTestActive, recordViolation, syncProgress]);
}