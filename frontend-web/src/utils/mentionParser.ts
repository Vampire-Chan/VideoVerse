export const parseMentionsForMarkdown = (text: string): string => {
  if (!text) return '';
  return text.replace(/@(\w+)/g, '[@$1](/profile/$1)');
};