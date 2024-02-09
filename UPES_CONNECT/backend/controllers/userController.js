const UserModel = require('../models/userModel');
const bcrypt = require("bcrypt");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");

class UserController {
  static async registerUser(req, res) {
    const validate = (data) => {
      const schema = Joi.object({
        username: Joi.string().required().label("User Name"),
        secret: passwordComplexity().required().label("Password"),
        email: Joi.string().email().required().label("Email"),
        first_name: Joi.string().regex(/^[a-zA-Z]+$/).required().label("First Name"),
        last_name: Joi.string().regex(/^[a-zA-Z]+$/).required().label("Last Name"),

      });
      return schema.validate(data);
    };
    const { username, secret, email, first_name, last_name } = req.body;
    try {
      const { error } = validate(req.body);
      if (error)
        return res.status(400).send({ message: error.details[0].message });
      const createdUser = await UserModel.createUser(username, secret, email, first_name, last_name);
      res.status(201).json(createdUser);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  }

  static async loginUser(req, res) {
    const validate = (data) => {
      const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        secret: Joi.string().required().label("Password"),
        username: Joi.string().required().label("Username"),
      });
      return schema.validate(data);

    };
    const { email, username, secret } = req.body;
    try {
      const { error } = validate(req.body);
      if (error)
        return res.status(400).send({ message: error.details[0].message });
      const user = await UserModel.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (email != user.email.S) {
        return res.status(401).json({ error: 'Incorrect mail address' });
      }
      const validPassword = await bcrypt.compare(
        secret,
        user.secret.S
      );
      if (!validPassword) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = jwt.sign({ userId: user.userId.S, username }, "125jhhabhay");
      res.status(200).json({ data: token, message: 'Login successful' });

      // res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error logging in' });
    }
  }
}

module.exports = UserController;
