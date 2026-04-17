/**
 * Cloudflare Pages Function: Markdown for Agents
 * 
 * Intercepts requests with Accept: text/markdown header
 * Converts HTML responses to clean markdown
 * Auto-deploys with Cloudflare Pages (no Pro+ needed)
 */

const LINK_HEADERS = '</sitemap-index.xml>; rel="sitemap"; type="application/xml", </rss.xml>; rel="alternate"; type="application/rss+xml", </blog/>; rel="service-doc"; title="Blog Posts", </blog/>; rel="alternate"; type="text/markdown"; title="Blog as Markdown"';

export async function onRequest({ request, next }) {
  const acceptHeader = request.headers.get('Accept') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown');
  
  // Track markdown requests for analytics
  if (wantsMarkdown) {
    console.log(`MARKDOWN_REQUEST: agent=${userAgent.substring(0, 50)} url=${request.url}`);
  }
  
  // If not requesting markdown, pass through normally
  if (!wantsMarkdown) {
    const response = await next();
    // Add Link headers to all HTML responses for agent discovery
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Link', LINK_HEADERS);
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    }
    return response;
  }

  try {
    // Get the HTML response
    const response = await next();
    
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const html = await response.text();
    const markdown = htmlToMarkdown(html);

    console.log(`MARKDOWN_SERVED: url=${request.url} size=${markdown.length}`);
    
    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Signal': 'ai-train=no, search=yes, ai-input=no',
        'x-markdown-tokens': Math.ceil(markdown.length / 4).toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
        'Link': LINK_HEADERS
      }
    });
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return new Response('Error converting to markdown', { status: 500 });
  }
}

function htmlToMarkdown(html) {
  if (!html) return '';

  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : html;

  let markdown = content;

  // Remove unwanted elements
  markdown = markdown.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  markdown = markdown.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  markdown = markdown.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  markdown = markdown.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  markdown = markdown.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  markdown = markdown.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  markdown = markdown.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

  // Extract main content
  const mainMatch = markdown.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    markdown = mainMatch[1];
  }

  // Remove HTML comments
  markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

  // Paragraphs and line breaks
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Headings
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');

  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Images
  markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![]($1)');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map(item => {
      const text = item.replace(/<li[^>]*>/i, '').replace(/<\/li>/gi, '');
      const cleaned = text.replace(/<[^>]+>/g, '').trim();
      return `- ${cleaned}`;
    }).join('\n') + '\n\n';
  });

  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((item, i) => {
      const text = item.replace(/<li[^>]*>/i, '').replace(/<\/li>/gi, '');
      const cleaned = text.replace(/<[^>]+>/g, '').trim();
      return `${i + 1}. ${cleaned}`;
    }).join('\n') + '\n\n';
  });

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    return `> ${text}\n\n`;
  });

  // Code blocks and inline code
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    return '```\n' + text + '\n```\n\n';
  });
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Horizontal rules
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Tables
  markdown = markdown.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    return rows.map(row => {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      return '| ' + cells.map(cell => {
        return cell.replace(/<t[dh][^>]*>/i, '').replace(/<\/t[dh]>/gi, '').replace(/<[^>]+>/g, '').trim();
      }).join(' | ') + ' |';
    }).join('\n') + '\n';
  });

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.replace(/^\s+|\s+$/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");
  markdown = markdown.replace(/&nbsp;/g, ' ');

  return markdown.trim();
}