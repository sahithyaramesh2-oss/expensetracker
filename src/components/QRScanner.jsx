import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Success callback
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Error callback (scanning in progress)
                // console.log(errorMessage); 
            }
        );

        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="scanner-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="scanner-card" style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <h3 style={{ color: '#333', marginBottom: '1rem' }}>Scan UPI QR</h3>
                <div id="reader" style={{ width: '100%' }}></div>
                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{ marginTop: '1rem', background: '#ff4b4b' }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default QRScanner;
