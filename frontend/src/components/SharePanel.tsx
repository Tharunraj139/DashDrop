// frontend/src/components/SharePanel.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './SharePanel.css';

const SharePanel = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [otp, setOtp] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [burnAfterDownload, setBurnAfterDownload] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // --- NEW: Track uploading state
    const [uploadProgress, setUploadProgress] = useState(0); // --- NEW: Track progress percentage

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleUpload = async () => {
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('burnAfterDownload', String(burnAfterDownload));

        setIsUploading(true); // --- NEW: Set uploading to true
        setUploadProgress(0); // --- NEW: Reset progress

        try {
            const response = await axios.post('http://localhost:3001/api/upload', formData, {
                // --- NEW: Axios progress event handler ---
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    setUploadProgress(percentCompleted);
                },
            });
            setOtp(response.data.otp);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files.');
        } finally {
            setIsUploading(false); // --- NEW: Set uploading to false when done
        }
    };

    const handleDownload = async () => { /* ... download logic is unchanged ... */ };
    const handleReset = () => { /* ... reset logic is unchanged ... */ };

    if (otp) { /* ... OTP display is unchanged ... */ }

    return (
        <div className="share-panel">
            <div className="panel-header">
                <h2>Share Files Securely</h2>
                <p>Files are end-to-end encrypted and auto-expire.</p>
            </div>
            <div {...getRootProps({ className: 'upload-box' })}>
                <input {...getInputProps()} disabled={isUploading} />
                {isDragActive ? <p>Drop the files here ...</p> : <p>Drag & drop files here, or click to select</p>}
            </div>
            {files.length > 0 && (
                 <div className="file-list">{/* ... file list is unchanged ... */}</div>
            )}
            <div className="options-section">{/* ... burn option is unchanged ... */}</div>

            {/* --- NEW: Conditionally render progress bar --- */}
            {isUploading && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                    </div>
                </div>
            )}

            <button className="upload-btn" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload & Get OTP'}
            </button>

            <div className="download-section">{/* ... download form is unchanged ... */}</div>
        </div>
    );
};

export default SharePanel;
