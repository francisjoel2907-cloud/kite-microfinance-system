import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User";
import generateToken from "../utils/generateToken";

/*
=========================
REGISTER USER
=========================
*/

export const registerUser = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      fullName,
      email,
      phone,
      location,
      role,
      password,
    } = req.body;

    /*
    CHECK REQUIRED FIELDS
    */

    if (
      !fullName ||
      !email ||
      !phone ||
      !location ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    /*
    CHECK IF USER EXISTS
    */

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /*
    HASH PASSWORD
    */

    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    /*
    CREATE USER
    */

    const user = await User.create({
      fullName,
      email,
      phone,
      location,
      role,
      password: hashedPassword,
    });

    /*
    RESPONSE WITH TOKEN
    */

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(
        user._id.toString(),
        user.role
      ),

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


/*
=========================
LOGIN USER
=========================
*/

export const loginUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    /*
    CHECK REQUIRED FIELDS
    */

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    /*
    FIND USER
    */

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    /*
    CHECK PASSWORD
    */

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    /*
    RETURN TOKEN
    */

    res.status(200).json({
      message: "Login successful",

      token: generateToken(
        user._id.toString(),
        user.role
      ),

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};