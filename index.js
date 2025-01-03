const express = require('express');
const app = express();
const PORT = 5050;
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

// In-memory logs
const logs = [];
app.use(cors());

// SMTP transporter setup using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_AUTH_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASSWORD,
  },
});

// Middleware for header validation
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== '5f3b6c7a8d2e9f1c4b6d8e9f') {
    logs.push(`[${new Date().toISOString()}] Unauthorized access attempt`);
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
});

// Middleware to parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Send email function
const sendEmail = (subject, text) => {
  const mailOptions = {
    from: '"Signdesk CLM Webhook" <no-reply@signdesk.com>', // sender address
    to: 'vishal.g@signdesk.com', // recipient email
    subject: subject,
    text: text, // email body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// Single API endpoint
app.post('/api/signdesk-webhook', (req, res) => {
  try {
    // Generate a random two-digit number
    const randomNumber = Math.floor(Math.random() * 90) + 10; // Two-digit number between 10 and 99
    console.log('Request Body:', req.body);

    // Simulate error if the number is odd or even
    if (false) {
      throw {
        status: 500,
        message: 'Lol!! An error occurred while processing the event.',
        statusText: 'error',
      };
    }

    // Log successful request
    logs.push(
      `[${new Date().toISOString()}] Success: ${JSON.stringify(req.body)}`
    );

    // Send success email
    sendEmail(
      'Webhook Event Success',
      `Received webhook event successfully: ${JSON.stringify(req.body)}`
    );

    res.status(200).json({
      message: 'I received your event, thank you :)',
      data: req.body,
      status: 'success',
    });
  } catch (error) {
    // Log error
    const errorLog = `[${new Date().toISOString()}] Error: ${
      error.message || 'An error occurred while processing the event.'
    }`;
    logs.push(errorLog);

    // Send error email
    sendEmail(
      'Webhook Event Error',
      `Error occurred while processing webhook event: ${
        error.message || 'An error occurred while processing the event.'
      }`
    );

    res.status(error.status || 500).json({
      message: error.message || 'An error occurred while processing the event.',
      status: error.statusText || 'error',
    });
  }
});

// Endpoint to fetch logs
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
