export function cleanText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getTextStats(text: string) {
  const cleanedText = cleanText(text);

  const wordCount = cleanedText
    ? cleanedText.split(/\s+/).filter(Boolean).length
    : 0;

  const characterCount = cleanedText.length;

  return {
    cleanedText,
    wordCount,
    characterCount,
  };
}