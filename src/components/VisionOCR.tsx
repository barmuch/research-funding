'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Modal from './Modal';

// Define types for the component
interface ExtractedItem {
  item: string;
  price: string;
  planType?: string; // Add planType to extracted items
}

interface VisionOCRProps {
  onExtractedItems?: (items: ExtractedItem[]) => void;
  onSuccessAddItem?: () => void;
  workspaceId?: string;
  planTypes?: string[]; // Available plan types from the workspace
}

export default function VisionOCR({ onExtractedItems, onSuccessAddItem, workspaceId }: VisionOCRProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addingItems, setAddingItems] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));
    await processImage(file);
  };

  const processImage = async (file: File | Blob) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64Image = result.split(',')[1];
        try {
          const response = await fetch('/api/vision-ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64: base64Image }),
          });

          const data = await response.json();
          
          if (data.success) {
            setExtracted(data.items || []);
            if (onExtractedItems) onExtractedItems(data.items || []);
          } else {
            console.error('OCR processing failed:', data.message);
            setExtracted([]);
            if (onExtractedItems) onExtractedItems([]);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          setExtracted([]);
          if (onExtractedItems) onExtractedItems([]);
        }
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setIsModalOpen(true);
      
      // Wait for modal to open and video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      // You can add toast notification here if needed
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const capturedImageUrl = URL.createObjectURL(blob);
            setCapturedImage(capturedImageUrl);
            setSelectedImage(capturedImageUrl);
            
            // Stop camera stream
            if (stream) {
              stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              setStream(null);
            }
            setIsModalOpen(false);
            
            // Process the captured image
            await processImage(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);
    }
    setIsModalOpen(false);
  };

  const handleAdd = async (item: ExtractedItem, index: number) => {
    try {
      setAddingItems(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Use current workspace ID or fallback
      const currentWorkspaceId = workspaceId || 
        (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : null);
      
      if (!currentWorkspaceId) {
        console.error('Workspace ID not found');
        return;
      }

      const today = new Date().toISOString();

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          planType: 'other', // Default to 'other' category for OCR items
          amount: parseFloat(item.price),
          note: `Scanned from receipt: ${item.item}`,
          date: today,
        }),
      });

      if (res.ok) {
        const updated = [...extracted];
        updated.splice(index, 1);
        setExtracted(updated);
        if (onExtractedItems) onExtractedItems(updated);
        if (onSuccessAddItem) onSuccessAddItem();
        
        console.log('Item berhasil ditambahkan ke database.');
      } else {
        const err = await res.json();
        console.error('Gagal menambahkan item:', err.message);
      }
    } catch (err) {
      console.error('Error saat menambahkan:', err);
    } finally {
      setAddingItems(false);
    }
  };

  const handleDelete = (index: number) => {
    const updated = [...extracted];
    updated.splice(index, 1);
    setExtracted(updated);
    if (onExtractedItems) onExtractedItems(updated);
  };

  return (
    <>
      {/* Mobile-Optimized OCR Component */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium text-gray-900">📷 Scan Receipt</h3>
          {extracted.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
              {extracted.length} items found
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Upload Options - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startCamera}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              <span>📷</span>
              <span>Camera</span>
            </button>
            <div>
              <label className="block">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={loading}
                  className="hidden"
                />
                <div className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors text-center border-2 border-dashed border-gray-300 hover:border-gray-400">
                  📁 Upload
                </div>
              </label>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center space-x-2 py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-xs sm:text-sm text-blue-600">Processing image...</span>
            </div>
          )}

          {/* Selected Image Preview */}
          {selectedImage && !loading && (
            <div className="text-center">
              <img
                src={selectedImage}
                alt="Receipt"
                className="max-h-32 max-w-full object-contain mx-auto rounded border"
              />
            </div>
          )}

          {/* Extracted Items */}
          {extracted.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Detected Items
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {extracted.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white p-2 rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.item}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rp {Number(item.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleAdd(item, index)}
                        disabled={addingItems}
                        className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        title="Add to expenses"
                      >
                        {addingItems ? '...' : '✓'}
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        disabled={addingItems}
                        className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {extracted.length > 0 && (
                <button
                  onClick={async () => {
                    setAddingItems(true);
                    // Add all items at once
                    const itemsToAdd = [...extracted]; // Copy current items
                    for (let i = 0; i < itemsToAdd.length; i++) {
                      await handleAdd(itemsToAdd[i], 0); // Always use index 0 since items get removed
                      // Small delay to prevent overwhelming the API
                      if (i < itemsToAdd.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                      }
                    }
                    setAddingItems(false);
                  }}
                  className="w-full mt-2 bg-green-600 text-white px-3 py-2 text-xs rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={extracted.length === 0 || addingItems}
                >
                  {addingItems ? 'Adding...' : `Add All Items (${extracted.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      <Modal isOpen={isModalOpen} onClose={stopCamera} title="Capture Receipt" maxWidth="xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={capturePhoto}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>📸</span>
              <span>Capture</span>
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
