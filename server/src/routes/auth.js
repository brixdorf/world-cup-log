"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Base attributes used for both set and clear — must be identical for the browser
// to match and delete the right cookie. path must be explicit (default is req.path,
// not '/', which would make set and clear use different paths across routes).
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const COOKIE_OPTS = { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 * 1000 };

function makeRouter() {
  const router = express.Router();

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const validUser = username === process.env.OWNER_USERNAME;
    // Always run compare even on wrong username to keep response time constant
    const hash =
      process.env.OWNER_PASSWORD_HASH ||
      "$2a$10$invalidhashplaceholder000000000000000000000000";
    const validPass = await bcrypt.compare(password, hash);

    if (!validUser || !validPass) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("token", token, COOKIE_OPTS);
    res.json({ ok: true });
  });

  // POST /api/auth/logout — no auth check; clearing a cookie is always safe
  router.post("/logout", (req, res) => {
    res.clearCookie("token", COOKIE_BASE);
    res.json({ ok: true });
  });

  // GET /api/auth/me — lightweight auth check (no body, just cookie)
  router.get("/me", (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.json({ authenticated: false });
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      res.json({ authenticated: true });
    } catch {
      res.json({ authenticated: false });
    }
  });

  return router;
}

module.exports = makeRouter;
