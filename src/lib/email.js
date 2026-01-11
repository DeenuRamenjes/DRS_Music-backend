import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        // Skip if SMTP not configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('SMTP not configured, skipping email send');
            return { success: false, reason: 'SMTP not configured' };
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || `"DRS Music" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || subject,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};

export default { sendEmail };
