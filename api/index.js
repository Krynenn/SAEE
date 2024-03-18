const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Contact = require('./models/Contact');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest:'uploads/'});
const fs = require ('fs');



const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://samsamcoste:mXekpE51GJnG5bF8@cluster0.xjc6mfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

/*app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
    


    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length -1]; 
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
        const {Nom,Prenom,Numero} = req.body;
        await Contact.create({
        Nom,
        Prenom,
        Numero,
        Cover:newPath,
        Author: info.id,

    });

      });

    

    



});*/

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {Nom,Prenom,Numero} = req.body;
      const postDoc = await Contact.create({
        Nom,
        Prenom,
        Numero,
        Cover:newPath,
        Author:info.id,
      });
      res.json(postDoc);
    });
  
  });

  app.get('/post', async (req, res) => {
    const {token} = req.cookies;
    if (!token) {
      return res.status(401).json('Unauthorized');
    }
    jwt.verify(token, secret, async (err, info) => {
      if (err) {
        return res.status(401).json('Unauthorized');
      }
      try {
        const contacts = await Contact.find({ Author: info.id });
        res.json(contacts);
      } catch (error) {
        console.error(error);
        res.status(500).json('Server error');
      }
    });
  });



app.listen(4000);
//