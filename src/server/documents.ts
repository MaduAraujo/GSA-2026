import type ExcelJS from 'exceljs';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_DOCUMENT_CHARS = 12000;

function extractXlsxText(workbook: ExcelJS.Workbook): string {
  const parts: string[] = [];
  workbook.eachSheet((worksheet) => {
    parts.push(`## ${worksheet.name}`);
    worksheet.eachRow((row) => {
      const cells = (row.values as ExcelJS.CellValue[]).slice(1).map((v) => (v == null ? '' : String(v)));
      parts.push(cells.join(' | '));
    });
  });
  return parts.join('\n');
}

export async function extractDocumentText(dataUrl: string, mimeType: string): Promise<string> {
  const base64 = dataUrl.split(',')[1] || '';
  const buffer = Buffer.from(base64, 'base64');

  try {
    if (mimeType === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return (result.text || '').trim().slice(0, MAX_DOCUMENT_CHARS);
      } finally {
        await parser.destroy();
      }
    }
    if (mimeType === DOCX_MIME_TYPE) {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim().slice(0, MAX_DOCUMENT_CHARS);
    }
    if (mimeType === XLSX_MIME_TYPE) {
      const ExcelJSRuntime = (await import('exceljs')).default;
      const workbook = new ExcelJSRuntime.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      return extractXlsxText(workbook).trim().slice(0, MAX_DOCUMENT_CHARS);
    }
  } catch (error) {
    console.error('Erro ao extrair texto do arquivo anexado:', error);
    return '';
  }

  return '';
}

export function mimeTypeOfDataUrl(dataUrl: string): string {
  return /^data:([^;]+);base64,/.exec(dataUrl)?.[1] ?? '';
}
