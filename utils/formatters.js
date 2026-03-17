export const formatPhoneNumber = (phoneNumberString) => {
  if (!phoneNumberString) return '';

  // Check if it's already well-formatted or just empty
  if (phoneNumberString.length < 10) return phoneNumberString;

  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');

  // US Format: (123) 456-7890
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  // US Format with country code: +1 (123) 456-7890
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
  }

  // Generic international format (best effort): +12 345 6789...
  if (phoneNumberString.startsWith('+')) {
    // Just try to group into chunks of 3 or 4
    return phoneNumberString; // Fallback if we don't want to mess up international formats
  }

  return phoneNumberString;
};
