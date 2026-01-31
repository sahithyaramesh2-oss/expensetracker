import React from 'react';

const PaymentModal = ({ data, onPay, onRecordOnly, onCancel }) => {
    if (!data) return null;

    const { title, amount, upiString } = data;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="modal-content" style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '350px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>Payment Detected</h3>
                <div style={{ margin: '1rem 0', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Paying to:</p>
                    <h4 style={{ margin: '0.2rem 0', color: '#000' }}>{title}</h4>
                    <h2 style={{ margin: '0.5rem 0', color: '#2962ff' }}>₹{amount}</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <button
                        onClick={onPay}
                        className="btn-primary"
                        style={{ background: '#2962ff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <span>🚀</span> Pay Now & Save
                    </button>

                    <button
                        onClick={onRecordOnly}
                        className="btn-secondary"
                        style={{ border: '1px solid #ddd', background: 'white', color: '#333', width: '100%' }}
                    >
                        Record Only (Already Paid)
                    </button>

                    <button
                        onClick={onCancel}
                        className="btn-text"
                        style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
