const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

const wrapper = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf6f0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c0a1e 0%, #2d1230 100%); padding:32px 40px; text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding-right:14px; vertical-align:middle;">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22s-8-4.5-8-11.8A6 6 0 0 1 10 4.3" stroke="#d4a843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 22s8-4.5 8-11.8A6 6 0 0 0 14 4.3" stroke="#d4a843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 22V12" stroke="#d4a843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 12a3 3 0 0 1-3-3 3 3 0 0 1 6 0 3 3 0 0 1-3 3z" stroke="#d4a843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 2c-.8 0-1.5.7-1.5 1.5S11.2 5 12 5s1.5-.7 1.5-1.5S12.8 2 12 2z" stroke="#d4a843" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:22px;font-weight:700;letter-spacing:4px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">PEHENAVAS</span><br>
                    <span style="font-size:10px;letter-spacing:3px;color:#d4a843;text-transform:uppercase;">The Royal Heritage</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent Line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, #1c0a1e 0%, #d4a843 50%, #1c0a1e 100%);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#faf6f0;padding:28px 40px;border-top:1px solid #f0e6d6;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;color:#999999;">
                      This email was sent by Pehenavas — The Royal Heritage
                    </p>
                    <p style="margin:0 0 8px;font-size:11px;color:#bbbbbb;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <p style="margin:0;font-size:11px;color:#bbbbbb;">
                      &copy; ${new Date().getFullYear()} Pehenavas. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const passwordReset = (email, resetLink) => ({
  subject: 'Reset Your Pehenavas Password',
  html: wrapper('Reset Password — Pehenavas', `
    <div style="text-align:center;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;"><tr>
        <td width="64" height="64" style="border-radius:50%;background-color:#fef3c7;text-align:center;vertical-align:middle;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#92400e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#92400e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr></table>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c0a1e;font-family:Georgia,'Times New Roman',serif;">Password Reset</h2>
      <p style="margin:0;font-size:14px;color:#888888;">Secure your Pehenavas account</p>
    </div>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        We received a request to reset the password for <strong>${email}</strong>.
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg, #1c0a1e, #4a1942);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.5px;">
        Reset My Password
      </a>
    </div>

    <div style="background-color:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:8px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
        <strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0e6d6;">
      <p style="margin:0;font-size:12px;color:#999999;text-align:center;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color:#92400e;word-break:break-all;font-size:12px;">${resetLink}</a>
      </p>
    </div>
  `),
});

const emailVerification = (name, verifyLink) => ({
  subject: 'Verify Your Pehenavas Account',
  html: wrapper('Verify Email — Pehenavas', `
    <div style="text-align:center;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;"><tr>
        <td width="64" height="64" style="border-radius:50%;background-color:#d1fae5;text-align:center;vertical-align:middle;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#065f46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="22,4 12,14.01 9,11.01" stroke="#065f46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr></table>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c0a1e;font-family:Georgia,'Times New Roman',serif;">Welcome, ${name}!</h2>
      <p style="margin:0;font-size:14px;color:#888888;">One last step to join the royal heritage</p>
    </div>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Thank you for creating your Pehenavas account. Please verify your email address to start shopping.
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        Once verified, you'll be able to place orders, track shipments, and access exclusive deals.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verifyLink}" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg, #065f46, #047857);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.5px;">
        Verify My Email
      </a>
    </div>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:8px;">
      <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
        <strong>New to Pehenavas?</strong> We have a curated collection of royal ethnic wear for men and women. Explore sherwanis, lehengas, jewellery, and more.
      </p>
    </div>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0e6d6;">
      <p style="margin:0;font-size:12px;color:#999999;text-align:center;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verifyLink}" style="color:#065f46;word-break:break-all;font-size:12px;">${verifyLink}</a>
      </p>
    </div>
  `),
});

const welcomeEmail = (name) => ({
  subject: 'Welcome to Pehenavas!',
  html: wrapper('Welcome — Pehenavas', `
    <div style="text-align:center;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;"><tr>
        <td width="64" height="64" style="border-radius:50%;background-color:#fef3c7;text-align:center;vertical-align:middle;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#92400e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr></table>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c0a1e;font-family:Georgia,'Times New Roman',serif;">Welcome, ${name}!</h2>
      <p style="margin:0;font-size:14px;color:#888888;">Your royal journey begins here</p>
    </div>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Your Pehenavas account is all set. Here's what you can do:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <div style="width:28px;height:28px;border-radius:6px;background-color:#fef3c7;text-align:center;line-height:28px;font-size:14px;">&#128722;</div>
          </td>
          <td style="padding:8px 0 8px 4px;font-size:14px;color:#374151;line-height:1.5;">
            <strong>Browse & Shop</strong> — Explore our curated collection of royal ethnic wear
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <div style="width:28px;height:28px;border-radius:6px;background-color:#fef3c7;text-align:center;line-height:28px;font-size:14px;">&#9825;</div>
          </td>
          <td style="padding:8px 0 8px 4px;font-size:14px;color:#374151;line-height:1.5;">
            <strong>Wishlist</strong> — Save your favorites for later
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <div style="width:28px;height:28px;border-radius:6px;background-color:#fef3c7;text-align:center;line-height:28px;font-size:14px;">&#128179;</div>
          </td>
          <td style="padding:8px 0 8px 4px;font-size:14px;color:#374151;line-height:1.5;">
            <strong>Track Orders</strong> — Monitor your orders in real-time
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <div style="width:28px;height:28px;border-radius:6px;background-color:#fef3c7;text-align:center;line-height:28px;font-size:14px;">&#11088;</div>
          </td>
          <td style="padding:8px 0 8px 4px;font-size:14px;color:#374151;line-height:1.5;">
            <strong>Write Reviews</strong> — Share your experience with the community
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${BASE_URL}" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg, #1c0a1e, #4a1942);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.5px;">
        Start Shopping
      </a>
    </div>
  `),
});

const supportRequest = (name, email, subject, message) => ({
  subject: `Support Request — ${subject}`,
  html: wrapper('Support Request — Pehenavas', `
    <div style="text-align:center;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;"><tr>
        <td width="64" height="64" style="border-radius:50%;background-color:#eff6ff;text-align:center;vertical-align:middle;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#1e40af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr></table>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c0a1e;font-family:Georgia,'Times New Roman',serif;">We've Got Your Message</h2>
      <p style="margin:0;font-size:14px;color:#888888;">Our support team is on it</p>
    </div>

    <!-- Ticket Banner -->
    <div style="background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:2px;">Support Ticket</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">#${Date.now().toString(36).toUpperCase()}</p>
    </div>

    <!-- User Info Card -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:0;margin-bottom:20px;overflow:hidden;">
      <div style="background-color:#eff6ff;padding:12px 24px;border-bottom:1px solid #dbeafe;">
        <p style="margin:0;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Request Details</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 24px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top;">Name</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;font-weight:600;">${name}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;">${email}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Subject</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;font-weight:600;">${subject}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>
    </div>

    <!-- Message -->
    <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Message</p>
      <div style="border-left:3px solid #2563eb;padding-left:16px;">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;font-style:italic;">"${message}"</p>
      </div>
    </div>

    <!-- Timeline -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">What Happens Next</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="36" style="vertical-align:top;padding:4px 0;">
            <div style="width:24px;height:24px;border-radius:50%;background:#dbeafe;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#1e40af;">1</div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:13px;color:#374151;line-height:1.5;">
            <strong>Received</strong> — Your request has been logged in our system
          </td>
        </tr>
        <tr>
          <td width="36" style="vertical-align:top;padding:4px 0;">
            <div style="width:24px;height:24px;border-radius:50%;background:#dbeafe;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#1e40af;">2</div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:13px;color:#374151;line-height:1.5;">
            <strong>Review</strong> — Our team reviews your request within 2-4 hours
          </td>
        </tr>
        <tr>
          <td width="36" style="vertical-align:top;padding:4px 0;">
            <div style="width:24px;height:24px;border-radius:50%;background:#dbeafe;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#1e40af;">3</div>
          </td>
          <td style="padding:4px 0 4px 8px;font-size:13px;color:#374151;line-height:1.5;">
            <strong>Response</strong> — You'll receive a detailed reply within 24 hours
          </td>
        </tr>
      </table>
    </div>

    <!-- Contact Box -->
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:8px;">
      <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
        <strong>Need immediate help?</strong> Call us at <strong>+91 98765 43210</strong> (Mon-Sat, 10AM-8PM IST) or email <a href="mailto:support@pehenavas.com" style="color:#1e40af;">support@pehenavas.com</a>
      </p>
    </div>
  `),
});

const feedbackReceived = (name, rating, category, message) => ({
  subject: 'Thank You for Your Feedback!',
  html: wrapper('Feedback Received — Pehenavas', `
    <div style="text-align:center;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;"><tr>
        <td width="64" height="64" style="border-radius:50%;background-color:#fef3c7;text-align:center;vertical-align:middle;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#92400e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr></table>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c0a1e;font-family:Georgia,'Times New Roman',serif;">Thank You, ${name}!</h2>
      <p style="margin:0;font-size:14px;color:#888888;">Your feedback helps us serve you better</p>
    </div>

    <!-- Rating Banner -->
    <div style="background:linear-gradient(135deg,#92400e,#b45309);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;color:#fde68a;text-transform:uppercase;letter-spacing:2px;">Your Rating</p>
      <p style="margin:0;font-size:32px;color:#fbbf24;letter-spacing:4px;">${'&#9733;'.repeat(rating)}${'&#9734;'.repeat(5 - rating)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#fef3c7;font-weight:600;">${rating}/5 Stars</p>
    </div>

    <!-- Feedback Details -->
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:0;margin-bottom:20px;overflow:hidden;">
      <div style="background-color:#fef3c7;padding:12px 24px;border-bottom:1px solid #fde68a;">
        <p style="margin:0;font-size:12px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Feedback Details</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 24px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top;">Name</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;font-weight:600;">${name}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Category</td>
          <td style="padding:8px 0;">
            <span style="display:inline-block;padding:4px 12px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;border-radius:20px;">${category}</span>
          </td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid #f0f0f0;"></td></tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>

    <!-- Message -->
    <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Feedback</p>
      <div style="border-left:3px solid #f59e0b;padding-left:16px;">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;font-style:italic;">"${message}"</p>
      </div>
    </div>

    <!-- Promise Box -->
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:8px;">
      <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:700;">Our Promise to You</p>
      <p style="margin:0;font-size:13px;color:#15803d;line-height:1.6;">
        Every piece of feedback is reviewed by our founding team. We continuously work to improve product quality, delivery experience, and customer service. Your voice matters — thank you for being part of the Pehenavas family.
      </p>
    </div>
  `),
});

export { passwordReset, emailVerification, welcomeEmail, supportRequest, feedbackReceived };
