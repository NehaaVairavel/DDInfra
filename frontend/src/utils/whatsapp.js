/**
 * Utility to generate WhatsApp redirection URL with a pre-filled message.
 * @param productName - Optional name of the machine for context.
 * @param refNumber - Optional reference number of the machine.
 * @returns A formatted WhatsApp wa.me URL.
 */
export const getWhatsAppUrl = (productName, refNumber) => {
  // Replace [DDINFRA_PHONE] with your actual WhatsApp number (country code + number, no +)
  const phoneNumber = "[DDINFRA_WHATSAPP_NUMBER]";
  let message = "Hello DDInfra and Co, I'm interested in your heavy equipment. Please share more details.";

  if (productName) {
    message = `Hello DDInfra and Co, I am interested in the ${productName}${refNumber ? ` (Ref: ${refNumber})` : ""}. Please share more details and technical specifications.`;
  }

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};
