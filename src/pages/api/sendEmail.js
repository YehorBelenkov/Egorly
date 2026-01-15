import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, text, recipientEmail } = req.body;

    try {
      // Create a transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'barigasnacks@gmail.com',
          pass: 'wxgjdlslkvcdutzc',  // Use the generated App Password here
        },
      });

      // Define email options
      const mailOptions = {
        from: 'barigasnacks@gmail.com',
        to: recipientEmail,
        subject,
        text,
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent: ', info.messageId);

      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}