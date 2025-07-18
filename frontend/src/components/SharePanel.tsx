// frontend/src/components/SharePanel.tsx

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './SharePanel.css';

const SharePanel = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [otp, setOtp] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState(''); // State for the download OTP input

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleUpload = async () => {
        if (files.length === 0) return;
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await axios.post('http://localhost:3001/api/upload', formData);
            setOtp(response.data.otp);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files.');
        }
    };

    // --- NEW: Function to handle the download ---
    const handleDownload = async () => {
        if (!otpInput || otpInput.length !== 6) {
            alert('Please enter a valid 6-digit OTP.');
            return;
        }
        try {
            // Request the file from the backend, expecting a binary file (blob)
            const response = await axios.post(
                'http://localhost:3001/api/download',
                { otp: otpInput },
                { responseType: 'blob' } // This is crucial for file downloads
            );

            // Create a temporary URL from the downloaded file data
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'DashDrop-files.zip'); // The filename for the download
            document.body.appendChild(link);
            
            // Trigger the download
            link.click();

            // Clean up by removing the temporary link
            link.parentNode?.removeChild(link);

        } catch (error) {
            console.error('Error downloading files:', error);
            alert('Download failed. The OTP might be invalid or expired.');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setOtp(null);
    };

    // If we have an OTP, show the display view.
    if (otp) {
        return (
            <div className="share-panel">
                <div className="panel-header">
                    <h2>Your OTP is Ready!</h2>
                    <p>Share this OTP and the website link with the recipient.</p>
                </div>
                <div className="otp-display">{otp}</div>
                <button className="upload-btn" onClick={() => navigator.clipboard.writeText(otp)}>
                    Copy OTP
                </button>
                <button className="reset-btn" onClick={handleReset}>
                    Share Another File
                </button>
            </div>
        );
    }

    // Otherwise, show the main upload/download view.
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
                    <h4>Selected Files:</h4>
                    <ul>
                        {files.map((file, i) => (
                            <li key={i}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
                        ))}
                    </ul>
                </div>
            )}
            <button className="upload-btn" onClick={handleUpload}>
                Upload & Get OTP
            </button>
            <div className="download-section">
                <p>Have an OTP?</p>
                <div className="otp-input-group">
                    {/* Connect the input field to state */}
                    <input
                        type="text"
                        placeholder="Enter OTP to Download"
                        className="otp-input"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                    />
                    {/* Connect the button to the download handler */}
                    <button className="download-btn" onClick={handleDownload}>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePanel;