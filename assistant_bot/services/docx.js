const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} = require('docx');

async function buildDocument(docData) {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: docData.title || 'Документ', bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    })
  );

  if (docData.subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: docData.subtitle, size: 24, color: '555555' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
      })
    );
  }

  if (docData.date || docData.parties) {
    children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }));
  }

  if (docData.date) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Дата: ${docData.date}`, size: 22 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      })
    );
  }

  if (docData.parties) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: docData.parties, size: 22, italics: true })],
        spacing: { after: 400 },
      })
    );
  }

  // Sections
  for (const section of docData.sections || []) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.heading || '', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 160 },
      })
    );

    const lines = (section.text || '').split('\n').filter(Boolean);
    for (const line of lines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  // Footer
  if (docData.footer) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '─'.repeat(40), color: 'CCCCCC', size: 18 })],
        spacing: { before: 600, after: 120 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: docData.footer, size: 20, color: '555555' })],
      })
    );
  }

  const doc = new Document({
    creator: 'М.К ИНВЕСТ Ассистент',
    title: docData.title || 'Документ',
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { buildDocument };
