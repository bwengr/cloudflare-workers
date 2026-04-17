# Cloudflare Workers

A collection of Cloudflare Workers and Pages Functions for various utilities.

## Contents

### Pages Functions

#### markdown-for-agents
Converts HTML responses to markdown when AI agents request with `Accept: text/markdown` header.

**What it does:**
- Adds Link headers for AI agent discovery (sitemap, RSS, blog)
- Serves clean markdown when agents send `Accept: text/markdown`
- Includes Content-Signal and x-markdown-tokens headers
- Extracts main content, strips nav/footer/scripts

**Requirements:**
- Cloudflare Pages site
- No Pro+ required (uses Pages Functions middleware)

**Usage:**
1. Copy `functions/markdown-for-agents/_middleware.js` to your Cloudflare Pages project under `functions/`
2. Deploy - middleware auto-attaches to all routes

---

#### contact-form
Mailgun contact form handler for Cloudflare Pages.

**What it does:**
- Validates required fields (name, email, message)
- Honeypot bot protection
- Email sanitization
- Sends to Mailgun API
- Returns JSON response

**Requirements:**
- Cloudflare Pages site
- Mailgun account with sending domain
- Environment variables configured in Cloudflare Pages

**Setup:**

1. **Configure Mailgun:**
   - Create a Mailgun account at mailgun.com
   - Add and verify your sending domain
   - Generate an API key

2. **Set Environment Variables in Cloudflare Pages:**
   - Go to your Pages project → Settings → Environment Variables
   - Add:
     - `MAILGUN_DOMAIN` = your sending domain (e.g., mg.yourdomain.com)
     - `MAILGUN_API_KEY` = your Mailgun API key

3. **Add to your site:**
   - Copy `functions/api/contact.js` to your Cloudflare Pages project under `functions/api/`
   - The endpoint will be available at `/api/contact`

4. **Create your HTML form:**
   ```html
   <form action="/api/contact" method="POST">
     <input type="text" name="name" required>
     <input type="email" name="email" required>
     <textarea name="message" required></textarea>
     <!-- Honeypot field (hidden from users, bots will fill it) -->
     <input type="text" name="bot-field" style="display:none">
     <button type="submit">Send</button>
   </form>
   ```

**Files:**
- `functions/markdown-for-agents/_middleware.js` - The markdown-for-agents middleware
- `functions/api/contact.js` - The contact form handler

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Mailgun Docs](https://documentation.mailgun.com/)
- [RFC 8288 - Link Headers](https://www.rfc-editor.org/rfc/rfc8288)
- [IANA Link Relations](https://www.iana.org/assignments/link-relations/link-relations.xhtml)