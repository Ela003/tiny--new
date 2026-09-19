const fs = require("fs");
const https = require("https");
const path = require("path");
const url = require("url");

const root = __dirname;
const certificatePath = path.join(root, "..", "certs", "localhost.pfx");
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "application/javascript",
};

const server = https.createServer({
  pfx: fs.readFileSync(certificatePath),
  passphrase: process.env.LOCAL_HTTPS_PASSWORD || "local-dev",
}, (request, response) => {
  const requestedPath = url.parse(request.url).pathname;
  const relativePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(root, relativePath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "text/plain",
    });
    response.end(content);
  });
});

server.listen(5173, "0.0.0.0", () => {
  console.log("HTTPS frontend running at https://127.0.0.1:5173");
});