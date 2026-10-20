import { createServer } from "node:http";

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ name: "{{name}}", status: "ok" }));
});

server.listen({{port}}, () => {
  console.log("App running on http://localhost:{{port}}");
});
