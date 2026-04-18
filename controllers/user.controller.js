import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const saveUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    const payload = {
      id: saveUser.id,
      email: saveUser.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "21d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 21 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Signed Up Successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userExist = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "No such User exist",
      });
    }

    if (await bcrypt.compare(password, userExist.password)) {
      const payload = {
        id: userExist.id,
        email: userExist.email,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "21d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 21 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login Successfull",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
