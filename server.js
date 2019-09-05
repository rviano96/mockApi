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
// setea el puerto  automaticamente o usa el 8080
var port =  process.env.PORT || 8080
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

function getTheme(domain){
  
  let key = db.themes.findIndex(theme => theme.name == domain) 
  if(key ==-1){
    return "default";
  }
   return db.themes[key].name;

}
function getRecibos(information){
  console.log("info: ", information);
  let username = information.domain.split('.')[0];
  let domain = information.domain.split('.')[1];
  let key = recibosdb.recibos.findIndex(recibos => recibos.name == username)
  let recibos = recibosdb.recibos[key].data;
  // console.log(recibos);
  return ({"data":recibos});
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
    res.status(200).json({"token": access_token, "theme":theme});
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
    res.status(200).json(getRecibos(analyzeToken(req.headers.authorization.split(' ')[1])));
  } catch (err) {
    // console.log("err: ", err);
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
