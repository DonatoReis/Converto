// src/shims/global-setup.js

// Create the global dcodeIO namespace immediately
(function(global) {
  // Make sure we're in a browser environment
  if (typeof window !== 'undefined') {
    console.log('Setting up global dcodeIO namespace');
    
    // Create the dcodeIO namespace
    window.dcodeIO = window.dcodeIO || {};
    
    // Log to verify it's created
    console.log('dcodeIO namespace created:', window.dcodeIO);
  } else {
    console.error('Not in browser environment, cannot set up dcodeIO namespace');
  }
})(typeof self !== 'undefined' ? self : this);

