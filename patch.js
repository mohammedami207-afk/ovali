const fs = require('fs');
const path = './src/lib/excelHelper.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const salePrice = mapping\.salePrice && row\[mapping\.salePrice\]\s*\n\s*\? parseFloat\(row\[mapping\.salePrice\]\)\s*\n\s*: 0;/,
  `let salePrice = 0;
    if (mapping.salePrice && row[mapping.salePrice] !== undefined && row[mapping.salePrice] !== '') {
      const parsed = parseFloat(row[mapping.salePrice]);
      if (!isNaN(parsed)) salePrice = parsed;
    }`
);

code = code.replace(
  /const costPrice = mapping\.costPrice && row\[mapping\.costPrice\]\s*\n\s*\? parseFloat\(row\[mapping\.costPrice\]\)\s*\n\s*: \(salePrice \* 0\.6\);/,
  `let costPrice = salePrice * 0.6;
    if (mapping.costPrice && row[mapping.costPrice] !== undefined && row[mapping.costPrice] !== '') {
      const parsed = parseFloat(row[mapping.costPrice]);
      if (!isNaN(parsed)) costPrice = parsed;
    }`
);

code = code.replace(
  /const quantity = mapping\.quantity && row\[mapping\.quantity\]\s*\n\s*\? parseInt\(row\[mapping\.quantity\], 10\)\s*\n\s*: 10;/,
  `let quantity = 10;
    if (mapping.quantity && row[mapping.quantity] !== undefined && row[mapping.quantity] !== '') {
      const parsed = parseInt(row[mapping.quantity], 10);
      if (!isNaN(parsed)) quantity = parsed;
    }`
);

fs.writeFileSync(path, code);
console.log('Patched excelHelper.ts');
