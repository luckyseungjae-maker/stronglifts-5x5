const fs = require(‘fs’);
const path = require(‘path’);

const filePath = path.join(__dirname, ‘src’, ‘App.js’);
let content = fs.readFileSync(filePath, ‘utf8’);

// Fix smart double quotes
content = content.replace(/\u201c/g, ‘”’);
content = content.replace(/\u201d/g, ‘”’);
// Fix smart single quotes  
content = content.replace(/\u2018/g, “’”);
content = content.replace(/\u2019/g, “’”);

fs.writeFileSync(filePath, content, ‘utf8’);
console.log(‘Quotes fixed successfully!’);
