import nodemailer from 'nodemailer'

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@vims.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return false
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  const purposeText = {
    LOGIN: 'Login',
    EMAIL_VERIFICATION: 'Email Verification',
    PASSWORD_RESET: 'Password Reset',
    CHANGE_PASSWORD: 'Change Password',
  }[purpose] || 'Login'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VIMS - Volunteer Information Management System</h1>
          </div>
          <div class="content">
            <h2>${purposeText}</h2>
            <p>Your One-Time Password (OTP) for ${purposeText.toLowerCase()} is:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>This OTP will expire in 5 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>&copy; 2024 VIMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Your ${purposeText} OTP - VIMS`,
    html,
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to VIMS! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>Welcome to the Volunteer Information Management System (VIMS). We're excited to have you on board!</p>
            <p>Your account has been successfully created. You can now log in and start exploring volunteering opportunities.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Go to Dashboard</a></p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <div class="footer">
              <p>&copy; 2024 VIMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to VIMS - Volunteer Information Management System',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, fullName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>We received a request to reset your password. You will receive an OTP via email to proceed with password reset.</p>
            <p><strong>This action requires verification via OTP for security purposes.</strong></p>
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 VIMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - VIMS',
    html,
  })
}
