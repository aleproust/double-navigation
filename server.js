var server_port = process.env.PORT || 8082
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
var server_baseurl = "https://double-navigation.herokuapp.com/";
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connections = [];

function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/mobile', function(req, res){
  res.sendFile(__dirname + '/mobile.html');
});

io.on('connection', function(socket){
  // When TV ask for à new QR Code
  socket.on('tv-get-qr', function(msg){
    var r = randomString(20);
    var connection = {
        id: r,
        socket_tv: socket.id,
        socket_mobile: null,
        url: (server_baseurl+"/mobile?qr=" + r + "&test=32")
    };
    console.log(connection);
    connections.push(connection);
    if(connections.length>10) connections.splice(0, (10-connections.length));
    socket.emit("tv-receive-qr",connection.url);
  });
  
  
  socket.on('mobile-infos', function(infos){
      for(var i=0;i<connections.length;i++) {
         if(socket.id==connections[i].socket_mobile) { 
            io.sockets.connected[connections[i].socket_tv].emit("tv-infos",infos); 
         }
      }
  });
  
  socket.on('mobile-end', function(){
      for(var i=0;i<connections.length;i++) {
         if(socket.id==connections[i].socket_mobile) { 
            io.sockets.connected[connections[i].socket_tv].emit("tv-end"); 
         }
      }
  });
  
  socket.on('mobile-attach', function(qr){
      console.log("QR :"+qr);
      
      for(var i=0;i<connections.length;i++) {
          console.log(connections[i].id);
          if(connections[i].id==qr) {
              connections[i].socket_mobile = socket.id;
              console.log("socket_tv :"+connections[i].socket_tv);
              console.log("socket_mobile :"+connections[i].socket_mobile);
              
              // Send to tv and mobile
              socket.emit("mobile-attach-success");
              io.sockets.connected[connections[i].socket_tv].emit("tv-attach-success");
          }
      }
      
  });
});

http.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", server_port " + server_port )
});
