const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')
const server = jsonServer.create()
const router = jsonServer.router('./db.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
const db = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'))
const themesdb = JSON.parse(fs.readFileSync('./themes.json', 'UTF-8'))
const recibosdb = JSON.parse(fs.readFileSync('./recibos.json', 'UTF-8'))
server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
var test = false;
// setea el puerto  automaticamente o usa el 8080
if(test){
  var port =  8080
}else{
  var port =  process.env.PORT || 8080
}

const SECRET_KEY = '123456789'
const expiresIn = '1h'
var tokenParsed = ""
// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({username, password}){
  return db.users.findIndex(user => user.name === username[0] && user.password === password) !== -1
}
function getPin(name){
  let key = db.pins.findIndex(pin => pin.name == name)
  return db.pins[key].pin;
}
function getTheme(domain){
  
  let key = db.themes.findIndex(theme => theme.name == domain) 
  if(key ==-1){
    return "default";
  }
   return db.themes[key].name;

}
function getRecibos(information){
  // console.log("info: ", information);
  let username = information.domain.split('.')[0];
  let domain = information.domain.split('.')[1];
  let key = db.recibos.findIndex(recibos => recibos.name == username)
  return db.recibos[key].data;
  // console.log(recibos);
  // return ({"data":recibos});
}
function signReciept(information,pin){
  let username = information.domain.split('.')[0];
  let key = db.pins.findIndex(pin => pin.name == username)
  return db.pins[key].pin == pin;
}
function generatePin(information,pin){
  let username = information.domain.split('.')[0];
  let key = db.pins.findIndex(pin => pin.name == username);
  //console.log(db.pins[key].pin);
  return db.pins[key].pin != pin;
}
function getRecibo(information, date){
  let data = getRecibos(information);
  console.log(data);
  let key = data.findIndex(recibo => recibo.date == date)
  console.log(data[key]);
  return data[key]
  //let recibo = data.
}

function getAllThemes(){
  return db.themes;
}
function analyzeToken(token){
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err);
}
server.post('/login', (req, res) => {
    const {domain, password} = req.body
    // console.log("headers: ", req.body)
    let username = domain.split('.');
    if (isAuthenticated({username, password}) === false) {
      const status = 401
      const message = 'Incorrect domain or password'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({domain, password})
    // console.log(getTheme(username))
    let theme = getTheme(username[1]);
    let pin = getPin(username[0]);
    res.status(200).json({"token": access_token, "theme":theme, "pin":pin});
  })

server.get('/recibos', (req, res) =>{
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
  }
  try {
    verifyToken(req.headers.authorization.split(' ')[1])
    //console.log(req.param("month"));
    if(req.param("month")){
      //console.log(req.param("month"));
      let recibo = getRecibo(analyzeToken(req.headers.authorization.split(' ')[1]), req.param("month"))
      res.status(200).json(recibo);
    }else{
      let data = getRecibos(analyzeToken(req.headers.authorization.split(' ')[1]));
          //console.log(data);
          let date = [];
          data.forEach(recibo => {
            //console.log(recibo.date)
            date.push({"id": recibo.id, "date": recibo.date, "status": recibo.status});
          });
          res.status(200).json(date);
    }
    
  } catch (err) {
    // console.log("err: ", err);
    const status = 401
    const message = 'Error: access_token is not valid'
    return res.status(status).json({status, message})
  }
  
})
server.post('/recibos', (req, res) =>{
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
  }
  try {
    const {month, pin} = req.body
    verifyToken(req.headers.authorization.split(' ')[1])
    //console.log(req.param("month"));
      //console.log(req.param("month"));
      let signOK = signReciept(analyzeToken(req.headers.authorization.split(' ')[1]), pin)
      if (signOK){
        const status = 200;
        const message = 'Receipt signed'
        res.status(status).json({status, message});
      }
      else{
        const status = 401;
        const message = 'Pin is not valid'
        res.status(401).json({status, message});
      }
    }
     catch (err) {
    console.log("err: ", err);
    const status = 401
    const message = 'Error: access_token is not valid'
    return res.status(status).json({status, message})
  }
  
})
server.post('/pin', (req, res) =>{
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
  }
  try {
    const {pin} = req.body
    verifyToken(req.headers.authorization.split(' ')[1])

      let pinOk = generatePin(analyzeToken(req.headers.authorization.split(' ')[1]), pin)
      if (pinOk){
        const status = 200;
        const message = 'Pin Generado'
        res.status(status).json({status, message});
      }
      else{
        const status = 401;
        const message = 'Pin is not valid'
        res.status(401).json({status, message});
      }
    }
     catch (err) {
    console.log("err: ", err);
    const status = 401
    const message = 'Error: access_token is not valid'
    return res.status(status).json({status, message})
  }
  
})
server.get('/themes', (req, res)=>{
    console.log(Object.keys(req.params).length);
    const name = req.params
    console.log(name)
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
      const status = 401
      const message = 'Bad authorization header'
      res.status(status).json({status, message})
      return
    }
    try {
      verifyToken(req.headers.authorization.split(' ')[1])
      if(Object.keys(req.body).length === 0){
        res.status(200).json(getAllThemes());
      }else{
        res.status(200).json(getTheme(name));
      }
    } catch (err) {
      
      const status = 401
      const message = 'Error: access_token is not valid'
      return res.status(status).json({status, message})
    }
    
})

  server.use(/^(?!\/auth).*$/,  (req, res, next) => {
    // console.log("headers:" , req.headers);
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
      const status = 401
      const message = 'Bad authorization header'
      res.status(status).json({status, message})
      return
    }
    try {
       verifyToken(req.headers.authorization.split(' ')[1])
       next()
    } catch (err) {
      const status = 401
      const message = 'Error: access_token is not valid'
      res.status(status).json({status, message})
    }
  })
server.use(router)
server.listen(port, () => {
  console.log('Run Auth API Server')
})
