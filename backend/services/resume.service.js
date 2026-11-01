import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(buffer) {
  const parser = new pdf.PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to parse PDF file: ' + error.message);
  } finally {
    try {
      await parser.destroy();
    } catch (destroyError) {
      console.error('Error destroying PDF parser:', destroyError);
    }
  }
}

/**
 * Extract text from a DOCX buffer
 */
export async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * General text extractor based on file type
 */
export async function extractResumeText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(buffer);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}
