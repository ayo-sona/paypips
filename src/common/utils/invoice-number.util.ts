export function generateInvoiceNumber(organizationId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  // const orgPrefix = organizationId.substring(0, 4).toUpperCase();

  return `INV-${year}${month}-${random}`;
}
