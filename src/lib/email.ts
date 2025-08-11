import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransporter({
  // Use environment variables for email service
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Default from address
const DEFAULT_FROM = process.env.EMAIL_FROM || 'hello@skystage.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://skystage.com';

// Email templates
export const emailTemplates = {
  welcomeUser: (userEmail: string, userName: string): EmailTemplate => ({
    to: userEmail,
    subject: 'Welcome to SkyStage! ✨',
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${BASE_URL}/assets/logos/skystage-logo.svg" alt="SkyStage" style="height: 60px;">
        </div>

        <h1 style="color: #333; text-align: center; font-weight: 300; font-size: 32px;">
          Welcome to SkyStage, ${userName}!
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for joining the SkyStage community! You're now part of the world's largest drone show platform.
        </p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
          <ul style="color: #666; padding-left: 20px;">
            <li>Browse our extensive formation library</li>
            <li>Design custom drone shows</li>
            <li>Book professional drone operators</li>
            <li>Access our 3D preview tools</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/discover" style="background: #222; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Start Exploring
          </a>
        </div>

        <p style="color: #999; font-size: 14px; text-align: center;">
          Have questions? Reply to this email or contact us at hello@skystage.com
        </p>
      </div>
    `,
  }),

  bookingConfirmation: ($1: unknown): EmailTemplate => ({
    to: userEmail,
    subject: 'Booking Confirmation - SkyStage Drone Show',
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${BASE_URL}/assets/logos/skystage-logo.svg" alt="SkyStage" style="height: 60px;">
        </div>

        <h1 style="color: #333; text-align: center; font-weight: 300; font-size: 28px;">
          Booking Confirmed! 🎉
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your drone show booking has been received and confirmed. Here are the details:
        </p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; color: #666;">
            <tr><td style="padding: 5px 0;"><strong>Event Date:</strong></td><td>${bookingDetails.event_date}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Location:</strong></td><td>${bookingDetails.location}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Duration:</strong></td><td>${bookingDetails.duration} minutes</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Drones:</strong></td><td>${bookingDetails.drone_count}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Budget:</strong></td><td>$${bookingDetails.budget}</td></tr>
          </table>
        </div>

        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1565c0; margin-top: 0;">What's Next?</h4>
          <ol style="color: #666; padding-left: 20px;">
            <li>We'll match you with qualified operators in your area</li>
            <li>You'll receive quotes within 24 hours</li>
            <li>Select your preferred operator and finalize details</li>
            <li>Enjoy your incredible drone show!</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/dashboard" style="background: #222; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Track Your Booking
          </a>
        </div>

        <p style="color: #999; font-size: 14px; text-align: center;">
          Questions? Contact us at hello@skystage.com or call +1 (978) 648-2323
        </p>
      </div>
    `,
  }),

  adminBookingNotification: ($1: unknown): EmailTemplate => ({
    to: 'admin@skystage.com',
    subject: `New Booking: ${bookingDetails.event_type} - ${bookingDetails.location}`,
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">New Booking Received</h1>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${bookingDetails.full_name}</p>
          <p><strong>Email:</strong> ${bookingDetails.email}</p>
          <p><strong>Phone:</strong> ${bookingDetails.phone}</p>

          <h3>Event Details</h3>
          <p><strong>Type:</strong> ${bookingDetails.event_type}</p>
          <p><strong>Date:</strong> ${bookingDetails.event_date}</p>
          <p><strong>Location:</strong> ${bookingDetails.location}</p>
          <p><strong>Duration:</strong> ${bookingDetails.duration} minutes</p>
          <p><strong>Drones:</strong> ${bookingDetails.drone_count}</p>
          <p><strong>Budget:</strong> $${bookingDetails.budget}</p>

          ${bookingDetails.special_requirements ?
            `<h3>Special Requirements</h3><p>${bookingDetails.special_requirements}</p>` :
            ''
          }
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${BASE_URL}/admin" style="background: #222; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px;">
            View in Admin Panel
          </a>
        </div>
      </div>
    `,
  }),

  passwordReset: (userEmail: string, resetToken: string): EmailTemplate => ({
    to: userEmail,
    subject: 'Reset Your SkyStage Password',
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${BASE_URL}/assets/logos/skystage-logo.svg" alt="SkyStage" style="height: 60px;">
        </div>

        <h1 style="color: #333; text-align: center; font-weight: 300; font-size: 28px;">
          Reset Your Password
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/reset-password?token=${resetToken}" style="background: #222; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Reset Password
          </a>
        </div>

        <p style="color: #999; font-size: 14px; text-align: center;">
          If you didn't request this reset, please ignore this email. The link will expire in 24 hours.
        </p>

        <p style="color: #999; font-size: 12px; text-align: center;">
          Or copy and paste this URL: ${BASE_URL}/reset-password?token=${resetToken}
        </p>
      </div>
    `,
  }),

  newsletterSignup: (userEmail: string): EmailTemplate => ({
    to: userEmail,
    subject: 'Your 3 Free Drone Show Designs Are Ready! 🎯',
    html: `
      <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${BASE_URL}/assets/logos/skystage-logo.svg" alt="SkyStage" style="height: 60px;">
        </div>

        <h1 style="color: #333; text-align: center; font-weight: 300; font-size: 28px;">
          Your Free Designs Are Ready!
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for subscribing! As promised, here are your 3 free drone show designs to get you started:
        </p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
          <div style="text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
            <img src="${BASE_URL}/assets/formations/beating-heart.jpg" style="width: 100%; border-radius: 4px; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #333;">Beating Heart</h4>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">100 drones • 47s</p>
          </div>
          <div style="text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
            <img src="${BASE_URL}/assets/formations/starry-night.jpg" style="width: 100%; border-radius: 4px; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #333;">Starry Night</h4>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">255 drones • 10s</p>
          </div>
          <div style="text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
            <img src="${BASE_URL}/assets/formations/unfolding-rose.jpg" style="width: 100%; border-radius: 4px; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #333;">Unfolding Rose</h4>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">100 drones • 21s</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/discover" style="background: #222; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            View All Designs
          </a>
        </div>

        <p style="color: #999; font-size: 14px; text-align: center;">
          Ready to book a show? Contact us at hello@skystage.com
        </p>
      </div>
    `,
  }),
};

// Send email function
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // Skip sending emails in development unless explicitly configured
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('📧 Email would be sent (dev mode):');
      console.log(`To: ${template.to}`);
      console.log(`Subject: ${template.subject}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: template.from || DEFAULT_FROM,
      to: template.to,
      subject: template.subject,
      html: template.html,
    });

    console.log('📧 Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

// Bulk email function for newsletters
export async function sendBulkEmails(templates: EmailTemplate[]): Promise<number> {
  let successCount = 0;

  for (const template of templates) {
    const success = await sendEmail(template);
    if (success) successCount++;

    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return successCount;
}

// Newsletter subscription
export async function subscribeToNewsletter(email: string): Promise<boolean> {
  try {
    // Send welcome email with free designs
    const welcomeTemplate = emailTemplates.newsletterSignup(email);
    await sendEmail(welcomeTemplate);

    // Here you could also add the email to a newsletter service like Mailchimp
    // await addToMailchimpList(email);

    return true;
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return false;
  }
}
