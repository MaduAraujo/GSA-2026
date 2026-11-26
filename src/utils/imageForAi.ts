const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export const MAX_AI_PAYLOAD_CHARS = 4_000_000;

export const AI_PAYLOAD_LIMIT_LABEL = '3MB';

export function exceedsAiPayloadLimit(dataUrl: string): boolean {
  return dataUrl.length > MAX_AI_PAYLOAD_CHARS;
}

export async function downscaleImageForAi(dataUrl: string): Promise<string> {
  if (
    !dataUrl.startsWith('data:image/') ||
    dataUrl.startsWith('data:image/svg') ||
    typeof createImageBitmap !== 'function'
  ) {
    return dataUrl;
  }
  try {
    const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return dataUrl;
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const resized = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return resized.length < dataUrl.length ? resized : dataUrl;
  } catch {
    return dataUrl;
  }
}
