const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const adminHandler = require("./lib/handlers/adminHandler");
const userHandler = require("./lib/handlers/userHandler");

const httpServer = http.createServer((req, res) => {
  const parsedurl = url.parse(req.url, true);
  const pathname = parsedurl.pathname;
  const trimedPath = pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toLowerCase();
  const queryStringObj = parsedurl.query;
  const headers = req.headers;

  const decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const parsedPayload = buffer !== "" ? JSON.parse(buffer) : {};

    const data = {
      trimedPath: trimedPath,
      query: queryStringObj,
      method: method,
      headers: headers,
      payload: parsedPayload,
    };

    const chosenHandler =
      typeof router[trimedPath] !== "undefined"
        ? router[trimedPath]
        : router.notfound;

    //use the chosen handler to handle the request
    chosenHandler(data, (statusCode, result) => {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      result = typeof res === "object" ? result : {};

      const responseObj = JSON.stringify(result);

      res.setHeader("Content-type", "application/json");
      res.writeHead(statusCode);

      res.write(responseObj);
      res.end();

      console.log(
        `the url visited was, ${trimedPath} and the method is ${method}`
      );
    });
  });
});

//start listening on port 8080
httpServer.listen(8080, () => {
  console.log("server is listening on port 8080");
});

const router = {
  ping: adminHandler.ping,
  books: adminHandler.Books,
  notfound: adminHandler.notfound,
  register: userHandler.userRegister,
  "user/request_book": userHandler.requestBook,
  "user/return_book": userHandler.returnBook,
};
