// const { initializeApp, cert } = require("firebase-admin/app");
// import { getAuth, } from "firebase-admin/auth";
// import { getFirestore } from "firebase-admin/firestore";

import { initializeApp } from "firebase-admin/app";

// import admin from '/firebase-admin'
import dotenv from 'dotenv'
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
dotenv.config()


const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
});





export const ft = admin.firestore()
export const at = admin.auth()

