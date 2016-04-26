var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var Busboy = require('busboy');

var MAX_SIZE = 1e8;

http.createServer(function(req, res) {
  if (req.url === '/api/submit' && req.method === 'POST') {
    var busboy = new Busboy({
      headers: req.headers,
      limits: {fileSize: MAX_SIZE / 10} // why!?
    });
    var fileSize = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mime) {
      file.on('data', function(data) {
        fileSize += data.length;
        file.resume();
      });
    
      file.on('limit', function() {
        req.unpipe(busboy);
        res.writeHead(413, {'Connection': 'close'});
        res.end('File size limit of ' + MAX_SIZE / 10e6 + ' MB reached');
      });
    
      file.on('end', function() {
        res.writeHead(200, {'Content-Type': 'text/json'});
        res.end(JSON.stringify({
          fileName: filename,
          encoding: encoding,
          mimeType: mime,
          bytes: fileSize
        }));
      });
    });

    req.pipe(busboy);
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
}).listen(process.env.PORT || 8000);
