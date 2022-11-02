const express = require("express")
const bodyParser = require('body-parser')
const app = express();
const mysql = require("mysql")
const bcrypt = require("bcrypt")
const obj = require("./generateAccessToken.js")
const session = require('express-session');
const cookieParser = require("cookie-parser");

require("dotenv").config({
  path: "./conf.env"
})

app.use(cookieParser());
app.listen(process.env.PORT,
  () => console.log(`Server Started on port ${process.env.PORT}...`))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

app.use(session({
  secret: process.env.ACCESS_TOKEN_SECRET,
  resave: true,
  saveUninitialized: true
}));


const db = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
})

db.getConnection((err, connection) => {
  if (err) throw (err)
  console.log("DB connected successful: " + connection.threadId)
})


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
})


app.get("/dashboard", (req, res) => {
  if (req.session.loggedin && obj.verifyToken(req.cookies.jwt)) {
    res.sendFile(__dirname + '/public/dashboard.html');
  } else {
    // Not logged in
    res.redirect('/');
  }
})

app.post("/createUser", async (req, res) => {
  const user = req.body.username;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT * FROM user WHERE username = ?"
    const search_query = mysql.format(sqlSearch, [user])
    const sqlInsert = "INSERT INTO user VALUES (0,?,?)"
    const insert_query = mysql.format(sqlInsert, [user, hashedPassword])
    await connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      if (result.length != 0) {
        connection.release()
        res.sendStatus(409)
      } else {
        await connection.query(insert_query, (err, result) => {
          connection.release()
          if (err) throw (err)
          res.sendStatus(201)
        })
      }
    })
  })
})


//LOGIN (AUTHENTICATE USER, and return accessToken)
app.post("/login", (req, res) => {
  const user = req.body.username
  const password = req.body.password
  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "Select * from user where username = ?"
    const search_query = mysql.format(sqlSearch, [user])
    await connection.query(search_query, async (err, result) => {
      connection.release()
      if (err) throw (err)
      if (result.length == 0) {
        console.log("--------> User does not exist")
        res.sendStatus(404)
      } else {
        const id = result[0].id_user
        const hashedPassword = result[0].password
        //get the hashedPassword from result
        if (await bcrypt.compare(password, hashedPassword)) {
          console.log("---------> Login Successful")
          console.log("---------> Generating accessToken")
          const token = obj.generateAccessToken({
            user: req.body.username
          })
          req.session.loggedin = true
          req.session.username = user
          res.cookie('jwt', token, {
            httpOnly: true,
            secure: true
          });
          res.cookie('id', id)
          res.cookie('username', user)
          res.status(201)
          res.redirect('/dashboard')
        } else {
          res.send("Password incorrect!")
        }
      }
    })
  })
})

app.post("/getNote", (req, res) => {
  if (obj.verifyToken(req.cookies.jwt)) {
    var user = req.body.id;
    db.getConnection(async (err, connection) => {
      if (err) throw (err)
      const sqlSearch = "SELECT * FROM note WHERE id_user = ?"
      const search_query = mysql.format(sqlSearch, [user])
      await connection.query(search_query, async (err, result) => {
        if (err) throw (err)
        console.log("Search Results")
        if (result.length != 0) {
          connection.release()
          console.log("List Notes:")
          console.log(result)
          res.status(201).json(result)
        } else {
          console.log("Not Found:")
          res.status(404).json(result)
        }
      })
    })
  } else {
    res.status(500).json(result)
  }
});



app.post("/addNote", (req, res) => {
  if (obj.verifyToken(req.cookies.jwt)) {
    const desc = req.body.desc
    const id = req.body.id
    db.getConnection(async (err, connection) => {
      if (err) throw (err)
      const sqlInsert = "INSERT INTO note VALUES (0,?,?)"
      const insert_query = mysql.format(sqlInsert, [desc, id])
      await connection.query(insert_query, (err, result) => {
        connection.release()
        if (err) throw (err)
        res.sendStatus(201)
      })
    })
  } else {
    res.status(500).json(result)
  }
})

app.delete("/deleteNote", (req, res) => {
  if (obj.verifyToken(req.cookies.jwt)) {
    var id_note = req.body.id_note;
    var id_user = req.body.id_user;
    db.getConnection(async (err, connection) => {
      if (err) throw (err)
      const sqlDelete = "DELETE FROM note WHERE id_note = ? AND id_user=?"
      const delete_query = mysql.format(sqlDelete, [id_note, id_user])
      await connection.query(delete_query, async (err, result) => {
        if (err) throw (err)
        console.log("Search Results")
        res.json("deleted")
      })
    })
  } else {
    res.status(500).json(result)
  }
})


app.delete("/logout", (req, res) => {
  req.session.destroy();
  res.statusCode = 200;
  res.send({
    success: true
  });
})