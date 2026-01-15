import React from 'react';
import emailjs from 'emailjs-com';

const EmailSender = ({ to, subject, text, recipientEmail }) => {
  const sendEmail = async () => {
    try {
      const serviceId = 'service_4f0zixq'; // Replace with your service ID
      const templateId = 'template_xpqj4rr'; // Replace with your template ID
      const publicKey = 'fzY7hh0IAt7qT95_K'; // Replace with your public key

      const templateParams = {
        to_email: recipientEmail, // Use recipientEmail instead of 'to'
        subject,
        body: text,
        to_name: 'Jacob',
        
      };

      console.log('Sending email...');

      // Send the email
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);

      console.log('Email sent successfully!', result);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <div>
      <h1>Email Sender</h1>
      <button onClick={sendEmail}>Send Test Email</button>
    </div>
  );
};

export default EmailSender;