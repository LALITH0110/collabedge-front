'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { EditorContainer } from '@/components/editor-container';
import { storeRoomState, getRoomState, getRoomDocuments } from '@/lib/dev-storage';

interface EditorPageProps {
  params: Promise<{
    roomId: string;
    editorType: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [editorType, setEditorType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
      setEditorType(resolvedParams.editorType);
      setIsLoading(false);
    };
    resolveParams();
  }, [params]);
  
  // Store the current editor type in room state when the page loads
  useEffect(() => {
    if (!roomId || !editorType) return;
    
    console.log(`EditorPage: Loading editor for room ${roomId} with type ${editorType}`);
    
    // Check if we have documents for this room
    const documents = getRoomDocuments(roomId);
    console.log(`EditorPage: Found ${documents.length} documents for room ${roomId}`);
    
    // Get any existing room state
    const roomState = getRoomState(roomId);
    console.log(`EditorPage: Room state for ${roomId}:`, roomState);
    
    // Always update the room state with the current editor type
    // This ensures we remember which editor the user was using
    storeRoomState(roomId, { 
      lastEditorType: editorType,
      lastAccessed: new Date().toISOString(),
      documentCount: documents.length || 0,
      hasDocuments: documents.length > 0
    });
    console.log(`EditorPage: Updated room state for ${roomId} with editor type ${editorType}`);
    
    // Force a save of any existing documents if we have them
    if (documents.length > 0) {
      // This ensures the documents are properly stored in multiple locations
      const directKey = `direct_room_${roomId}_documents`;
      localStorage.setItem(directKey, JSON.stringify(documents));
      
      // Also store in a timestamped backup
      const backupKey = `backup_room_${roomId}_documents_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(documents));
      
      console.log(`EditorPage: Forced save of ${documents.length} documents for room ${roomId}`);
    }
    
    // Set up an interval to periodically save the room state
    const saveInterval = setInterval(() => {
      const currentDocs = getRoomDocuments(roomId);
      storeRoomState(roomId, { 
        lastEditorType: editorType,
        lastAccessed: new Date().toISOString(),
        documentCount: currentDocs.length || 0,
        hasDocuments: currentDocs.length > 0
      });
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(saveInterval);
    };
  }, [roomId, editorType]);
  
  if (isLoading || !roomId || !editorType) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <AppSidebar defaultOpen={false} />
      <div className="flex-1">
        <EditorContainer roomId={roomId} editorType={editorType} />
      </div>
    </div>
  );
}
