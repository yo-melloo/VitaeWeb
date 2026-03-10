const fs = require("fs");
const path = require("path");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Fix: const API = "import.meta.env.VITE_API_URL"; -> const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
  content = content.replace(
    /["']import\.meta\.env\.VITE_API_URL["']/g,
    'import.meta.env.VITE_API_URL || "http://localhost:8080"',
  );

  // Fix: fetch("import.meta.env.VITE_API_URL/api/...") -> fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/...`)
  content = content.replace(
    /["']import\.meta\.env\.VITE_API_URL(\/api\/[^"']+)["']/g,
    '`${import.meta.env.VITE_API_URL || "http://localhost:8080"}$1`',
  );

  // Fix: fetch(`import.meta.env.VITE_API_URL/api/...`) -> fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/...`)
  content = content.replace(
    /`import\.meta\.env\.VITE_API_URL(\/api\/[^`]+)`/g,
    '`${import.meta.env.VITE_API_URL || "http://localhost:8080"}$1`',
  );

  // Make sure we didn't mess up existing correct template literals if they were partially replaced.
  // If the regex caught them, great.

  if (original !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".jsx") || fullPath.endsWith(".js")) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory(path.join(__dirname, "src"));
console.log("Done!");
