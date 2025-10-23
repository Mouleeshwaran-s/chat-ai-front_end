const fs = require('fs');
const path = require('path');

console.log("Deployment started...");

// Directories
const rootDir = __dirname.substring(0, __dirname.lastIndexOf("\\"));
const sourceDir = path.join(rootDir, 'docs', 'browser');
const destinationDir = path.join(rootDir, 'docs');

console.log("Source folder:", sourceDir);
console.log("Destination folder:", destinationDir);

// Helper: Move files/folders recursively
function moveFileOrFolder(source, destination) {
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  if (fs.lstatSync(source).isDirectory()) {
    fs.readdirSync(source).forEach(file => {
      const currentSource = path.join(source, file);
      const currentDestination = path.join(destination, file);
      moveFileOrFolder(currentSource, currentDestination);
    });
  } else {
    fs.renameSync(source, destination);
  }
}

// Move contents of 'browser' to 'docs'
if (fs.existsSync(sourceDir)) {
  console.log('Contents of browser directory before moving:', fs.readdirSync(sourceDir));

  fs.readdirSync(sourceDir).forEach(file => {
    const currentSource = path.join(sourceDir, file);
    const currentDestination = path.join(destinationDir, file);
    moveFileOrFolder(currentSource, currentDestination);
  });

  // Remove empty 'browser' folder
  fs.rmSync(sourceDir, { recursive: true, force: true });
  console.log("Removed 'browser' directory.");
} else {
  console.log("The 'browser' folder does not exist.");
}

// Ensure 404.html exists
const indexFile = path.join(destinationDir, 'index.html');
const notFoundFile = path.join(destinationDir, '404.html');

if (fs.existsSync(indexFile)) {
  fs.copyFileSync(indexFile, notFoundFile);
  console.log(`Copied index.html -> 404.html`);
} else {
  console.warn("Warning: index.html not found, cannot create 404.html");
}

console.log("Deployment finished successfully.");
