const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf));
if (typeof pdf !== 'function') {
  console.log('PDF is not a function, checking sub-properties...');
}
