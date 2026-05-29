const fs = require('fs');
let c = fs.readFileSync('src/App.js', 'utf8');
c = c.replace('const handleSubmit = () => {', 'const handleSubmit = async () => {');
c = c.replace(
  'if (form.name && form.email && form.message) setSent(true);',
  'if (form.name && form.email && form.message) { fetch("https://formspree.io/f/xgoqrjrk", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)}).then(()=>setSent(true)); }'
);
fs.writeFileSync('src/App.js', c);
console.log('Contact form fixed!');