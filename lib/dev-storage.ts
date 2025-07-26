/**
 * Development storage utility for sharing data between API routes
 * This is only used in development mode when the backend is not available
 */

// Use a global object that persists across API route calls
// We'll also sync with localStorage when in browser environment
declare global {
  var __devStorage: {
    roomPasswords: Record<string, string>;
    roomDocuments: Record<string, any[]>;
    roomState: Record<string, any>;
    editorSelections: Record<string, any>;
  };
}

// Initialize the global storage if it doesn't exist
if (!global.__devStorage) {
  global.__devStorage = {
    roomPasswords: {},
    roomDocuments: {},
    roomState: {},
    editorSelections: {}
  };
  
  // Initialize with some test data
  if (process.env.NODE_ENV === 'development') {
    console.log('DevStorage: Initializing development storage');
    
    // Add some test rooms with passwords for development
    global.__devStorage.roomPasswords['TEST123'] = 'password123';
    console.log('DevStorage: Added test room TEST123 with password "password123"');
    
    global.__devStorage.roomPasswords['SECURE'] = 'securepass';
    console.log('DevStorage: Added test room SECURE with password "securepass"');
    
    // Print all stored passwords for debugging
    console.log('DevStorage: All room passwords:', global.__devStorage.roomPasswords);
  }
}

// Use the global object for our storage
const devStorage = global.__devStorage;

// Helper function to check if we're running on the server
const isServerSide = () => typeof window === 'undefined';

/**
 * Load data from storage if available (client-side only)
 */
function loadFromStorage() {
  // Skip loading from storage on the server
  if (isServerSide()) {
    return;
  }

  try {
    // Try to load the state from SessionStorage
    const stateData = sessionStorage.getItem('dev_room_state');
    if (stateData) {
      try {
        devStorage.roomState = JSON.parse(stateData);
      } catch (e) { /* Ignore parse errors */ }
    }
    
    // Try to load passwords from localStorage
    const pwdData = localStorage.getItem('dev_room_passwords');
    if (pwdData) {
      try {
        devStorage.roomPasswords = JSON.parse(pwdData);
      } catch (e) { /* Ignore parse errors */ }
    }
    
    // Try to load editor selections from localStorage
    const selectionData = localStorage.getItem('dev_editor_selections');
    if (selectionData) {
      try {
        devStorage.editorSelections = JSON.parse(selectionData);
      } catch (e) { /* Ignore parse errors */ }
    }
  } catch (error) {
    console.error('DevStorage: Error loading from storage:', error);
  }
}

/**
 * Save data to storage if available (client-side only)
 */
function saveToStorage() {
  // Skip saving to storage on the server
  if (isServerSide()) {
    return;
  }
  
  try {
    // Save to sessionStorage first (faster, but less reliable)
    sessionStorage.setItem('dev_room_state', JSON.stringify(devStorage.roomState));
    
    // Then save to localStorage for better persistence
    localStorage.setItem('dev_room_passwords', JSON.stringify(devStorage.roomPasswords));
    localStorage.setItem('dev_editor_selections', JSON.stringify(devStorage.editorSelections));
  } catch (error) {
    console.error('DevStorage: Error saving to storage:', error);
  }
}

// Try to load from storage on initialization
loadFromStorage();

/**
 * Store a room password
 */
export function storeRoomPassword(roomKey: string, password: string): void {
  if (!roomKey || !password) {
    console.log(`DevStorage: Cannot store empty password for room ${roomKey}`);
    return;
  }
  
  const normalizedKey = roomKey.toUpperCase();
  devStorage.roomPasswords[normalizedKey] = password;
  console.log(`DevStorage: Stored password for room ${normalizedKey}: "${password}"`);
  
  // Save to storage
  saveToStorage();
  
  // Log all current passwords for debugging
  console.log('DevStorage: Current room passwords:', devStorage.roomPasswords);
  console.log('DevStorage: Password count:', Object.keys(devStorage.roomPasswords).length);
  console.log('DevStorage: All room keys:', Object.keys(devStorage.roomPasswords).join(', '));
  
  // Verify the password was stored correctly
  const storedPassword = devStorage.roomPasswords[normalizedKey];
  if (storedPassword === password) {
    console.log(`DevStorage: Verified password for ${normalizedKey} was stored correctly`);
  } else {
    console.error(`DevStorage: Failed to store password for ${normalizedKey}! Expected "${password}" but got "${storedPassword}"`);
  }
}

/**
 * Get a room password
 */
export function getRoomPassword(roomKey: string): string | undefined {
  if (!roomKey) return undefined;
  
  if (isServerSide()) {
    console.log(`Server-side call: Cannot get password for room ${roomKey}`);
    return undefined;
  }
  
  const normalizedKey = roomKey.toUpperCase();
  
  // Try to load from storage first
  loadFromStorage();
  
  const password = devStorage.roomPasswords[normalizedKey];
  if (password) {
    console.log(`DevStorage: Retrieved password for room ${normalizedKey}: "${password}"`);
  } else {
    console.log(`DevStorage: No password found for room ${normalizedKey}`);
  }
  
  return password;
}

/**
 * Check if a room exists and has a password
 */
export function roomHasPassword(roomKey: string): boolean {
  if (!roomKey) return false;
  
  if (isServerSide()) {
    console.log(`Server-side call: Cannot check if room ${roomKey} has password`);
    return false;
  }
  
  const normalizedKey = roomKey.toUpperCase();
  
  // Try to load from storage first
  loadFromStorage();
  
  const hasPassword = Boolean(devStorage.roomPasswords[normalizedKey]);
  console.log(`DevStorage: Room ${normalizedKey} has password: ${hasPassword}`);
  return hasPassword;
}

/**
 * Store documents for a specific room with multiple backup strategies and verification.
 */
export function storeRoomDocuments(roomId: string, documents: any[]): void {
  if (!roomId) {
    console.log('DevStorage: Cannot store documents for empty room ID');
    return;
  }

  if (isServerSide()) {
    console.log(`Server-side call: Cannot store documents for room ${roomId} in localStorage`);
    return;
  }
  
  try {
    // Store in memory first
    devStorage.roomDocuments[roomId] = documents;
    
    // Store in localStorage for persistence
    const data = JSON.stringify(documents);
    localStorage.setItem(`room_${roomId}_documents`, data);
    
    // Also store in a backup key
    localStorage.setItem(`backup_room_${roomId}_documents`, data);
    
    console.log(`Stored ${documents.length} documents for room ${roomId} in localStorage`);
  } catch (error) {
    console.error(`Error storing documents for room ${roomId}:`, error);
  }
}

/**
 * Retrieve documents for a specific room with multiple fallback strategies.
 */
export function getRoomDocuments(roomId: string): any[] {
  try {
    if (!roomId) {
      console.log('DevStorage: Cannot get documents for empty room ID');
      return [];
    }

    // If we're on the server, return an empty array
    if (isServerSide()) {
      console.log(`Server-side call: Cannot access localStorage for room ${roomId} documents`);
      return [];
    }
    
    // 1. First check our in-memory cache
    if (devStorage.roomDocuments[roomId]) {
      console.log(`Retrieved ${devStorage.roomDocuments[roomId].length} documents from memory cache.`);
      return devStorage.roomDocuments[roomId];
    }
    
    // 2. Check all localStorage keys
    const localKeys = [
      `direct_room_${roomId}_documents`,
      `room_${roomId}_documents`,
      `backup_room_${roomId}_documents`
    ];
    for (const key of localKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const documents = JSON.parse(data);
          if (documents && documents.length > 0) {
            console.log(`Retrieved ${documents.length} documents from localStorage key: ${key}`);
            devStorage.roomDocuments[roomId] = documents; // Cache in memory
            return documents;
          }
        } catch (e) { /* ignore parse error */ }
      }
    }

    // 3. Check sessionStorage as a last resort
    const sessionData = sessionStorage.getItem(`room_${roomId}_documents`);
    if (sessionData) {
      try {
        const documents = JSON.parse(sessionData);
        if (documents && documents.length > 0) {
          console.log(`Retrieved ${documents.length} documents from sessionStorage.`);
          devStorage.roomDocuments[roomId] = documents; // Cache in memory
          return documents;
        }
      } catch (e) { /* ignore parse error */ }
    }

    console.log(`No documents found for room ${roomId}.`);
    return [];
  } catch (error) {
    console.error(`Error retrieving documents for room ${roomId}:`, error);
    return [];
  }
}

/**
 * Store room state
 */
export function storeRoomState(roomId: string, state: any): void {
  if (!roomId) {
    console.log('DevStorage: Cannot store state for empty room ID');
    return;
  }
  
  if (isServerSide()) {
    console.log(`Server-side call: Cannot store room state for ${roomId} in storage`);
    return;
  }
  
  // Ensure we have the latest data
  loadFromStorage();
  
  // Merge with existing state if any
  const existingState = devStorage.roomState[roomId] || {};
  devStorage.roomState[roomId] = {
    ...existingState,
    ...state,
    lastUpdated: new Date().toISOString()
  };
  
  console.log(`DevStorage: Stored state for room ${roomId}:`, devStorage.roomState[roomId]);
  
  // Save to storage immediately
  saveToStorage();
}

/**
 * Get room state
 */
export function getRoomState(roomId: string): any {
  if (!roomId) {
    console.log('DevStorage: Cannot get state for empty room ID');
    return null;
  }
  
  if (isServerSide()) {
    console.log(`Server-side call: Cannot access room state for ${roomId} from storage`);
    return null;
  }
  
  // Try to load from storage first
  loadFromStorage();
  
  const state = devStorage.roomState[roomId];
  console.log(`DevStorage: Retrieved state for room ${roomId}:`, state || 'No state found');
  return state;
}

/**
 * Get all stored room keys
 */
export function getAllRoomKeys(): string[] {
  // Try to load from storage first
  loadFromStorage();
  
  return Object.keys(devStorage.roomPasswords);
}

/**
 * Remove a room password
 */
export function removeRoomPassword(roomKey: string): boolean {
  if (!roomKey) return false;
  
  const normalizedKey = roomKey.toUpperCase();
  if (devStorage.roomPasswords[normalizedKey]) {
    delete devStorage.roomPasswords[normalizedKey];
    console.log(`DevStorage: Removed password for room ${normalizedKey}`);
    
    // Save changes to storage
    saveToStorage();
    
    return true;
  }
  
  console.log(`DevStorage: No password to remove for room ${normalizedKey}`);
  return false;
}

/**
 * Test the storage functionality
 */
export function testStorage(): void {
  console.log('DevStorage: Running tests...');
  console.log('DevStorage: All room passwords:', devStorage.roomPasswords);
  
  const testRoom = 'TEST123';
  const hasPassword = roomHasPassword(testRoom);
  console.log(`DevStorage: Room ${testRoom} has password: ${hasPassword}`);
  
  if (hasPassword) {
    const password = getRoomPassword(testRoom);
    console.log(`DevStorage: Password for room ${testRoom}: "${password}"`);
  }
  
  console.log('DevStorage: Tests complete');
}

// Run tests in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testStorage();
  }, 1000);
}

// For debugging
console.log('DevStorage: Module loaded');

/**
 * Store editor selection for a room
 */
export function storeEditorSelection(roomId: string, editorType: string, selection: any): void {
  if (!roomId || !editorType) {
    console.log('DevStorage: Cannot store selection for empty room ID or editor type');
    return;
  }
  
  // Ensure we have the latest data
  loadFromStorage();
  
  // Create a key for this room+editor combination
  const selectionKey = `${roomId}:${editorType}`;
  
  // Store the selection with a timestamp
  devStorage.editorSelections[selectionKey] = {
    ...selection,
    lastUpdated: new Date().toISOString()
  };
  
  console.log(`DevStorage: Stored editor selection for ${selectionKey}:`, devStorage.editorSelections[selectionKey]);
  
  // Save to storage immediately
  saveToStorage();
}

/**
 * Get editor selection for a room
 */
export function getEditorSelection(roomId: string, editorType: string): any {
  if (!roomId || !editorType) {
    console.log('DevStorage: Cannot get selection for empty room ID or editor type');
    return null;
  }
  
  // Try to load from storage first
  loadFromStorage();
  
  // Create a key for this room+editor combination
  const selectionKey = `${roomId}:${editorType}`;
  
  const selection = devStorage.editorSelections[selectionKey];
  console.log(`DevStorage: Retrieved editor selection for ${selectionKey}:`, selection || 'No selection found');
  return selection;
}

/**
 * Generate a consistent ID from a room key
 * This ensures the same room key always generates the same ID
 */
export function generateConsistentId(roomKey: string): string {
  // Use a simple hash function to convert the room key to a UUID-like string
  const hash = Array.from(roomKey).reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Format as a UUID-like string
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}-${roomKey.toLowerCase()}-4000-a000-000000000000`.substring(0, 36);
}

export default devStorage;

/**
 * Debug function to check all storage locations for a room
 */
export function debugRoomStorage(roomId: string): void {
  console.log(`=== DEBUG STORAGE FOR ROOM ${roomId} ===`);
  
  // Check memory
  const memoryDocs = devStorage.roomDocuments[roomId];
  console.log(`Memory: ${memoryDocs ? memoryDocs.length : 0} documents`);
  
  // Check direct localStorage
  const directKey = `direct_room_${roomId}_documents`;
  const directData = localStorage.getItem(directKey);
  console.log(`Direct localStorage (${directKey}): ${directData ? JSON.parse(directData).length : 0} documents`);
  
  // Check regular localStorage
  const localKey = `room_${roomId}_documents`;
  const localData = localStorage.getItem(localKey);
  console.log(`Regular localStorage (${localKey}): ${localData ? JSON.parse(localData).length : 0} documents`);
  
  // Check sessionStorage
  const sessionKey = `room_${roomId}_documents`;
  const sessionData = sessionStorage.getItem(sessionKey);
  console.log(`SessionStorage (${sessionKey}): ${sessionData ? JSON.parse(sessionData).length : 0} documents`);
  
  // Check timestamped backups
  const allKeys = Object.keys(localStorage);
  const timestampKeys = allKeys.filter(key => key.startsWith(`room_${roomId}_documents_`));
  console.log(`Timestamped backups: ${timestampKeys.length} found`);
  timestampKeys.forEach(key => {
    const data = localStorage.getItem(key);
    console.log(`  ${key}: ${data ? JSON.parse(data).length : 0} documents`);
  });
  
  // Check room state
  const roomState = getRoomState(roomId);
  console.log(`Room state:`, roomState);
  
  console.log(`=== END DEBUG STORAGE FOR ROOM ${roomId} ===`);
}

/**
 * Force save a document to all storage locations
 */
export function forceSaveDocument(roomId: string, document: any): void {
  console.log(`DevStorage: Force saving single document for room ${roomId}`);
  
  // Get existing documents
  const existingDocs = getRoomDocuments(roomId);
  
  // Update or add the document
  let updatedDocs = [...existingDocs];
  const existingIndex = updatedDocs.findIndex(doc => doc.id === document.id);
  
  if (existingIndex >= 0) {
    updatedDocs[existingIndex] = document;
    console.log(`DevStorage: Updated existing document ${document.id} for room ${roomId}`);
  } else {
    updatedDocs.push(document);
    console.log(`DevStorage: Added new document ${document.id} for room ${roomId}`);
  }
  
  // Store the updated documents
  storeRoomDocuments(roomId, updatedDocs);
} 