const escapePdfString = (value) => value
  .replace(/\\/g, "\\\\")
  .replace(/\(/g, "\\(")
  .replace(/\)/g, "\\)");

export const buildPdfBuffer = ({ pages, info = {} }) => {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error("pages must be a non-empty array");
  }

  let nextObjectId = 1;
  const catalogObjectId = nextObjectId++;
  const pagesObjectId = nextObjectId++;
  const fontObjectId = nextObjectId++;
  const infoObjectId = nextObjectId++;

  const objectBodies = [];
  const pageObjectIds = [];

  objectBodies[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (const rawText of pages) {
    const pageObjectId = nextObjectId++;
    const contentObjectId = nextObjectId++;
    pageObjectIds.push(pageObjectId);

    const text = escapePdfString(String(rawText));
    const streamBody = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`;
    const streamLength = Buffer.byteLength(streamBody, "utf8");

    objectBodies[contentObjectId] = `<< /Length ${streamLength} >>\nstream\n${streamBody}\nendstream`;
    objectBodies[pageObjectId] = `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  }

  const kidRefs = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  objectBodies[pagesObjectId] = `<< /Type /Pages /Kids [${kidRefs}] /Count ${pageObjectIds.length} >>`;
  objectBodies[catalogObjectId] = `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;

  const infoDefaults = {
    Title: "Fixture Document",
    Author: "wasm-rquickjs",
    Producer: "pdf-fixtures.js",
  };
  const infoEntries = Object.entries({ ...infoDefaults, ...info })
    .map(([key, value]) => `/${key} (${escapePdfString(String(value))})`)
    .join(" ");
  objectBodies[infoObjectId] = `<< ${infoEntries} >>`;

  const maxObjectId = nextObjectId - 1;
  const objectOffsets = new Array(maxObjectId + 1).fill(0);

  let output = "%PDF-1.4\n%----\n";
  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    objectOffsets[objectId] = Buffer.byteLength(output, "utf8");
    output += `${objectId} 0 obj\n${objectBodies[objectId]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${maxObjectId + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    output += `${String(objectOffsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }

  output += "trailer\n";
  output += `<< /Size ${maxObjectId + 1} /Root ${catalogObjectId} 0 R /Info ${infoObjectId} 0 R >>\n`;
  output += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(output, "utf8");
};

export const singlePagePdf = () => buildPdfBuffer({
  pages: ["Hello PDF Parse"],
  info: {
    Title: "Single Page Fixture",
  },
});

export const threePagePdf = () => buildPdfBuffer({
  pages: ["Page One", "Page Two", "Page Three"],
  info: {
    Title: "Three Page Fixture",
  },
});
