import React, { useState } from 'react';
import axios from 'axios';
import { CButton, CModal, CModalHeader, CModalBody, CModalFooter, CFormTextarea } from '@coreui/react';

const SendMessageModal = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return alert('Please enter a message');
    setLoading(true);
    try {
      await axios.post('/api/customers/send-message', { message });
      alert('✅ Message sent successfully!');
      setVisible(false);
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CButton color="primary" onClick={() => setVisible(true)}>
        Send Message
      </CButton>

      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>Send Message to All Customers</CModalHeader>
        <CModalBody>
          <CFormTextarea
            rows={5}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="success" onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default SendMessageModal;
