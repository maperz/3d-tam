var express = require("express");
var path = require("path");

var app = express();

var staticPath = path.join(__dirname, "/static");
app.use(express.static(staticPath));

var buildPath = path.join(__dirname, "/build");
app.use("/js", express.static(buildPath));

app.use(express.static(__dirname));

app.get("/", function (req, res) {
    res.sendFile("html/index.html", { root: staticPath });
});

var port = 3000;
console.log("Starting server -- listening on 'localhost:" + port + "'");

app.listen(port);
