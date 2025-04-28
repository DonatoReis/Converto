/**
 * Signal Protocol Setup
 * 
 * This script creates the necessary global objects and namespaces
 * that libsignal-protocol expects to find in the global scope.
 * 
 * It MUST be imported and executed before any libsignal-protocol code runs.
 */

import { Long } from './long-shim.js';
import { ByteBuffer } from './bytebuffer-shim.js';

// Create the global dcodeIO namespace and add required objects
function setupGlobalNamespace() {
  if (typeof window !== 'undefined') {
    // Initialize the dcodeIO namespace if it doesn't exist
    window.dcodeIO = window.dcodeIO || {};
    
    // Set the Long implementation
    window.dcodeIO.Long = Long;
    
    // Set the ByteBuffer implementation
    window.dcodeIO.ByteBuffer = ByteBuffer;
    
    console.log('Signal Protocol global namespace setup complete');
  }
}

// Run the setup immediately when this module is imported
setupGlobalNamespace();

// Export objects for direct import if needed
export { Long, ByteBuffer, setupGlobalNamespace };

