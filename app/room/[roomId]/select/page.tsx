"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { EditorSelection } from '@/components/editor-selection';
import { storeRoomState, storeRoomDocuments, getRoomState, getRoomDocuments } from '@/lib/dev-storage';
import { useAuth } from '@/contexts/AuthContext';

interface EditorSelectionPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function EditorSelectionPage({ params }: EditorSelectionPageProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSelection, setShowSelection] = useState(false);
  const [error, setError] = useState('');
  
  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
    };
    resolveParams();
  }, [params]);
  
  // Check for existing room state and documents when the room ID is available
  useEffect(() => {
    if (!roomId) return;
    
    const checkRoomState = async () => {
      try {
        setIsLoading(true);
        console.log(`Select page: Checking for documents in room ${roomId}...`);
        
        let documents = [];
        
        // 1. First, try to fetch documents from the database
        try {
          console.log(`Select page: Fetching documents from database for room ${roomId}...`);
          const docsResponse = await fetch(`/api/rooms/${roomId}/documents`);
          if (docsResponse.ok) {
            const dbDocuments = await docsResponse.json();
            console.log(`Select page: Found ${dbDocuments.length} documents in database for room ${roomId}`);
            
            if (dbDocuments.length > 0) {
              // Check if there are freeform documents and user is not Pro
              const hasFreeformDocuments = dbDocuments.some((doc: any) => doc.type === 'freeform');
              
              if (hasFreeformDocuments && isAuthenticated) {
                // Check user subscription level
                if (!user || (user.subscriptionPlan !== 'pro' && user.subscriptionPlan !== 'pro_ai')) {
                  setError('This room contains Freeform Canvas documents which require a Pro subscription. Please upgrade to access this room.');
                  setIsLoading(false);
                  return;
                }
              } else if (hasFreeformDocuments && !isAuthenticated) {
                setError('This room contains Freeform Canvas documents which require a Pro subscription. Please sign in with a Pro account to access this room.');
                setIsLoading(false);
                return;
              }
              
              documents = dbDocuments;
              // Store documents locally for offline use
              storeRoomDocuments(roomId, documents);
              console.log(`Select page: Stored ${documents.length} documents locally for room ${roomId}`);
            }
          } else {
            console.log(`Select page: No documents found in database for room ${roomId}, status: ${docsResponse.status}`);
          }
        } catch (dbError) {
          console.error('Select page: Error fetching documents from database:', dbError);
        }
        
        // 2. If no documents found in database, check localStorage
        if (documents.length === 0) {
          // Direct localStorage check
          const directKey = `direct_room_${roomId}_documents`;
          const directData = localStorage.getItem(directKey);
          
          if (directData) {
            try {
              const parsed = JSON.parse(directData);
              if (parsed && parsed.length > 0) {
                // Check if there are freeform documents and user is not Pro
                const hasFreeformDocuments = parsed.some((doc: any) => doc.type === 'freeform');
                
                if (hasFreeformDocuments && isAuthenticated) {
                  // Check user subscription level
                  if (!user || (user.subscriptionPlan !== 'pro' && user.subscriptionPlan !== 'pro_ai')) {
                    setError('This room contains Freeform Canvas documents which require a Pro subscription. Please upgrade to access this room.');
                    setIsLoading(false);
                    return;
                  }
                } else if (hasFreeformDocuments && !isAuthenticated) {
                  setError('This room contains Freeform Canvas documents which require a Pro subscription. Please sign in with a Pro account to access this room.');
                  setIsLoading(false);
                  return;
                }
                
                documents = parsed;
                console.log(`Select page: Found ${documents.length} documents in direct localStorage.`);
              }
            } catch (e) {
              console.error('Error parsing documents from direct localStorage:', e);
            }
          }
          
          // 3. If still no documents, use the robust function
          if (documents.length === 0) {
            const localDocs = getRoomDocuments(roomId);
            console.log(`Select page: Found ${localDocs.length} documents using getRoomDocuments.`);
            
            if (localDocs.length > 0) {
              // Check if there are freeform documents and user is not Pro
              const hasFreeformDocuments = localDocs.some((doc: any) => doc.type === 'freeform');
              
              if (hasFreeformDocuments && isAuthenticated) {
                // Check user subscription level
                if (!user || (user.subscriptionPlan !== 'pro' && user.subscriptionPlan !== 'pro_ai')) {
                  setError('This room contains Freeform Canvas documents which require a Pro subscription. Please upgrade to access this room.');
                  setIsLoading(false);
                  return;
                }
              } else if (hasFreeformDocuments && !isAuthenticated) {
                setError('This room contains Freeform Canvas documents which require a Pro subscription. Please sign in with a Pro account to access this room.');
                setIsLoading(false);
                return;
              }
              
              documents = localDocs;
            }
          }
        }
        
        if (documents.length > 0) {
          const editorType = documents[0].type;
          console.log(`Select page: Found documents. Redirecting to editor: ${editorType}`);
          
          // Ensure the room state is updated with this editor type
          storeRoomState(roomId, { 
            ...getRoomState(roomId),
            lastEditorType: editorType,
            hasDocuments: true,
            documentCount: documents.length,
            lastUpdated: new Date().toISOString(),
          });
          
          router.push(`/room/${roomId}/editor/${editorType}`);
          return;
        }
        
        // 3. Check room state for last editor type
        const roomState = getRoomState(roomId);
        if (roomState && roomState.lastEditorType) {
          console.log(`Select page: No documents, but found last editor type: ${roomState.lastEditorType}`);
          
          // If we have a last editor type, redirect to that editor
          router.push(`/room/${roomId}/editor/${roomState.lastEditorType}`);
          return;
        }

        // If no documents or last editor type are found, show the selection screen
        console.log(`Select page: No documents or last editor type found for room ${roomId}. Showing selection.`);
        setShowSelection(true);

      } catch (error) {
        console.error('Error checking room state on select page:', error);
        setShowSelection(true); // Show selection on error
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRoomState();
  }, [roomId, router]);
  
  // Handler for when an editor is selected
  const handleEditorSelected = (editorType: string) => {
    console.log(`Editor selected: ${editorType} for room ${roomId}`);
    
    // Store the selected editor type in room state
    storeRoomState(roomId, { 
      lastEditorType: editorType,
      lastAccessed: new Date().toISOString()
    });
    
    // Navigate to the editor
    router.push(`/room/${roomId}/editor/${editorType}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-3"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!showSelection) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Redirecting to editor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <AppSidebar defaultOpen={false} />
      <div className="flex-1">
        <EditorSelection roomId={roomId} onEditorSelected={handleEditorSelected} />
      </div>
    </div>
  );
}

