const fs = require(‘fs’);
const filePath = ‘./src/App.js’;
let content = fs.readFileSync(filePath, ‘utf8’);
content = content.split(’\u201c’).join(’”’);
content = content.split(’\u201d’).join(’”’);
content = content.split(’\u2018’).join(”’”);
content = content.split(’\u2019’).join(”’”);
fs.writeFileSync(filePath, content, ‘utf8’);
console.log(‘Done!’);
