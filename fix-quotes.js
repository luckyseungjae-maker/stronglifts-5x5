const fs = require(`fs`);
const p = `./src/App.js`;
let c = fs.readFileSync(p, `utf8`);
c = c.split(String.fromCharCode(8220)).join(String.fromCharCode(34));
c = c.split(String.fromCharCode(8221)).join(String.fromCharCode(34));
c = c.split(String.fromCharCode(8216)).join(String.fromCharCode(39));
c = c.split(String.fromCharCode(8217)).join(String.fromCharCode(39));
fs.writeFileSync(p, c, `utf8`);
console.log(`Done!`);
