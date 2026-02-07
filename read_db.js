const fs = require('fs');
try {
    // Read file assuming utf16le which D1 json output usually is on Windows
    const content = fs.readFileSync('temp_details.json', 'utf16le');
    console.log("--- START FILE CONTENT ---");
    console.log(content.substring(0, 2000)); // Print first 2000 chars to debug
    console.log("--- END FILE CONTENT ---");
} catch (e) {
    console.error("Error reading file:", e);
}
