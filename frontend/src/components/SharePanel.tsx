// frontend/src/components/SharePanel.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './SharePanel.css';

const SharePanel = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [otp, setOtp] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [burnAfterDownload, setBurnAfterDownload] = useState(false); // --- NEW: State for the checkbox

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleUpload = async () => {
        if (files.length === 0) return;
        
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('burnAfterDownload', String(burnAfterDownload)); // --- NEW: Send the option to the backend

        try {
            const response = await axios.post('http://localhost:3001/api/upload', formData);
            setOtp(response.data.otp);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files.');
        }
    };

    const handleDownload = async () => {
        // ... (download logic is unchanged)
    };

    const handleReset = () => {
        setFiles([]);
        setOtp(null);
        setBurnAfterDownload(false); // --- NEW: Reset the checkbox state
    };

    if (otp) {
        // ... (OTP display is unchanged)
    }

    return (
        <div className="share-panel">
            <div className="panel-header">
                <h2>Share Files Securely</h2>
                <p>Files are end-to-end encrypted and auto-expire.</p>
            </div>

            <div {...getRootProps({ className: 'upload-box' })}>
                <input {...getInputProps()} />
                {isDragActive ? <p>Drop the files here ...</p> : <p>Drag & drop files here, or click to select</p>}
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    {/* ... (file list is unchanged) ... */}
                </div>
            )}
            
            {/* --- NEW: Checkbox for "Burn After Download" --- */}
            <div className="options-section">
                <input
                    type="checkbox"
                    id="burn"
                    checked={burnAfterDownload}
                    onChange={(e) => setBurnAfterDownload(e.target.checked)}
                />
                <label htmlFor="burn">Delete files after first download</label>
            </div>
            
            <button className="upload-btn" onClick={handleUpload}>
                Upload & Get OTP
            </button>
            
            <div className="download-section">
                 {/* ... (download form is unchanged) ... */}
            </div>
        </div>
    );
};

export default SharePanel;
