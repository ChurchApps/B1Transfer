const fs = require("fs");
const path = require("path");

const apphelperpPath = "./node_modules/@churchapps/apphelper/dist";

// Function to add .js extensions to relative imports
function addJsExtensions(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Add .js extension to relative imports/exports that don't already have an extension
  // Handle import statements
  content = content.replace(/from "(\.[^"]+?)"/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return `from "${importPath}index.js"`;
      } else if (importPath.endsWith("/helpers") || importPath.endsWith("/components") || importPath.endsWith("/hooks")) {
        return `from "${importPath}/index.js"`;
      } else {
        return `from "${importPath}.js"`;
      }
    }
    return match;
  });

  content = content.replace(/from '(\.[^']+?)'/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return `from '${importPath}index.js'`;
      } else if (importPath.endsWith("/helpers") || importPath.endsWith("/components") || importPath.endsWith("/hooks")) {
        return `from '${importPath}/index.js'`;
      } else {
        return `from '${importPath}.js'`;
      }
    }
    return match;
  });

  // Handle export statements
  content = content.replace(/export \* from "(\.[^"]+?)"/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return `export * from "${importPath}index.js"`;
      } else {
        return `export * from "${importPath}.js"`;
      }
    }
    return match;
  });

  content = content.replace(/export \* from '(\.[^']+?)'/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return `export * from '${importPath}index.js'`;
      } else {
        return `export * from '${importPath}.js'`;
      }
    }
    return match;
  });

  // Handle named exports
  content = content.replace(/export \{ [^}]+ \} from "(\.[^"]+?)"/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return match.replace(`from "${importPath}"`, `from "${importPath}index.js"`);
      } else {
        return match.replace(`from "${importPath}"`, `from "${importPath}.js"`);
      }
    }
    return match;
  });

  content = content.replace(/export \{ [^}]+ \} from '(\.[^']+?)'/g, (match, importPath) => {
    if (!importPath.includes(".js")) {
      if (importPath.endsWith("/")) {
        return match.replace(`from '${importPath}'`, `from '${importPath}index.js'`);
      } else {
        return match.replace(`from '${importPath}'`, `from '${importPath}.js'`);
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched: ${filePath}`);
  }
}

// Find all JS files and patch them
function patchDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      patchDirectory(fullPath);
    } else if (file.endsWith(".js")) {
      addJsExtensions(fullPath);
    }
  });
}

console.log("Patching @churchapps/apphelper ES module imports...");
patchDirectory(apphelperpPath);
console.log("Patching complete!");
