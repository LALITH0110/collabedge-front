"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeEditor } from "@/components/editors/code-editor"
import { WordEditor } from "@/components/editors/word-editor"
import { SpreadsheetEditor } from "@/components/editors/spreadsheet-editor"
import { PresentationEditor } from "@/components/editors/presentation-editor"
import { FreeformEditor } from "@/components/editors/freeform-editor"
import { CustomEditor } from "@/components/editors/custom-editor"
import {
  Plus,
  Users,
  Save,
  FileText,
  Code,
  Presentation,
  Table,
  PenTool,
  LayoutGrid,
  Pencil,
  Check,
  X,
  Download,
  Trash2,
  Crown,
  Clock,
  ChevronRight,
  Sparkles,
  Menu,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useWebSocket } from "@/hooks/use-websocket"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { storeRoomDocuments, getRoomDocuments, debugRoomStorage, forceSaveDocument } from "@/lib/dev-storage"
import { getRoomState, storeRoomState } from "@/lib/dev-storage"
import { AIChatSidebar } from "@/components/ai-chat-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/auth-service"

type Document = {
  id: string
  name: string
  type: string
  content: string
  contentType?: string
  binaryContent?: ArrayBuffer
  imageDataUrl?: string // For storing image data URLs separately from content
  pendingImageUpload?: boolean // Flag to indicate if an image needs to be uploaded
}

type EditorType = {
  id: string
  name: string
  icon: React.ElementType
  status?: 'available' | 'pro' | 'coming-soon'
  badge?: React.ElementType
  tooltipText?: string
}

type LanguageGroup = {
  name: string
  languages: {
    id: string
    name: string
    extension: string
    icon?: React.ElementType
  }[]
}

const editorTypes: EditorType[] = [
  { id: "word", name: "Word Document", icon: FileText, status: "available" },
  { id: "code", name: "Code Editor", icon: Code, status: "available" },
  { id: "freeform", name: "Freeform Canvas", icon: PenTool, status: "pro", badge: Crown, tooltipText: "Only for Pro users" },
  { id: "presentation", name: "Presentation", icon: Presentation, status: "coming-soon", badge: Clock, tooltipText: "Coming Soon" },
  { id: "spreadsheet", name: "Spreadsheet", icon: Table, status: "coming-soon", badge: Clock, tooltipText: "Coming Soon" },
  { id: "custom", name: "Custom Editor", icon: LayoutGrid, status: "coming-soon", badge: Clock, tooltipText: "Coming Soon" },
]

const languageGroups: LanguageGroup[] = [
  {
    name: "Web Development",
    languages: [
      { id: "javascript", name: "JavaScript", extension: "js" },
      { id: "typescript", name: "TypeScript", extension: "ts" },
      { id: "html", name: "HTML", extension: "html" },
      { id: "css", name: "CSS", extension: "css" },
      { id: "scss", name: "SCSS", extension: "scss" },
      { id: "sass", name: "Sass", extension: "sass" },
      { id: "less", name: "Less", extension: "less" },
      { id: "php", name: "PHP", extension: "php" },
    ]
  },
  {
    name: "General Purpose",
    languages: [
      { id: "python", name: "Python", extension: "py" },
      { id: "java", name: "Java", extension: "java" },
      { id: "csharp", name: "C#", extension: "cs" },
      { id: "ruby", name: "Ruby", extension: "rb" },
      { id: "swift", name: "Swift", extension: "swift" },
      { id: "kotlin", name: "Kotlin", extension: "kt" },
      { id: "scala", name: "Scala", extension: "scala" },
      { id: "dart", name: "Dart", extension: "dart" },
    ]
  },
  {
    name: "Systems Programming",
    languages: [
      { id: "cpp", name: "C++", extension: "cpp" },
      { id: "c", name: "C", extension: "c" },
      { id: "rust", name: "Rust", extension: "rs" },
      { id: "go", name: "Go", extension: "go" },
      { id: "zig", name: "Zig", extension: "zig" },
      { id: "v", name: "V", extension: "v" },
      { id: "nim", name: "Nim", extension: "nim" },
      { id: "crystal", name: "Crystal", extension: "cr" },
    ]
  },
  {
    name: "Functional Programming",
    languages: [
      { id: "haskell", name: "Haskell", extension: "hs" },
      { id: "clojure", name: "Clojure", extension: "clj" },
      { id: "elixir", name: "Elixir", extension: "ex" },
      { id: "fsharp", name: "F#", extension: "fs" },
      { id: "ocaml", name: "OCaml", extension: "ml" },
      { id: "erlang", name: "Erlang", extension: "erl" },
    ]
  },
  {
    name: "Data & Scripting",
    languages: [
      { id: "r", name: "R", extension: "r" },
      { id: "matlab", name: "MATLAB", extension: "m" },
      { id: "perl", name: "Perl", extension: "pl" },
      { id: "lua", name: "Lua", extension: "lua" },
      { id: "groovy", name: "Groovy", extension: "groovy" },
    ]
  },
  {
    name: "Configuration & Data",
    languages: [
      { id: "json", name: "JSON", extension: "json" },
      { id: "xml", name: "XML", extension: "xml" },
      { id: "yaml", name: "YAML", extension: "yaml" },
      { id: "sql", name: "SQL", extension: "sql" },
      { id: "markdown", name: "Markdown", extension: "md" },
    ]
  },
  {
    name: "Shell & Scripts",
    languages: [
      { id: "shell", name: "Shell Script", extension: "sh" },
      { id: "powershell", name: "PowerShell", extension: "ps1" },
    ]
  },
  {
    name: "Assembly & Low Level",
    languages: [
      { id: "assembly", name: "Assembly", extension: "asm" },
      { id: "makefile", name: "Makefile", extension: "makefile" },
    ]
  }
]

// Helper function to safely access browser storage
const isBrowser = typeof window !== 'undefined';

const safelyGetFromLocalStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(`Error reading from localStorage: ${e}`);
    return null;
  }
};

const safelySetToLocalStorage = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Error writing to localStorage: ${e}`);
  }
};

export function EditorContainer({
  roomId,
  editorType,
  showSidebar,
  setShowSidebar,
}: {
  roomId: string
  editorType: string
  showSidebar?: boolean
  setShowSidebar?: (show: boolean) => void
}) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [roomKey, setRoomKey] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")
  
  // Document deletion confirmation
  const [showDeleteDocumentDialog, setShowDeleteDocumentDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null)

  // AI Chat state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const { user } = useAuth()

  // Inline Diff state
  const [showInlineDiff, setShowInlineDiff] = useState(false)
  const [diffData, setDiffData] = useState<{
    originalCode: string
    suggestedCode: string
  } | null>(null)

  // Ref to track current documents for diff updates
  const documentsRef = useRef(documents)
  documentsRef.current = documents

  // Memoized callback for updating editor content during diff view
  const updateEditorContentForDiff = useCallback((documentId: string, newContent: string) => {
    const currentDocs = documentsRef.current
    const updatedDoc = { ...currentDocs.find(doc => doc.id === documentId)!, content: newContent }
    const updatedDocs = currentDocs.map(doc => 
      doc.id === documentId ? updatedDoc : doc
    )
    setDocuments(updatedDocs)
  }, []) // No dependencies to prevent infinite loops

  const { isConnected, lastMessage, sendMessage } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws/room/${roomId}`)

  // Send JOIN message when WebSocket connects (only once)
  useEffect(() => {
    if (isConnected && sendMessage) {
      console.log(`🔗 WebSocket connected, sending JOIN message for room ${roomId}`);
      
              // Generate a valid username that won't be rejected by backend
        const storedUsername = localStorage.getItem('username');
        const randomGuest = `Guest${Math.floor(Math.random() * 10000)}`;
        const username = storedUsername && 
                        storedUsername !== "User" && 
                        storedUsername !== "Anonymous" && 
                        !storedUsername.toLowerCase().includes("user") && 
                        !storedUsername.toLowerCase().includes("anonymous") && 
                        storedUsername.trim() !== ""
          ? storedUsername 
          : randomGuest;
        
        const joinMessage = {
          type: "JOIN",
          username: username,
          roomId: roomId,
          timestamp: Date.now()
        };
      
      try {
        sendMessage(JSON.stringify(joinMessage));
        console.log(`📤 Sent JOIN message for room ${roomId}`);
        
        // Send a test message to verify connectivity
        setTimeout(() => {
          const testMessage = {
            type: "TEST",
            roomId: roomId,
            message: "Test message from frontend",
            timestamp: Date.now()
          };
          sendMessage(JSON.stringify(testMessage));
          console.log(`🧪 Sent test message for room ${roomId}`);
        }, 1000);
        
      } catch (error) {
        console.warn(`⚠️ Failed to send JOIN message:`, error);
      }
    }
  }, [isConnected, sendMessage, roomId]);

  // Get room information from localStorage or API
  useEffect(() => {
    if (!isBrowser) return;
    
    const loadRoomMetadata = async () => {
      // First try localStorage
      const storedRoom = safelyGetFromLocalStorage('currentRoom');
      if (storedRoom) {
        try {
          const roomData = JSON.parse(storedRoom)
          if (roomData.roomKey && roomData.name) {
            setRoomKey(roomData.roomKey)
            setRoomName(roomData.name)
            console.log(`Loaded room metadata from localStorage: ${roomData.name} (${roomData.roomKey})`)
            return;
          }
        } catch (e) {
          console.error('Error parsing room data:', e)
        }
      }
      
      // Fallback: fetch room metadata from API
      try {
        console.log(`Fetching room metadata from API for room ${roomId}...`)
        const response = await fetch(`/api/rooms/${roomId}`)
        if (response.ok) {
          const roomData = await response.json()
          setRoomKey(roomData.roomKey || "")
          setRoomName(roomData.name || "")
          
          // Store it for future use
          localStorage.setItem('currentRoom', JSON.stringify(roomData))
          console.log(`Loaded and stored room metadata from API: ${roomData.name} (${roomData.roomKey})`)
        } else {
          console.warn(`Failed to fetch room metadata for room ${roomId}, status: ${response.status}`)
        }
      } catch (error) {
        console.error(`Error fetching room metadata for room ${roomId}:`, error)
      }
    }
    
    loadRoomMetadata()
  }, [roomId])

  // Ensure localStorage operations are only performed in the browser
  const storeRoomDocumentsWrapper = useCallback((roomId: string, documents: any[]) => {
    if (!isBrowser) return;
    storeRoomDocuments(roomId, documents);
  }, []);

  const getRoomDocumentsWrapper = useCallback((roomId: string) => {
    if (!isBrowser) return [];
    return getRoomDocuments(roomId);
  }, []);

  const forceSaveDocumentWrapper = useCallback((roomId: string, document: any) => {
    if (!isBrowser) return;
    forceSaveDocument(roomId, document);
  }, []);

  // Create default document function - memoized to prevent re-renders
  const createDefaultDocument = useCallback(async () => {
    if (!isBrowser) return;
    
    console.log(`Creating default document for room ${roomId} with editor type ${editorType}...`);
    
    // Set default content based on editor type
    let defaultContent = "";
    if (editorType === "word") {
      defaultContent = "<h1>Untitled</h1><p>Start typing here...</p>";
    } else if (editorType === "code") {
      defaultContent = "// Write your code here\n\n";
    } else if (editorType === "spreadsheet") {
      defaultContent = JSON.stringify({ data: [["", "", ""], ["", "", ""], ["", "", ""]] });
    } else if (editorType === "presentation") {
      defaultContent = JSON.stringify({ slides: [{ title: "Untitled Presentation", content: "Add your content here..." }] });
    } else if (editorType === "freeform") {
      defaultContent = JSON.stringify({ elements: [] });
    }
    
    // Create a default document locally first for immediate display
    const tempDocId = `temp-doc-${Math.random().toString(36).substring(2, 9)}`;
    
    // Generate appropriate default name based on editor type
    let defaultName: string;
    if (editorType === 'code') {
      defaultName = 'untitled.js';
    } else {
      defaultName = `New ${editorType.charAt(0).toUpperCase() + editorType.slice(1)}`;
    }
    
    const tempDoc: Document = {
      id: tempDocId,
      name: defaultName,
      type: editorType.toLowerCase(),
      content: defaultContent,
    };
    
    // Update state immediately for better UX
    setDocuments([tempDoc]);
    setActiveTab(tempDoc.id);
    
    // Store it locally
    storeRoomDocumentsWrapper(roomId, [tempDoc]);
    
    // Try to create the document in the database (non-blocking)
    try {
      console.log(`Attempting to create document in database for room ${roomId}`);
      
      // Create an abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const createResponse = await fetch(`/api/rooms/${roomId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tempDoc.name,
          type: tempDoc.type,
          content: tempDoc.content,
        }),
        // Add a reasonable timeout
        signal: controller.signal,
      }).catch(error => {
        console.error(`Network error creating document in database for room ${roomId}:`, error);
        return null;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);

      if (createResponse && createResponse.ok) {
        const createdDoc = await createResponse.json();
        console.log(`Created document in database for room ${roomId}:`, createdDoc);
        
        // Convert to frontend format and replace the temporary document
        const persistedDoc: Document = {
          id: createdDoc.id,
          name: createdDoc.name,
          type: createdDoc.type.toLowerCase(),
          content: createdDoc.content || defaultContent,
        };

        setDocuments([persistedDoc]);
        setActiveTab(persistedDoc.id);
        
        // Update localStorage
        storeRoomDocumentsWrapper(roomId, [persistedDoc]);
        console.log(`Updated local storage with persistent document ID for room ${roomId}`);
      } else {
        console.warn(`Failed to create document in database for room ${roomId}, status: ${createResponse?.status || 'Network Error'}`);
        console.warn(`Using local document instead - changes will be saved locally only`);
        // Keep using the temporary document, it will be created in DB when user makes changes
      }
    } catch (error) {
      console.error(`Error creating document in database for room ${roomId}:`, error);
      // Local document is already set up, so we can continue using that
    }
  }, [roomId, editorType, storeRoomDocumentsWrapper]);

  // Define fetchDocuments function - memoized to prevent re-renders
  const fetchDocuments = useCallback(async (roomId: string) => {
    try {
      console.log(`Fetching documents for room ${roomId}...`);
      
      // Skip API calls during SSR to prevent hydration issues
      if (!isBrowser) {
        console.log('Skipping document fetch during SSR');
        return;
      }
      
      // First try to fetch from backend database
      try {
        const response = await fetch(`/api/rooms/${roomId}/documents`);
        if (response.ok) {
          const docs = await response.json();
          if (docs && docs.length > 0) {
            console.log(`Found ${docs.length} documents from database for room ${roomId}:`, docs);
            
            // Convert backend document format to frontend format
            const convertedDocs = docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              type: doc.type.toLowerCase(),
              content: doc.content || "",
              contentType: doc.contentType || null,
              // Note: binary content is handled separately through the /image endpoint
            }));
            
            // Process any binary content
            for (const doc of convertedDocs) {
              if (doc.contentType && doc.contentType.startsWith('image/')) {
                try {
                  // Fetch the binary image content
                  const imageResponse = await fetch(`/api/rooms/${roomId}/documents/${doc.id}/image`);
                  if (imageResponse.ok) {
                    // For images, create a data URL for display but don't store it as content
                    const blob = await imageResponse.blob();
                    const reader = new FileReader();
                    reader.onload = function() {
                      // Store the data URL in a separate field, not as content
                      const imageDataUrl = reader.result as string;
                      
                      // Update document in state with image data URL in a separate field
                      setDocuments(prevDocs => {
                        return prevDocs.map(d => d.id === doc.id ? {
                          ...d, 
                          imageDataUrl: imageDataUrl, // Store image separately
                          content: doc.content || "" // Keep original content
                        } : d);
                      });
                      
                      // Update in localStorage with the image data URL
                      const updatedDocs = convertedDocs.map((d: Document) => 
                        d.id === doc.id ? { ...d, imageDataUrl: imageDataUrl } : d
                      );
                      storeRoomDocumentsWrapper(roomId, updatedDocs);
                    };
                    reader.readAsDataURL(blob);
                  } else {
                    console.warn(`Failed to fetch image for document ${doc.id}`);
                  }
                } catch (err) {
                  console.error(`Error fetching image for document ${doc.id}:`, err);
                }
              }
            }
            
            setDocuments(convertedDocs);
            setActiveTab(convertedDocs[0].id);
            
            // Save to localStorage for offline use
            storeRoomDocumentsWrapper(roomId, convertedDocs);
            console.log(`Stored ${convertedDocs.length} documents from database to localStorage for room ${roomId}`);
            return;
          }
        } else {
          console.log(`No documents found in database for room ${roomId}, status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching documents from database for room ${roomId}:`, error);
      }
      
      // Fallback: try to get documents from localStorage
      const storedDocs = getRoomDocumentsWrapper(roomId);
      if (storedDocs && storedDocs.length > 0) {
        console.log(`Found ${storedDocs.length} documents in localStorage for room ${roomId}:`, storedDocs);
        setDocuments(storedDocs);
        setActiveTab(storedDocs[0].id);
        return;
      }
      
      // If no documents exist, create a default one
      console.log(`No documents found for room ${roomId}, creating default document`);
      await createDefaultDocument();
    } catch (error) {
      console.error(`Error fetching documents for room ${roomId}:`, error);
      // Fall back to creating a default document
      await createDefaultDocument();
    }
  }, [roomId, storeRoomDocumentsWrapper, getRoomDocumentsWrapper, createDefaultDocument]);
  
  // Initialize with a default document based on the editor type
  useEffect(() => {
    // Only run this once when the component mounts
    let hasRun = false;
    
    const init = async () => {
      if (hasRun) return;
      hasRun = true;
      
      // First try to fetch existing documents for this room
      await fetchDocuments(roomId);
    };
    
    init();
    
          // Listen for storage events from other tabs with throttling
      if (isBrowser) {
        let storageUpdateTimeout: NodeJS.Timeout | null = null;
        
        const handleStorageEvent = (event: StorageEvent) => {
          if (!event || !event.key) return;
          
          // Prevent processing our own storage updates
          if (event.storageArea === sessionStorage) return;
          
          // Throttle storage updates to prevent excessive re-renders
          if (storageUpdateTimeout) {
            clearTimeout(storageUpdateTimeout);
          }
          
          storageUpdateTimeout = setTimeout(() => {
            if (event.key === `room_${roomId}_documents` && event.newValue) {
              try {
                const docs = JSON.parse(event.newValue);
                
                // Only update if the documents are actually different and newer
                setDocuments(prevDocs => {
                  const currentHash = JSON.stringify(prevDocs);
                  const newHash = JSON.stringify(docs);
                  
                  if (currentHash !== newHash) {
                    console.log(`Storage event: updating documents from another tab for room ${roomId}`);
                    return docs;
                  }
                  return prevDocs;
                });
              } catch (error) {
                console.error('Error parsing documents from storage event:', error);
              }
            }
          }, 500); // 500ms throttle
        };
        
        window.addEventListener('storage', handleStorageEvent);
        
        return () => {
          window.removeEventListener('storage', handleStorageEvent);
          if (storageUpdateTimeout) {
            clearTimeout(storageUpdateTimeout);
          }
        };
      }
  }, [roomId, editorType, fetchDocuments]);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTabId])

  // Handle WebSocket messages with simplified filtering
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)

        if (data.type === "CONNECTED") {
          console.log(`✅ Connected to room ${data.roomId}`);
          // Send JOIN message when connected
          const authUsername = authService.getCurrentUsername();
          const contextUsername = user?.username;
          const username = contextUsername || authUsername;
          
          console.log("👤 Current user info:", { 
            user, 
            contextUsername, 
            authUsername, 
            finalUsername: username,
            isAuthenticated: authService.isAuthenticated(),
            token: authService.getToken() ? 'present' : 'missing'
          });
          
          // Only send JOIN message if we have a valid username
          if (username && username !== 'User' && username !== 'Anonymous') {
            const joinMessage = {
              type: "JOIN",
              username: username,
              roomId: roomId
            };
            sendMessage(JSON.stringify(joinMessage));
            console.log("👤 Sent JOIN message for user:", username);
          } else {
            console.warn("⚠️ Invalid username detected:", username, "- skipping JOIN message");
          }
        } else if (data.type === "TEST") {
          console.log(`🧪 Received test message:`, data.message);
        } else if (data.type === "DOCUMENT_UPDATE" || data.documentId) {
          // Only update if the content is actually different to prevent loops
          setDocuments((prev) => {
            const existingDoc = prev.find(doc => doc.id === data.documentId);
            if (!existingDoc || (existingDoc.content === data.content && existingDoc.imageDataUrl === data.imageDataUrl)) {
              return prev; // No change needed
            }
            
            console.log(`🔄 Received real-time update for document ${data.documentId}`);
            
            return prev.map((doc) => {
              if (doc.id === data.documentId) {
                // Handle both text and image content
                if (data.imageDataUrl) {
                  return { 
                    ...doc, 
                    imageDataUrl: data.imageDataUrl,
                    content: data.content || "",
                    contentType: data.contentType || 'image/png'
                  };
                } else if (data.contentType && data.contentType.startsWith('image/')) {
                  return { 
                    ...doc, 
                    content: data.content || doc.content, 
                    contentType: data.contentType,
                    binaryContent: data.binaryContent 
                  };
                } else {
                  return { ...doc, content: data.content };
                }
              }
              return doc;
            });
          });
        } else if (data.type === "DOCUMENT_RENAME") {
          // Handle document rename
          console.log(`🔄 Received document rename for ${data.documentId}: ${data.name}`);
          setDocuments((prev) => {
            return prev.map((doc) => {
              if (doc.id === data.documentId) {
                return { ...doc, name: data.name };
              }
              return doc;
            });
          });
        } else if (data.type === "DOCUMENT_DELETE") {
          // Handle document deletion
          console.log(`🔄 Received document deletion for ${data.documentId}`);
          console.log(`📊 Current documents before deletion:`, documents.map(d => ({ id: d.id, name: d.name })));
          console.log(`📊 Active tab: ${activeTab}`);
          
          setDocuments((prev) => {
            const newDocs = prev.filter(doc => doc.id !== data.documentId);
            console.log(`📊 Documents after deletion:`, newDocs.map(d => ({ id: d.id, name: d.name })));
            
            // Ensure at least one document remains
            if (newDocs.length === 0) {
              console.log(`❌ No documents left, creating default document`);
              // Create a default document - this will be handled by the deletion logic
              return prev; // Keep the current docs, let the deletion logic handle it
            }
            
            // Update active tab if the deleted document was active
            if (activeTab === data.documentId) {
              console.log(`🔄 Active tab was deleted, switching to ${newDocs[0].id}`);
              setActiveTab(newDocs[0].id);
            }
            
            return newDocs;
          });
        } else if (data.type === "USER_JOINED") {
          console.log(`👤 User ${data.username} joined`);
          setConnectedUsers((prev) => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        } else if (data.type === "USER_LEFT") {
          console.log(`👤 User ${data.username} left`);
          setConnectedUsers((prev) => prev.filter((user) => user !== data.username));
        } else if (data.type === "USER_LIST_UPDATE") {
          console.log(`👥 Received user list update:`, data.users);
          setConnectedUsers(data.users || []);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    }
  }, [lastMessage, documents, activeTab, user?.username, roomId, sendMessage]);

  // Helper function to check if a string is a valid UUID - memoized
  const isUuid = useCallback((id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }, []);

  // Improved handleContentChange with better debouncing and WebSocket independence
  const handleContentChange = useCallback((documentId: string, content: string, contentType?: string, binaryContent?: ArrayBuffer) => {
    const timestamp = Date.now();
    
    // Immediately update the documents array in the component's state
    const updatedDocs = documents.map(doc => {
      if (doc.id === documentId) {
        // Check if this is an image (data URL) - store it separately from content
        if (content && content.startsWith('data:image/')) {
          return { 
            ...doc, 
            imageDataUrl: content, // Store image data URL separately
            content: "", // Keep content clean for images
            contentType: contentType || (content.match(/data:(.*?);/) ? content.match(/data:(.*?);/)![1] : 'image/png'),
            pendingImageUpload: true // Flag to indicate image needs to be uploaded
          };
        }
        return { ...doc, content, contentType, binaryContent };
      }
      return doc;
    });
    
    setDocuments(updatedDocs);
    
    // Show a syncing indicator in the UI
    setIsSyncing(true);

    // ALWAYS save to localStorage immediately (independent of WebSocket)
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    
    // Also save the specific document directly to localStorage
    const updatedDoc = updatedDocs.find(doc => doc.id === documentId);
    if (updatedDoc) {
      forceSaveDocumentWrapper(roomId, updatedDoc);
    }

    // Clear any existing timer and set up a new one for auto-save to database
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      // Auto-save to database after user stops typing for 2 seconds
      if (updatedDoc) {
        try {
          const isUuidResult = isUuid(documentId);
          
          if (isUuidResult) {
            // Update existing document in database
            console.log(`💾 Auto-saving document ${documentId} to database...`);
            
            // For images, convert data URL to binary and upload
            if (updatedDoc.imageDataUrl && updatedDoc.pendingImageUpload) {
              console.log(`🖼️ Converting image data URL to binary for ${documentId}`);
              
              try {
                // Convert data URL to blob
                const response = await fetch(updatedDoc.imageDataUrl);
                const blob = await response.blob();
                
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', blob, 'canvas.png');
                
                const uploadResponse = await fetch(`/api/rooms/${roomId}/documents/${documentId}/upload-image`, {
                  method: 'PUT',
                  body: formData,
                });
                
                if (uploadResponse.ok) {
                  console.log(`✅ Successfully uploaded image for document ${documentId}`);
                  // Mark as no longer pending upload
                  const newUpdatedDocs = updatedDocs.map(doc => 
                    doc.id === documentId ? { ...doc, pendingImageUpload: false } : doc
                  );
                  setDocuments(newUpdatedDocs);
                  storeRoomDocumentsWrapper(roomId, newUpdatedDocs);
                } else {
                  console.error(`❌ Failed to upload image for document ${documentId}, status: ${uploadResponse.status}`);
                }
              } catch (error) {
                console.error(`💥 Error uploading image for document ${documentId}:`, error);
              }
            } else {
              // Regular text content
              const contentToSave = updatedDoc.imageDataUrl ? "" : content;
              
              const response = await fetch(`/api/rooms/${roomId}/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updatedDoc.name,
                  type: updatedDoc.type.toLowerCase(),
                  content: contentToSave,
                }),
              });

              if (response.ok) {
                console.log(`✅ Successfully auto-saved document ${documentId} to database`);
                setLastSaved(new Date());
              } else {
                console.error(`❌ Failed to auto-save document ${documentId} to database, status: ${response.status}`);
              }
            }
          } else {
            // Create new document in database
            console.log(`💾 Auto-creating document ${updatedDoc.name} in database...`);
            
            // For images, create document first then upload image
            if (updatedDoc.imageDataUrl && updatedDoc.pendingImageUpload) {
              // Create document with empty content first
              const response = await fetch(`/api/rooms/${roomId}/documents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updatedDoc.name,
                  type: updatedDoc.type.toLowerCase(),
                  content: "",
                }),
              });

              if (response.ok) {
                const createdDoc = await response.json();
                console.log(`✅ Successfully created document ${updatedDoc.name} in database with ID ${createdDoc.id}`);
                
                // Now upload the image
                try {
                  const response = await fetch(updatedDoc.imageDataUrl);
                  const blob = await response.blob();
                  
                  const formData = new FormData();
                  formData.append('file', blob, 'canvas.png');
                  
                  const uploadResponse = await fetch(`/api/rooms/${roomId}/documents/${createdDoc.id}/upload-image`, {
                    method: 'PUT',
                    body: formData,
                  });
                  
                  if (uploadResponse.ok) {
                    console.log(`✅ Successfully uploaded image for new document ${createdDoc.id}`);
                    
                    // Update the document ID in local state
                    const newUpdatedDocs = updatedDocs.map(doc => 
                      doc.id === documentId ? { ...doc, id: createdDoc.id, pendingImageUpload: false } : doc
                    );
                    setDocuments(newUpdatedDocs);
                    storeRoomDocumentsWrapper(roomId, newUpdatedDocs);
                    
                    // Update active tab if it was the created document
                    if (activeTab === documentId) {
                      setActiveTab(createdDoc.id);
                    }
                    
                    setLastSaved(new Date());
                  } else {
                    console.error(`❌ Failed to upload image for new document ${createdDoc.id}, status: ${uploadResponse.status}`);
                  }
                } catch (error) {
                  console.error(`💥 Error uploading image for new document ${createdDoc.id}:`, error);
                }
              } else {
                console.error(`❌ Failed to create document ${updatedDoc.name} in database, status: ${response.status}`);
              }
            } else {
              // Regular text content
              const contentToSave = updatedDoc.imageDataUrl ? "" : content;
              
              const response = await fetch(`/api/rooms/${roomId}/documents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updatedDoc.name,
                  type: updatedDoc.type.toLowerCase(),
                  content: contentToSave,
                }),
              });

              if (response.ok) {
                const createdDoc = await response.json();
                console.log(`✅ Successfully auto-created document ${updatedDoc.name} in database with ID ${createdDoc.id}`);
                
                // Update the document ID in local state
                const newUpdatedDocs = updatedDocs.map(doc => 
                  doc.id === documentId ? { ...doc, id: createdDoc.id, pendingImageUpload: false } : doc
                );
                setDocuments(newUpdatedDocs);
                storeRoomDocumentsWrapper(roomId, newUpdatedDocs);
                
                // Update active tab if it was the created document
                if (activeTab === documentId) {
                  setActiveTab(createdDoc.id);
                }
                
                setLastSaved(new Date());
              } else {
                console.error(`❌ Failed to auto-create document ${updatedDoc.name} in database, status: ${response.status}`);
              }
            }
          }
        } catch (error) {
          console.error(`💥 Error auto-saving document ${documentId}:`, error);
        }
      }
      
      setIsSyncing(false);
      console.log(`📄 Content for doc ${documentId} auto-saved.`);
    }, 2000); // Reduced back to 2 seconds

    // Send update to other users via WebSocket ONLY if connected (optional feature)
    if (isConnected && isUuid(documentId)) {
      try {
        const message = {
          documentId,
          content,
          contentType,
          binaryContent,
          imageDataUrl: updatedDoc?.imageDataUrl, // Include image data URL for syncing
          timestamp,
          username: "You"
        };
        
        sendMessage(JSON.stringify(message));
        console.log(`🔄 Sent real-time update for document ${documentId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to send real-time update (WebSocket issue):`, error);
        // Don't fail the save operation if WebSocket fails
      }
    }
  }, [documents, roomId, storeRoomDocumentsWrapper, forceSaveDocumentWrapper, activeTab, isConnected, sendMessage, isUuid]);

    const addNewDocument = useCallback(async (type: string, languageId?: string) => {
    console.log(`Adding new ${type} document to room ${roomId}...`);
    
    // Check document limit (max 10 documents per room)
    if (documents.length >= 10) {
      alert('Maximum 10 documents per room reached. Please delete some documents before adding new ones.');
      return;
    }
    
    // Generate appropriate default name based on type
    let defaultName: string;
    if (type === 'code') {
      if (languageId) {
        const language = languageGroups.flatMap(group => group.languages).find(lang => lang.id === languageId);
        if (language) {
          defaultName = `untitled.${language.extension}`;
        } else {
          defaultName = 'untitled.js';
        }
      } else {
        defaultName = 'untitled.js';
      }
    } else {
      defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
    
    // Try to create the document in the database first
    try {
      const response = await fetch(`/api/rooms/${roomId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: defaultName,
          type: type.toLowerCase(),
          content: "",
        }),
      });

      if (response.ok) {
        const createdDoc = await response.json();
        console.log(`Created document in database for room ${roomId}:`, createdDoc);
        
        // Convert to frontend format
        const newDoc: Document = {
          id: createdDoc.id,
          name: createdDoc.name,
          type: createdDoc.type.toLowerCase(),
          content: createdDoc.content || "",
        };

        const updatedDocs = [...documents, newDoc];
        setDocuments(updatedDocs);
        setActiveTab(newDoc.id);
        
        // Save to localStorage for offline use
        storeRoomDocumentsWrapper(roomId, updatedDocs);
        console.log(`Added new document from database and saved locally for room ${roomId}`);
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error?.includes('maximum 10 documents')) {
          alert('Maximum 10 documents per room reached. Please delete some documents before adding new ones.');
          return;
        }
        console.error(`Failed to create document in database, status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error creating document in database:`, error);
    }
    
    // Fallback: create document locally only
    const newDoc: Document = {
      id: `doc-${Math.random().toString(36).substring(2, 9)}`,
      name: defaultName,
      type: type.toLowerCase(),
      content: "",
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    setActiveTab(newDoc.id);
    
    // Save to localStorage
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    console.log(`Added new document locally and saved to localStorage for room ${roomId}`);
  }, [roomId, documents, storeRoomDocumentsWrapper]);

  const deleteDocument = useCallback(async (docId: string) => {
    // Find the document to get its name
    const doc = documents.find(d => d.id === docId)
    if (!doc) return
    
    // Set the document to delete and show confirmation dialog
    setDocumentToDelete({ id: docId, name: doc.name })
    setShowDeleteDocumentDialog(true)
  }, [documents])

  const confirmDeleteDocument = useCallback(async () => {
    if (!documentToDelete) return
    
    const docId = documentToDelete.id
    console.log(`🗑️ Deleting document ${docId} from room ${roomId}...`);
    console.log(`📊 Current documents:`, documents.map(d => ({ id: d.id, name: d.name })));
    
    // Ensure at least one document remains
    if (documents.length <= 1) {
      console.log(`❌ Cannot delete the last document in room ${roomId}`);
      setShowDeleteDocumentDialog(false)
      setDocumentToDelete(null)
      return;
    }
    
    // Try to delete from database first if it's a UUID
    if (isUuid(docId)) {
      try {
        console.log(`🗄️ Attempting to delete document ${docId} from database...`);
        const response = await fetch(`/api/rooms/${roomId}/documents/${docId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log(`✅ Successfully deleted document ${docId} from database for room ${roomId}`);
        } else {
          console.error(`❌ Failed to delete document ${docId} from database, status: ${response.status}`);
          const errorText = await response.text();
          console.error(`Error details:`, errorText);
        }
      } catch (error) {
        console.error(`💥 Error deleting document ${docId} from database:`, error);
        // Continue with local deletion
      }
    } else {
      console.log(`📝 Document ${docId} is not in database (not a UUID), skipping database deletion`);
    }
    
    // Remove from local state
    const newDocs = documents.filter((doc) => doc.id !== docId);
    console.log(`🔄 Updated documents list:`, newDocs.map(d => ({ id: d.id, name: d.name })));
    setDocuments(newDocs);
    
    // If the deleted document was active, switch to the first remaining document
    if (activeTab === docId) {
      console.log(`🔄 Active tab was deleted, switching to ${newDocs[0].id}`);
      setActiveTab(newDocs[0].id);
    }
    
    // Save updated documents to localStorage
    storeRoomDocumentsWrapper(roomId, newDocs);
    console.log(`💾 Deleted document ${docId} and updated localStorage for room ${roomId}`);
    
    // Send WebSocket message for real-time sync
    if (isConnected) {
      try {
        const message = {
          type: "DOCUMENT_DELETE",
          roomId,
          documentId: docId,
          timestamp: Date.now(),
          username: "You"
        };
        console.log(`📡 Sending WebSocket message:`, message);
        sendMessage(JSON.stringify(message));
        console.log(`🔄 Sent document deletion message for ${docId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to send document deletion message:`, error);
      }
    } else {
      console.warn(`⚠️ WebSocket not connected, skipping real-time sync`);
    }
    
    // Close the dialog
    setShowDeleteDocumentDialog(false)
    setDocumentToDelete(null)
  }, [roomId, documents, isUuid, activeTab, storeRoomDocumentsWrapper, isConnected, sendMessage, documentToDelete]);

  const startRenameDocument = useCallback((docId: string) => {
    const doc = documents.find((d) => d.id === docId)
    if (doc) {
      setEditingTabId(docId)
      setEditingTabName(doc.name)
    }
  }, [documents]);

  const saveRenameDocument = useCallback(async () => {
    if (!editingTabId || !editingTabName.trim()) {
      setEditingTabId(null);
      setEditingTabName("");
      return;
    }

    // Create updated documents array
    const updatedDocs = documents.map((doc) => 
      (doc.id === editingTabId ? { ...doc, name: editingTabName.trim() } : doc)
    );
    
    // Update state
    setDocuments(updatedDocs);
    
    // Save to localStorage
    storeRoomDocumentsWrapper(roomId, updatedDocs);
    console.log(`Renamed document and saved to localStorage for room ${roomId}`);

    // Save to database if document exists in database
    const isUuidResult = isUuid(editingTabId);
    if (isUuidResult) {
      try {
        const response = await fetch(`/api/rooms/${roomId}/documents/${editingTabId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingTabName.trim(),
            type: documents.find(d => d.id === editingTabId)?.type.toLowerCase(),
            content: documents.find(d => d.id === editingTabId)?.content || "",
          }),
        });

        if (response.ok) {
          console.log(`✅ Successfully saved document name to database`);
        } else {
          console.error(`❌ Failed to save document name to database, status: ${response.status}`);
        }
      } catch (error) {
        console.error(`💥 Error saving document name to database:`, error);
      }
    }

    // Send WebSocket message for real-time sync
    if (isConnected) {
      sendMessage(
        JSON.stringify({
          type: "DOCUMENT_RENAME",
          roomId,
          documentId: editingTabId,
          name: editingTabName.trim(),
        }),
      );
    }

    setEditingTabId(null);
    setEditingTabName("");
  }, [editingTabId, editingTabName, documents, roomId, storeRoomDocumentsWrapper, isConnected, sendMessage, isUuid]);

  const cancelRenameDocument = useCallback(() => {
    setEditingTabId(null)
    setEditingTabName("")
  }, []);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveRenameDocument()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelRenameDocument()
    }
  }, [saveRenameDocument, cancelRenameDocument]);

  const downloadDocument = useCallback(() => {
    const activeDoc = documents.find((doc) => doc.id === activeTab)
    if (!activeDoc) return

    const content = activeDoc.content
    let fileType = "text/plain"
    let fileName = activeDoc.name

    // Adjust based on document type
    if (activeDoc.type === "code") {
      // For code files, use the name as-is (it already includes the extension)
      // e.g., "untitled.js", "main.py", "index.html"
      fileName = activeDoc.name
    } else if (activeDoc.type === "word") {
      fileType = "text/html"
      // For word documents, add .html extension if not present
      if (!fileName.endsWith('.html')) {
        fileName = `${fileName}.html`
      }
    } else if (activeDoc.type === "spreadsheet" || activeDoc.type === "presentation") {
      fileType = "application/json"
      // For structured data, add .json extension if not present
      if (!fileName.endsWith('.json')) {
        fileName = `${fileName}.json`
      }
    }

    const blob = new Blob([content], { type: fileType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [documents, activeTab])

  const renderEditor = (document: Document) => {
    switch (document.type) {
      case "code":
        return (
          <CodeEditor 
            content={document.content} 
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
            documentName={document.name}
            showInlineDiff={showInlineDiff}
            diffData={diffData || undefined}
            onAcceptDiff={(newCode) => {
              // Apply the new code directly to the editor
              const updatedDoc = { ...document, content: newCode }
              const updatedDocs = documents.map(doc => 
                doc.id === document.id ? updatedDoc : doc
              )
              setDocuments(updatedDocs)
              storeRoomDocumentsWrapper(roomId, updatedDocs)
              
              // Send update to other users via WebSocket
              if (sendMessage) {
                const updateMessage = {
                  type: "DOCUMENT_UPDATE",
                  documentId: document.id,
                  content: newCode,
                  roomId: roomId,
                  timestamp: Date.now()
                };
                sendMessage(JSON.stringify(updateMessage));
              }
              
              // Close the diff view
              setShowInlineDiff(false)
              setDiffData(null)
            }}
            onRejectDiff={() => {
              setShowInlineDiff(false)
              setDiffData(null)
            }}
            onCloseDiff={() => {
              setShowInlineDiff(false)
              setDiffData(null)
            }}
            onUpdateEditorContent={(newContent) => {
              updateEditorContentForDiff(document.id, newContent)
            }}
          />
        )
      case "word":
        return (
          <WordEditor content={document.content} onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)} />
        )
      case "spreadsheet":
        return (
          <SpreadsheetEditor
            content={document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      case "presentation":
        return (
          <PresentationEditor
            content={document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      case "freeform":
        return (
          <FreeformEditor
            content={document.imageDataUrl || document.content}
            onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)}
          />
        )
      default:
        return (
          <CustomEditor content={document.content} onChange={(content) => handleContentChange(document.id, content, document.contentType, document.binaryContent)} />
        )
    }
  }

  // Custom tab trigger that supports renaming
  const CustomTabTrigger = ({ doc }: { doc: Document }) => {
    const isEditing = editingTabId === doc.id

    if (isEditing) {
      return (
        <div className="flex items-center h-10 px-2 gap-1 border-b-2 border-transparent">
          <Input
            ref={editInputRef}
            value={editingTabName}
            onChange={(e) => setEditingTabName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={saveRenameDocument}
            className="h-7 w-32 px-2 py-1 text-sm"
            autoFocus
          />
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveRenameDocument}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelRenameDocument}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <TabsTrigger value={doc.id} className="px-4 py-2 relative group">
        <span>{doc.name}</span>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation()
              startRenameDocument(doc.id)
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {documents.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive"
              onClick={async (e) => {
                e.stopPropagation()
                await deleteDocument(doc.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TabsTrigger>
    )
  }

  // Remove conflicting auto-save functionality - handled in handleContentChange now

  const saveDocument = async () => {
    if (!isBrowser) return;
    
    setIsSaving(true);
    console.log("Manual save triggered...");
    
    let allSaved = true;
    const savedDocuments: Document[] = [];

    try {
      // Save each document to the database
      for (const doc of documents) {
        try {
          // Check if this is a UUID (database document) or a local ID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.id);
          
          if (isUuid) {
            // Update existing document in database
            console.log(`Updating document ${doc.id} in database...`);
            
            // For images, convert data URL to binary and upload
            if (doc.imageDataUrl && doc.pendingImageUpload) {
              console.log(`🖼️ Converting image data URL to binary for ${doc.id}`);
              
              try {
                // Convert data URL to blob
                const response = await fetch(doc.imageDataUrl);
                const blob = await response.blob();
                
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', blob, 'canvas.png');
                
                const uploadResponse = await fetch(`/api/rooms/${roomId}/documents/${doc.id}/upload-image`, {
                  method: 'PUT',
                  body: formData,
                });
                
                if (uploadResponse.ok) {
                  const updatedDoc = await uploadResponse.json();
                  console.log(`Successfully uploaded image for document ${doc.id}`);
                  savedDocuments.push({
                    id: updatedDoc.id,
                    name: updatedDoc.name,
                    type: updatedDoc.type.toLowerCase(),
                    content: updatedDoc.content || doc.content,
                    imageDataUrl: doc.imageDataUrl,
                    pendingImageUpload: false,
                  });
                } else {
                  console.error(`Failed to upload image for document ${doc.id}, status: ${uploadResponse.status}`);
                  allSaved = false;
                  savedDocuments.push(doc); // Keep original document
                }
              } catch (error) {
                console.error(`Error uploading image for document ${doc.id}:`, error);
                allSaved = false;
                savedDocuments.push(doc); // Keep original document
              }
            } else {
              // Regular text content
              const response = await fetch(`/api/rooms/${roomId}/documents/${doc.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: doc.name,
                  type: doc.type.toLowerCase(),
                  content: doc.content,
                }),
              });

              if (response.ok) {
                const updatedDoc = await response.json();
                console.log(`Successfully updated document ${doc.id} in database`);
                savedDocuments.push({
                  id: updatedDoc.id,
                  name: updatedDoc.name,
                  type: updatedDoc.type.toLowerCase(),
                  content: updatedDoc.content || doc.content,
                });
              } else {
                console.error(`Failed to update document ${doc.id} in database, status: ${response.status}`);
                allSaved = false;
                savedDocuments.push(doc); // Keep original document
              }
            }
          } else {
            // Create new document in database
            console.log(`Creating new document ${doc.name} in database...`);
            
            // For images, create document first then upload image
            if (doc.imageDataUrl && doc.pendingImageUpload) {
              // Create document with empty content first
              const response = await fetch(`/api/rooms/${roomId}/documents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: doc.name,
                  type: doc.type.toLowerCase(),
                  content: "",
                }),
              });

              if (response.ok) {
                const createdDoc = await response.json();
                console.log(`Successfully created document ${doc.name} in database with ID ${createdDoc.id}`);
                
                // Now upload the image
                try {
                  const response = await fetch(doc.imageDataUrl);
                  const blob = await response.blob();
                  
                  const formData = new FormData();
                  formData.append('file', blob, 'canvas.png');
                  
                  const uploadResponse = await fetch(`/api/rooms/${roomId}/documents/${createdDoc.id}/upload-image`, {
                    method: 'PUT',
                    body: formData,
                  });
                  
                  if (uploadResponse.ok) {
                    const uploadedDoc = await uploadResponse.json();
                    console.log(`Successfully uploaded image for new document ${createdDoc.id}`);
                    savedDocuments.push({
                      id: uploadedDoc.id,
                      name: uploadedDoc.name,
                      type: uploadedDoc.type.toLowerCase(),
                      content: uploadedDoc.content || doc.content,
                      imageDataUrl: doc.imageDataUrl,
                      pendingImageUpload: false,
                    });
                  } else {
                    console.error(`Failed to upload image for new document ${createdDoc.id}, status: ${uploadResponse.status}`);
                    allSaved = false;
                    savedDocuments.push(doc); // Keep original document
                  }
                } catch (error) {
                  console.error(`Error uploading image for new document ${createdDoc.id}:`, error);
                  allSaved = false;
                  savedDocuments.push(doc); // Keep original document
                }
              } else {
                console.error(`Failed to create document ${doc.name} in database, status: ${response.status}`);
                allSaved = false;
                savedDocuments.push(doc); // Keep original document
              }
            } else {
              // Regular text content
              const response = await fetch(`/api/rooms/${roomId}/documents`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: doc.name,
                  type: doc.type.toLowerCase(),
                  content: doc.content,
                }),
              });

              if (response.ok) {
                const createdDoc = await response.json();
                console.log(`Successfully created document ${doc.name} in database with ID ${createdDoc.id}`);
                savedDocuments.push({
                  id: createdDoc.id,
                  name: createdDoc.name,
                  type: createdDoc.type.toLowerCase(),
                  content: createdDoc.content || doc.content,
                });
              } else {
                console.error(`Failed to create document ${doc.name} in database, status: ${response.status}`);
                allSaved = false;
                savedDocuments.push(doc); // Keep original document
              }
            }
          }
        } catch (error) {
          console.error(`Error saving document ${doc.id}:`, error);
          allSaved = false;
          savedDocuments.push(doc); // Keep original document
        }
      }

      // Update local state with saved documents (including new IDs from database)
      if (savedDocuments.length > 0) {
        setDocuments(savedDocuments);
        
        // Update active tab if it changed
        const currentActiveDoc = savedDocuments.find(doc => 
          doc.id === activeTab || (documents.find(d => d.id === activeTab)?.name === doc.name)
        );
        if (currentActiveDoc && currentActiveDoc.id !== activeTab) {
          setActiveTab(currentActiveDoc.id);
        }
      }

      // Also save to localStorage as backup
      storeRoomDocumentsWrapper(roomId, savedDocuments);
      
      // Verify documents were saved
      if (allSaved) {
        console.log("All documents successfully saved to database!");
      } else {
        console.warn("Some documents failed to save to database, but are stored locally");
      }

      // Provide visual feedback in the UI
      setIsSyncing(false);
      setLastSaved(new Date());
      console.log("Save operation completed.");
    } catch (error) {
      console.error("Error during document save:", error);
      allSaved = false;
      
      // Emergency backup save to localStorage
      try {
        storeRoomDocumentsWrapper(roomId, documents);
        if (isBrowser) {
          const docData = JSON.stringify(documents);
          localStorage.setItem(`emergency_room_${roomId}_documents_${Date.now()}`, docData);
          console.log("Emergency backup save completed");
        }
      } catch (e) {
        console.error("Even emergency save failed:", e);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up when leaving the room
  useEffect(() => {
    return () => {
      // Clear any pending auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Save documents one last time before unmounting
      storeRoomDocumentsWrapper(roomId, documents);
      console.log(`Final save of documents for room ${roomId} before unmounting`);
    };
  }, [roomId, documents, storeRoomDocumentsWrapper]);

  const clearDocumentData = useCallback(() => {
    if (!isBrowser) return;
    
    localStorage.removeItem(`room_${roomId}_documents`);
    createDefaultDocument();
  }, [roomId, createDefaultDocument]);

  // Remove activeTab sharing to reduce cross-tab conflicts

  // Debug function to test WebSocket connectivity
  const testWebSocketConnection = useCallback(() => {
    console.log(`🔍 WebSocket Debug Info:`);
    console.log(`- Connected: ${isConnected}`);
    console.log(`- Room ID: ${roomId}`);
    console.log(`- Documents count: ${documents.length}`);
    console.log(`- Active tab: ${activeTab}`);
    
    if (isConnected && sendMessage) {
      const testMessage = {
        type: "TEST",
        roomId: roomId,
        message: "Manual test message",
        timestamp: Date.now()
      };
      sendMessage(JSON.stringify(testMessage));
      console.log(`🧪 Sent manual test message`);
    } else {
      console.warn(`⚠️ WebSocket not connected or sendMessage not available`);
    }
  }, [isConnected, sendMessage, roomId, documents.length, activeTab]);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar?.(true)}
              className="w-8 h-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">{roomName || "Untitled Room"}</h1>
              <p className="text-sm text-muted-foreground">Room Key: {roomKey}</p>
            </div>
            <div className="flex items-center ml-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 cursor-help">
                      <Users className="h-3 w-3" />
                      <span>{connectedUsers.length} online</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Connected Users:</p>
                      <ul className="list-disc pl-4">
                        {connectedUsers.map((user, index) => (
                          <li key={index}>{user}</li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {isSyncing ? "Syncing..." : lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "All changes saved"}
            </div>
            {user?.subscriptionPlan === 'pro_ai' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 hover:opacity-90"
                onClick={() => setIsAIChatOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                AI Chat
              </Button>
            )}
            <Button size="sm" className="gap-1" onClick={downloadDocument}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button size="sm" className="gap-1" onClick={saveDocument} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={clearDocumentData}>
              <Trash2 className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center px-4 border-b">
            <TabsList className="h-10">
              {documents.map((doc) => (
                <CustomTabTrigger key={doc.id} doc={doc} />
              ))}
            </TabsList>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">
                {documents.length} docs
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={documents.length >= 10}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="px-2 py-1.5">Add New Document</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {editorTypes.map((type) => {
                  if (type.id === "code" && type.status === 'available') {
                    return (
                      <DropdownMenu key={type.id}>
                        <DropdownMenuTrigger asChild>
                          <DropdownMenuItem 
                            className="cursor-pointer relative px-2 py-1.5"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <type.icon className="mr-2 h-4 w-4" />
                            <span>{type.name}</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </DropdownMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" className="w-56 max-h-96 overflow-y-auto">
                          <DropdownMenuLabel className="px-2 py-1.5">Select Language</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {languageGroups.map((group) => (
                            <div key={group.name}>
                              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                                {group.name}
                              </DropdownMenuLabel>
                              {group.languages.map((language) => (
                                <DropdownMenuItem
                                  key={language.id}
                                  onClick={async () => {
                                    await addNewDocument(type.id, language.id);
                                  }}
                                  className="cursor-pointer px-2 py-1.5"
                                >
                                  <span>{language.name}</span>
                                </DropdownMenuItem>
                              ))}
                              {group.name !== languageGroups[languageGroups.length - 1].name && (
                                <DropdownMenuSeparator />
                              )}
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  
                  return (
                    <TooltipProvider key={type.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem 
                            onClick={async () => {
                              if (type.status === 'available') {
                                await addNewDocument(type.id);
                              } else if (type.status === 'pro') {
                                // Check if user has Pro access
                                const hasProAccess = user?.subscriptionPlan === 'pro' || user?.subscriptionPlan === 'pro_ai';
                                if (hasProAccess) {
                                  await addNewDocument(type.id);
                                } else {
                                  alert('This feature requires a Pro subscription. Please upgrade to access Freeform Text editor.');
                                }
                              } else if (type.status === 'coming-soon') {
                                // Handle coming soon
                                alert('This editor type is coming soon! Stay tuned for updates.');
                              }
                            }}
                            className={`cursor-pointer relative px-2 py-1.5 ${
                              type.status !== 'available' ? 'opacity-60' : ''
                            }`}
                          >
                            <type.icon className="mr-2 h-4 w-4" />
                            <span>{type.name}</span>
                            {type.badge && (
                              <div className="ml-auto pl-2">
                                <type.badge className={`h-3 w-3 ${
                                  type.status === 'pro' ? 'text-blue-500' : 'text-muted-foreground'
                                }`} />
                              </div>
                            )}
                          </DropdownMenuItem>
                        </TooltipTrigger>
                        {type.tooltipText && (
                          <TooltipContent side="left">
                            <p>{type.tooltipText}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {documents.map((doc) => (
            <TabsContent key={doc.id} value={doc.id} className="flex-1 overflow-auto h-[calc(100vh-8.5rem)]">
              {renderEditor(doc)}
            </TabsContent>
          ))}
        </Tabs>
      </header>

      {/* Document Deletion Confirmation Dialog */}
      <AlertDialog open={showDeleteDocumentDialog} onOpenChange={setShowDeleteDocumentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        documents={documents}
        currentDocument={documents.find(doc => doc.id === activeTab)}
        roomId={roomId}
        onApplySuggestion={(suggestion, targetDocument) => {
          // Apply the AI suggestion to the specified document or current document
          const docToUpdate = targetDocument || documents.find(doc => doc.id === activeTab)
          if (docToUpdate) {
            const updatedDoc = { ...docToUpdate, content: suggestion }
            const updatedDocs = documents.map(doc => 
              doc.id === docToUpdate.id ? updatedDoc : doc
            )
            setDocuments(updatedDocs)
            storeRoomDocumentsWrapper(roomId, updatedDocs)
            
            // Switch to the updated document if it's not the current one
            if (targetDocument && targetDocument.id !== activeTab) {
              setActiveTab(targetDocument.id)
            }
            
            // Send update to other users via WebSocket
            if (sendMessage) {
              const updateMessage = {
                type: "DOCUMENT_UPDATE",
                documentId: docToUpdate.id,
                content: suggestion,
                roomId: roomId,
                timestamp: Date.now()
              };
              sendMessage(JSON.stringify(updateMessage));
            }
          }
        }}
        onShowInlineDiff={(originalCode, suggestedCode, targetDocument) => {
          console.log('onShowInlineDiff called:', { originalCode: originalCode.substring(0, 50), suggestedCode: suggestedCode.substring(0, 50), targetDocument: targetDocument?.name })
          
          // Check if this is a close request (empty strings)
          if (!originalCode && !suggestedCode) {
            console.log('Closing inline diff')
            setShowInlineDiff(false)
            setDiffData(null)
            return
          }
          
          // Set the diff data first
          setDiffData({ originalCode, suggestedCode })
          console.log('Diff data set')
          
          // Switch to the target document if it's different from the current one
          if (targetDocument && targetDocument.id !== activeTab) {
            console.log('Switching to target document:', targetDocument.name)
            setActiveTab(targetDocument.id)
            // Show diff after a brief delay to ensure tab switch completes
            setTimeout(() => {
              console.log('Setting showInlineDiff to true after tab switch')
              setShowInlineDiff(true)
            }, 50)
          } else {
            // If we're already on the target document, show diff immediately
            console.log('Already on target document, showing diff immediately')
            setShowInlineDiff(true)
          }
        }}
      />
    </div>
  )
}
