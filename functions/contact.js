/**
 * Cloudflare Pages Function: Mailgun Contact Form
 *
 * Handles contact form submissions and sends emails via Mailgun API.
 * Requires environment variables set in Cloudflare Pages settings.
 *
 * Environment Variables (set in Cloudflare Pages):
 * - MAILGUN_DOMAIN: Your Mailgun sending domain (e.g., mg.yourdomain.com)
 * - MAILGUN_API_KEY: Your Mailgun API key
 *
 * Form fields expected:
 * - name: Sender's name
 * - email: Sender's email address
 * - message: Message content
 * - bot-field: Honeypot field (hidden, bots fill it)
 */

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await context.request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');
  const botField = formData.get('bot-field');

  // Honeypot check - if filled, it's a bot
  if (botField) {
    return new Response('Bot detected', { status: 400 });
  }

  // Validate required fields
  if (!name || !email || !message) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Sanitize inputs
  const sanitizedName = String(name).replace(/[\r\n]/g, '').slice(0, 100);
  const sanitizedEmail = String(email).replace(/[\r\n]/g, '').slice(0, 254);
  const sanitizedMessage = String(message).slice(0, 5000);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return new Response('Invalid email address', { status: 400 });
  }

  // Get Mailgun credentials from environment
  const mailgunDomain = context.env.MAILGUN_DOMAIN;
  const mailgunApiKey = context.env.MAILGUN_API_KEY;

  if (!mailgunDomain || !mailgunApiKey) {
    console.error('Mailgun credentials not configured');
    return new Response('Server configuration error', { status: 500 });
  }

  const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

  // Create Basic auth header
  const auth = btoa(`api:${mailgunApiKey}`);

  // Build email body - replace with your own emails
  const body = new URLSearchParams({
    from: `Contact Form <mailgun@${mailgunDomain}>`,
    to: '<YOUR_EMAIL@YOUR_DOMAIN.com>',
    subject: `New Contact Form Submission from ${sanitizedName}`,
    text: `Name: ${sanitizedName}\nEmail: ${sanitizedEmail}\n\nMessage:\n${sanitizedMessage}`,
    'h:Reply-To': sanitizedEmail
  });

  try {
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailgun error:', errorText);
      return new Response('Failed to send email', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response('Server error', { status: 500 });
  }
}