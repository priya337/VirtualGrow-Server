const router = require("express").Router();
const bcryptjs = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const UserModel = require ("../models/User.model.js")


router.post("/signup", async (req, res) => {
    console.log("here is the req.body", req.body)
    try {
        const salt = bcryptjs.genSaltSync(12)
        const hashedPassword= bcryptjs.hashSync(req.body.password, salt)
        const hashedUser= {
          ...req.body,
            password: hashedPassword,
        }
        const userCreated = await UserModel.create(hashedUser)
        console.log("user created", userCreated)
        res.status(201).json({message: "User has been create", userCreated})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Error creating a user"})
    }
  
});

router.post("/login", async (req, res) => {
    try {
      const foundUser = await UserModel.findOne({ email: req.body.email });
      if (!foundUser) {
        res.status(403).json({ message: "Invalid login info" });
      } else {
        const doesThePasswordsMatch = bcryptjs.compareSync(
          req.body.password,
          foundUser.password
        )
        console.log("password match?", doesThePasswordsMatch)
        res.status(200).json({message: "password matches"});
        if (doesThePasswordsMatch) {
          
          const data = {
            _id: foundUser._id,
            name: foundUser.name 
          };
  
          const authToken = jwt.sign(data, process.env.TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "2h",
          });
  
          console.log("The authToken", authToken);
          res.status(200).json({ message: "successful login", authToken });
        } else {
          res.status(403).json({ message: "Invalid Credentials" });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error logging in the user" });
    }
  });

module.exports = router;
