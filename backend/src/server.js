import express from "express"
import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import passport from "passport"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.use(
    cors({
        origin:process.env.FRONTEND_URL,
        credentials:true
    })
)

//Passport 
app.use(passport.initialize());

app.use(passport.session());

app.listen(process.env.PORT,()=>console.log("Server is running"))
