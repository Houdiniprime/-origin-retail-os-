const http = require("http");
const { server } = require("./server");

function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8099${pathname}`, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

server.listen(8099, "127.0.0.1", async () => {
  try {
    const app = await get("/app.html");
    const js = await get("/assets/app.js");
    const css = await get("/assets/app.css");
    const wa = await get("/api/whatsapp/status");
    if (app.status !== 200 || !app.body.includes("assets/app.js")) throw new Error("app.html failed");
    if (js.status !== 200 || !js.body.includes("Origin Retail OS")) throw new Error("app.js failed");
    if (css.status !== 200 || !css.body.includes(".app-shell")) throw new Error("app.css failed");
    if (wa.status !== 200 || !wa.body.includes("status")) throw new Error("whatsapp status api failed");
    console.log("smoke-test-ok");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
