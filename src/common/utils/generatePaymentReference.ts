// Generate unique reference
export function generateReference(prefix = 'REE') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}
