const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/amr/Downloads/seed.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', data.length);
console.log('\nColumns:', Object.keys(data[0] || {}));
console.log('\nData:');
console.log(JSON.stringify(data, null, 2));

// Save to JSON for easier processing
fs.writeFileSync('/Users/amr/dev/personal/book-fair/seed-data.json', JSON.stringify(data, null, 2));
console.log('\n✅ Saved to seed-data.json');
