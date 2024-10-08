const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Default admin for development stage
db.User.find().exec(function (err, results) {
  if (err) {
    console.error("Error fetching users:", err);
    return;
  }
  var count = results.length;

  if (count === 0) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error("Error generating salt:", err);
        return;
      }
      bcrypt.hash("abc", salt, (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          return;
        }

        const user = new db.User({
          email: "imt_2018109@iiitm.ac.in",
          password: hash,
          isVerified: true,
        });

        user.save((err) => {
          if (err) {
            console.error("Error saving default admin:", err);
          }
        });
      });
    });
  }
});

// Validating email address and domain
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email) && email.endsWith("@iiitm.ac.in");
}

const addAdmin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.User.findOne({ email }, (err, foundUser) => {
    if (err) return res.status(400).json({ message: "Bad request, try again" });

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "You can only add admins with an iiitm.ac.in email domain",
      });
    }

    if (foundUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.status(500).json({ message: "Error generating salt" });

      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return res.status(500).json({ message: "Error hashing password" });

        const newUser = { email, password: hash };

        db.User.create(newUser, (err, createdUser) => {
          if (err) return res.status(500).json({ message: "Error creating user" });

          jwt.sign(
            { id: createdUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "10h" },
            (err, token) => {
              if (err) return res.status(403).json({ message: "Access forbidden" });

              return res.status(200).json({ message: "Admin added successfully", token });
            }
          );
        });
      });
    });
  });
};

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter both email and password" });
  }

  db.User.findOne({ email }, (err, foundUser) => {
    if (err) return res.status(500).json({ message: "Error finding user" });

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Use iiitm.ac.in domain for login" });
    }

    if (!foundUser) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    bcrypt.compare(password, foundUser.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: "Error comparing passwords" });

      if (!isMatch) {
        return res.status(400).json({ message: "Email or password is incorrect" });
      }

      jwt.sign(
        { id: foundUser._id, email: foundUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "10h" },
        (err, token) => {
          if (err) return res.status(403).json({ message: "Access forbidden" });

          return res.status(200).json({ token, userId: foundUser._id });
        }
      );
    });
  });
};
