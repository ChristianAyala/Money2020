/**
 * Created by Chris on 11/1/14.
 */
var express = require("express");

var app = express();

app.use(express.static(__dirname + "/client"));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});