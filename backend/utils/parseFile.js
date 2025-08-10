import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseFile(filePath, mimetype) {
  let text = '';
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(fs.readFileSync(filePath));
    text = data.text;
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ path: filePath });
    text = data.value;
  } else if (mimetype === 'text/plain') {
    text = fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new Error('Unsupported file type');
  }
  fs.unlinkSync(filePath); // delete after parsing
  return text.trim();
}
