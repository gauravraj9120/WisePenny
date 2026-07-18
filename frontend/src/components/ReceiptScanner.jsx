import React, { useState, useRef } from 'react';

export default function ReceiptScanner({ onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processReceipt(file);
  };

  const processReceipt = async (file) => {
    setScanning(true);
    setError(null);
    setStatusText('Uploading receipt image...');

    const formData = new FormData();
    formData.append('receipt', file);

    // Simulate progress changes for better UX feedback
    const statusInterval = setInterval(() => {
      setStatusText(prev => {
        if (prev === 'Uploading receipt image...') return 'Running OCR engine (Tesseract.js)...';
        if (prev === 'Running OCR engine (Tesseract.js)...') return 'Extracting text structure...';
        if (prev === 'Extracting text structure...') return 'Running AI Categorization...';
        return prev;
      });
    }, 2000);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      });

      clearInterval(statusInterval);

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server error occurred during scan.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatusText('Done!');
        onScanComplete(result.data);
      } else {
        throw new Error('Failed to parse scan data.');
      }
    } catch (err) {
      clearInterval(statusInterval);
      console.error(err);
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const triggerUpload = () => {
    if (!scanning) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '16px' }}>Receipt Scanner</h3>
      
      <div className="scanner-zone" onClick={triggerUpload}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
          disabled={scanning}
        />
        
        <div className="scanner-icon">📸</div>
        <p style={{ fontWeight: '500', marginBottom: '4px' }}>
          {scanning ? 'Processing receipt...' : 'Upload or Drag Receipt Image'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Supports PNG, JPG, JPEG
        </p>

        {scanning && (
          <div className="scanning-overlay">
            <div className="scanning-bar"></div>
            <p style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '14px' }}>
              {statusText}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '13px'
        }}>
          <strong>Scanner Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
