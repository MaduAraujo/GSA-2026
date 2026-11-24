export function countLabel(count: number, singular: string, plural: string): string {
  if (count <= 0) return '';
  return `${count} ${count === 1 ? singular : plural}`;
}
