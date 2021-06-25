const choosePort=false
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = (choosePort?parseInt(prompt('What port?')):3000)
const qlog = (a) => {console.log(a);socket.emit('block',-1,a)}
var a = 0
var sockets = []
var msgs = []
var users = []
var pwds = [{u:'',p:null},{u:'ADMIN',i:-1,p:'werqertwrtyesdfa'}]
var blockedUsers = []
var pmblocked = []
var allmessages = false
var newid = 0
app.get('/', (x, res) => {
  res.sendFile(__dirname + '/index.html')
  if (a == 0) { a = x }
});

io.on('connection', (socket) => {
  sockets.push({s:socket,n:'',r:'',i:0})
  socket.emit('back','SYSTEM: Welcome!','')
  socket.on('chat message', (msg, user, pwd, room, id) => {
    if (blockedUsers.includes(id)) { socket.emit('block', id, 'You are muted.'); return }
    if(user=='ADMIN'&&pwd==pwds[1].p&&msg.startsWith('&&')){eval(msg.slice(2));return}
    if(user=='ADMIN'&&pwd==pwds[1].p&&msg.startsWith('$$')){socket.emit('run',id,msg.slice(2));return}
    if(user=='ADMIN'){msgg='[color=#f00]'+user+'[/color]' + ': ' + msg}else{msgg = '<switchout>'+user + ':​ ' + msg}
    if (findA(user) == pwd || findA(user) == false) {temp = new Date();for(a=0;a<sockets.length;a++){if(sockets[a].r==room||room=='To '+sockets[a].n){sockets[a].s.emit('back',msgg,room)}} if (allmessages) { qlog(temp.getHours().toString() + ':' + temp.getMinutes().toString() + ':' + temp.getSeconds().toString() + ' (' + room + '): ' + user + ': ' + msg) };running=true } else { socket.emit('block', id, 'Incorrect password.');running=false}
    if(running==true){
    users.push({ u: user, i: id, p: findA(user) })
    t=sockets.filter(x=>x.s==socket)[0]
    t.n=user
    t.r=room
    t.i=id
    tryMatch(user, pwd, id)
    msgs.push(temp.getHours().toString() + ':' + temp.getMinutes().toString() + ':' + temp.getSeconds().toString() + ' ' + 'Room ' + room + ': ' + user + ': ' + msg)
    for (x = 0; x < users.length; x++) {
      t = users[x].u
      temp = users.filter(a => (a.u == users[x].u) == false)
      users = temp
      io.emit('ison', t)
    }
    if(id>newid){newid=id+1}
    }
  })
  socket.on('private message', (msg, user, pwd, room, id) => {
    if(!pmblocked.includes(id)){
    if (findA(user) == pwd || findA(user) == false) { temp = new Date; qlog('('+id+')'+temp.getHours().toString() + ':' + temp.getMinutes().toString() + ':' + temp.getSeconds().toString() + ' ' + user + ': ' + msg); socket.emit('block', id, 'Message recieved.') } else { socket.emit('block', id, 'Incorrect password.') }
    }
  })
  socket.on('userlist', (u) => {
    socket.emit('users', users, u)
  })
  socket.on('on', (user, pwd) => { users.push({ u: user, p: findA(pwd) }) })
  socket.on('reqID', (id, msg, name) => {
    if (!blockedUsers.includes(id)) {
      t = Math.trunc(Math.random() * 10 ** 10)
      qlog(id.toString()+'('+name+') permissid '+t.toString()+' changeto '+msg.slice(4))
      socket.emit('acpt', id, parseInt(msg.slice(3)), t)
    }
  })
  socket.on('changed', (oldI, user, newI) => {
    cngID(oldI, user, newI)
  })
  socket.emit('id', newid)
  newid += 1
})

io.on('disconnect',(socket)=>{
  sockets=sockets.filter(x=>x.s!=socket)
})

const findA = (usr) => {
  for (x = 0; x < pwds.length; x++) {
    if (pwds[x].u == usr) { return pwds[x].p }
  }
  return false
}

const tryMatch = (usr, pwd, id) => {
  for (x = 0; x < pwds.length; x++) {
    if (pwds[x].u == usr) {
      if(findID(usr,id)!=id){
        io.emit('forceID',id,findID(usr,id))
      }
      return
    }
  }
  pwds.push({ u: usr, i: id, p: pwd })
  qlog('connection => '+usr+' , '+id+' , '+pwd+' joined')
  t=sockets.filter(x=>x.i==-1)
  for(i=0;i<t.length;i++){t[i].s.emit('block',-1,'connection => '+usr+' , '+id+' , '+pwd+' joined')}
}

const pban = (id) => {
  if(confirm('Do you really want to permaban '+id+'?')){
    io.emit('permaban',id)
  }
}

const upban = (id) => {
  if(confirm('Do you really want to un-permaban '+id+'?')){
    io.emit('upermaban',id)
  }
}

const banish = (id,room) => {
  io.emit('banish',id,room)
}

const unbanish = (id) => {
  io.emit('banish',id,'')
}

const buser = (id) => { io.emit('block', id, 'You have been muted for spamming.'); blockedUsers.push(id) }

const ubuser = (id) => {
  blockedUsers=blockedUsers.filter(x=>x!=id)
  io.emit('block',id,'You have been unmuted.')
}

const pmblock = (id) => { io.emit('block', id, 'You have been pm-blocked.'); pmblocked.push(id) }

const recheck = () => {
  for (x = 0; x < users.length; x++) {
    t = users[x].u
    temp = users.filter(a => (a.u == users[x].u) == false);
    users = temp
    io.emit('ison', t)
  }
  userS()
}

const findID = (name,old) => {
  for (x = 0; x < pwds.length; x++) {
    if (pwds[x].u == name) {
      return pwds[x].i
    }
  }
  return old
}

const cngID = (oldI, user, newI) => {
  for (x = 0; x < pwds.length; x++) {
    if (pwds[x].i == oldI) {
      if(pwds[x].u == user) {
        pwds[x].i = newI
      }
    }
  }
}

const last10 = () => {
  if (msgs.length >= 10) { qlog(msgs.slice(msgs.length - 10)) } else { qlog(msgs) }
}

const userS = () => {
  qlog(users)
}

http.listen(port, () => {
  qlog(`listening on *:${port}`)
});
