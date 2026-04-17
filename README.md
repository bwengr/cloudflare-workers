# Cloudflare Workers

A collection of Cloudflare Workers and Pages Functions for various utilities.

## Contents

### Pages Functions (for Cloudflare Pages)

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
1. Copy `functions/_middleware.js` to your Cloudflare Pages project
2. Deploy - middleware auto-attaches to all routes

**Files:**
- `functions/_middleware.js` - The middleware code

### functions/
- `contact.js` - Mailgun contact form handler

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [RFC 8288 - Link Headers](https://www.rfc-editor.org/rfc/rfc8288)
- [IANA Link Relations](https://www.iana.org/assignments/link-relations/link-relations.xhtml)
