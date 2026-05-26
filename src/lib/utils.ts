/**
 * Utility functions for string formatting and HTML operations.
 */

/**
 * Strips HTML tags from a string to return clean plain text.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // Remove script and style elements completely
  let text = html.replace(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi, '');
  
  // Remove other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
             
  // Trim multiple spaces/newlines
  return text.replace(/\s+/g, ' ').trim();
}
