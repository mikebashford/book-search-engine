const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    user: async (parent, args, context) => {
      if (context.user) {
        const foundUser = await User.findOne({
          _id: context.user._id,
        });

        return foundUser;
      }
      throw new AuthenticationError("Not logged in");
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: User._id },
          { $push: { savedBooks: args } },
          { new: true }
        );
        return updatedUser;
      }
    },
    deleteBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: User._id },
          { $pull: { savedBooks: { bookId: args } } },
          { new: true }
        );
        return updatedUser;
      }
    },
  },
};

module.exports = resolvers;
