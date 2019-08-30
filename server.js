const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')
const server = jsonServer.create()
const router = jsonServer.router('./db.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
const themesdb = JSON.parse(fs.readFileSync('./themes.json', 'UTF-8'))
server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
const SECRET_KEY = '123456789'
const expiresIn = '1h'
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
  
  return userdb.users.findIndex(user => user.name === username[0] && user.password === password) !== -1
}
function getTheme(domain){
  let key = themesdb.themes.findIndex(theme => theme.name == domain[1]) 
  if(key ==-1){
    return "default";
  }
   return themesdb.themes[key].name;
  // return themesdb.themes.findBy
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
    let theme = getTheme(username);
    res.status(200).json({"token": access_token, "theme":theme});
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
// server.use(function(req,res,next){setTimeout(next,2000)});
server.listen(3000, () => {
  console.log('Run Auth API Server')
})
