/**
 * Sanitizes a filename by removing special characters and spaces.
 * This is critical for URLs that will be passed to AI services like Google AI Studio.
 */
export function sanitizeFileName(fileName: string): string {
  // Get extension
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot > 0 ? fileName.slice(lastDot) : '';
  const nameWithoutExt = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  
  // Sanitize: 
  // 1. Convert to lowercase
  // 2. Replace spaces and underscores with hyphens
  // 3. Remove all non-alphanumeric characters except hyphens
  // 4. Replace multiple consecutive hyphens with single hyphen
  // 5. Remove leading/trailing hyphens
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[\s_]+/g, '-')           // spaces/underscores -> hyphens
    .replace(/[^a-z0-9-]/g, '')        // remove special chars
    .replace(/-+/g, '-')               // multiple hyphens -> single
    .replace(/^-|-$/g, '');            // trim hyphens
  
  // Ensure we have a valid name
  const finalName = sanitized || 'file';
  
  return finalName + extension.toLowerCase();
}

/**
 * Generates a unique, sanitized filename with timestamp.
 */
export function generateSafeFileName(originalName: string, prefix?: string): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  
  if (prefix) {
    return `${prefix}-${timestamp}-${random}-${sanitized}`;
  }
  
  return `${timestamp}-${random}-${sanitized}`;
}
