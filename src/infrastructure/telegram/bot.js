import TelegramBot from 'node-telegram-bot-api';
import express from "express"
import dotenv from "dotenv"
dotenv.config({})
import { TELEGRAM_BOT_TOKEN } from '../../config/env.js';
const app = express()
export const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("Bot has been started successfully");
app.get("/cohead", (req, res)=>{
    res.send({message:"Bot is working dude"})
})

app.listen(process.env.PORT|3000, ()=>{
    console.log("api is working ...")
})