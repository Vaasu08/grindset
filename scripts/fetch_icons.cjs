const { execSync } = require('child_process');
const fs = require('fs');

const icons = [
  'target', 'activity', 'flame', 'check-circle', 'clock', 'award',
  'play', 'brain', 'list', 'chevron-right', 'maximize', 'minimize',
  'alert-triangle', 'lock', 'unlock', 'headphones', 'coffee',
  'music', 'cloud-rain', 'waves', 'external-link'
];

let fileContent = 'import React from "react";\n\n';

for (const icon of icons) {
  try {
    let svg = execSync(`better-icons get lucide:${icon}`).toString();
    
    // Replace SVG to spread props so we can override strokeWidth, color, size, etc
    svg = svg.replace('<svg', '<svg {...props}');
    
    // Fix common attributes for React
    svg = svg.replace(/stroke-width/g, 'strokeWidth');
    svg = svg.replace(/stroke-linecap/g, 'strokeLinecap');
    svg = svg.replace(/stroke-linejoin/g, 'strokeLinejoin');
    svg = svg.replace(/class=/g, 'className=');
    
    // Capitalize icon name for component (e.g. check-circle -> CheckCircle)
    const compName = icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    
    // Some SVGs might not have a trailing newline, so add one
    fileContent += `export const ${compName} = (props) => (\n  ${svg.trim()}\n);\n\n`;
    console.log(`Fetched ${icon}`);
  } catch (e) {
    console.error(`Failed to fetch ${icon}`, e.message);
  }
}

fs.writeFileSync('src/Icons.jsx', fileContent);
console.log('Saved to src/Icons.jsx');
