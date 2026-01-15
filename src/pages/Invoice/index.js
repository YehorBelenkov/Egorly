import React, { useEffect } from 'react';
import EmailSender from '../../app/components/EmailSender';
import Head from 'next/head';

const Invoice = () => {
  useEffect(() => {
    // This code will run when the component mounts
    sendInvoiceEmail();
  }, []);

  const sendInvoiceEmail = async () => {
    try {
      // Your logic to fetch invoice details and set recipient email
      const invoiceDetails = await getInvoiceDetails(); // Use await if getInvoiceDetails is asynchronous
      const recipientEmail = 'yehorbelenkov@gmail.com'; // Replace with the recipient's email
  
      // Send the email using the API route
      console.log('Sending email...');
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'yehorbelenkov@gmail.com', // Replace with the recipient's email
          subject: 'Invoice Notification',
          text: `Dear Customer, here is your invoice details: ${invoiceDetails}`,
          recipientEmail,
        }),
      });
  
      if (response.ok) {
        console.log('Invoice email sent successfully!');
      } else {
        console.error('Error sending invoice email:', await response.text());
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
    }
  };

  const getInvoiceDetails = async () => {
    // Replace this with your logic to fetch and format invoice details
    return 'Invoice details here';
  };

  return (
    <>
      <Head>
        {/* Head content */}
      </Head>
      <div>
        <h1>Invoice Page</h1>
        <p>This is where you display your invoice details.</p>
        {/* <EmailSender /> */}
      </div>
    </>
  );
};

export default Invoice;