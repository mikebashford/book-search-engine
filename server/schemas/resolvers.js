const { User, Book } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    user: async ({ user = null, params }, res) => {
      const foundUser = await User.findOne({
        $or: [
          { _id: user ? user._id : params.id },
          { username: params.username },
        ],
      });

      if (!foundUser) {
        return res
          .status(400)
          .json({ message: "Cannot find a user with this id!" });
      }

      res.json(foundUser);
    },
  },
  Mutation: {
    addUser: async ({ body }, res) => {
      const user = await User.create(body);

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken(user);
      res.json({ token, user });
    },
    login: async ({ body }, res) => {
      const user = await User.findOne({
        $or: [{ username: body.username }, { email: body.email }],
      });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(body.password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken(user);
      res.json({ token, user });
    },
    saveBook: async ({ user, body }, res) => {
      console.log(user);
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: body } },
          { new: true, runValidators: true }
        );
        return res.json(updatedUser);
      } catch (err) {
        console.log(err);
        return res.status(400).json(err);
      }
    },
  },
  deleteBook: async ({ user, params }, res) => {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $pull: { savedBooks: { bookId: params.bookId } } },
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Couldn't find user with this id!" });
    }
    return res.json(updatedUser);
  },
};

module.exports = resolvers;
