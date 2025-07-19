import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './SharePanel.css';

const SharePanel = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [otp, setOtp] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [burnAfterDownload, setBurnAfterDownload] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleUpload = async () => {
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('burnAfterDownload', String(burnAfterDownload));

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await axios.post('/api/upload', formData, {
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
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!otpInput || otpInput.length !== 6) {
            alert('Please enter a valid 6-digit OTP.');
            return;
        }
        try {
            const response = await axios.post('/api/download', { otp: otpInput }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'DashDrop-files.zip');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Error downloading files:', error);
            alert('Download failed. The OTP might be invalid or expired.');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setOtp(null);
        setBurnAfterDownload(false);
    };

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
                <div className="file-list">
                    <h4>Selected Files:</h4>
                    <ul>
                        {files.map((file, i) => (
                            <li key={i}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="options-section">
                <input
                    type="checkbox"
                    id="burn"
                    checked={burnAfterDownload}
                    onChange={(e) => setBurnAfterDownload(e.target.checked)}
                />
                <label htmlFor="burn">Delete files after first download</label>
            </div>
            {isUploading && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                    </div>
                </div>
            )}
            <button className="upload-btn" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload & Get OTP'}
            </button>
            <div className="download-section">
                <p>Have an OTP?</p>
                <div className="otp-input-group">
                    <input
                        type="text"
                        placeholder="Enter OTP to Download"
                        className="otp-input"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                    />
                    <button className="download-btn" onClick={handleDownload}>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePanel;
