'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ScanResult {
  items: ScannedItem[];
  total: number | null;
  date: string | null;
  supplier: string | null;
}

interface ReceiptScannerProps {
  onScanComplete: (result: ScanResult) => void;
  disabled?: boolean;
}

export function ReceiptScanner({ onScanComplete, disabled }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      await scanReceipt(base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const scanReceipt = async (imageData: string) => {
    setScanning(true);

    try {
      const response = await fetch('/api/receipt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan receipt');
      }

      const result: ScanResult = await response.json();

      if (result.items.length === 0) {
        toast.error('Could not read receipt. Try a clearer photo.');
        return;
      }

      toast.success(`Found ${result.items.length} items`);
      onScanComplete(result);
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || scanning}
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Receipt"
            className="w-full max-h-48 object-contain rounded-lg border"
          />
          {scanning && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Scanning receipt...</span>
              </div>
            </div>
          )}
          {!scanning && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
              onClick={clearPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-20 border-dashed border-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || scanning}
        >
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-6 w-6" />
            <span className="text-sm">Scan Receipt</span>
          </div>
        </Button>
      )}
    </div>
  );
}
