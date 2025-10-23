const fs = require('fs');
const path = require('path');
console.log("Deployment started...");
const sourceDir = path.join(__dirname.substring(0, __dirname.lastIndexOf("\\")), 'docs', 'browser');
const destinationDir = path.join(__dirname.substring(0, __dirname.lastIndexOf("\\")), 'docs');
console.log("Des Folder destinationDir: ", sourceDir);
function moveFileOrFolder(source, destination) {
  const destinationDir = path.dirname(destination);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }
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
console.log('Contents of browser directory before deletion:', fs.readdirSync(sourceDir));
if (fs.existsSync(sourceDir)) {
  fs.readdirSync(sourceDir).forEach(file => {
    const currentSource = path.join(sourceDir, file);
    const currentDestination = path.join(destinationDir, file);
    moveFileOrFolder(currentSource, currentDestination);
  });
  if (fs.existsSync(sourceDir)) {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    console.log("Removed 'browser' directory.");
  }
} else {
  console.log("The 'browser' folder does not exist.");
}
const sourcefile = path.join(destinationDir, 'index.csr.html');
const destinationFile = path.join(destinationDir, 'index.html');
const destinationFilenot = path.join(destinationDir, '404.html');
try {
  fs.renameSync(sourcefile, destinationFile);
  console.log(`Renamed file: ${sourcefile} -> ${destinationFile}`);
  fs.copyFileSync(destinationFile, destinationFilenot);
  console.log(`Copied file: ${destinationFile} -> ${destinationFilenot}`);
} catch (error) {
  console.error(`Error renaming file: ${error}`);
}
