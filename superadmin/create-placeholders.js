const fs = require('fs');
const path = require('path');

const pages = ["reservations", "customers", "inventory", "coupons", "payments", "reports", "settings", "activity-logs", "profile"];

pages.forEach(p => {
  const dir = path.join(__dirname, 'src', 'app', p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const componentName = p.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + 'Page';
  
  const content = `"use client";\n\nexport default function ${componentName}() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold text-slate-900">${p.toUpperCase()}</h1>\n      <p className="text-slate-500 mt-2">This module is under construction and will be fully developed in subsequent phases.</p>\n    </div>\n  );\n}\n`;
  
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

console.log("Placeholders created!");
