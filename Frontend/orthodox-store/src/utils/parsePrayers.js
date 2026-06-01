/**
 * Разбор molitvas.txt: блоки разделены строкой "---", первая непустая строка — название.
 */
export function parsePrayers(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  return normalized
    .split(/\n-{3,}\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split('\n').map((line) => line.trim());
      const titleIndex = lines.findIndex(Boolean);
      if (titleIndex === -1) {
        return null;
      }

      const title = lines[titleIndex];
      const text = lines
        .slice(titleIndex + 1)
        .filter((line) => line.length > 0)
        .join('\n')
        .trim();
      const id = `prayer-${index}-${slug(title)}`;

      return { id, title, text };
    })
    .filter(Boolean);
}

function slug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9-]/gi, '')
    .slice(0, 48);
}
