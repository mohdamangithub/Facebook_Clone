const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");

const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `954839829198-shf2ilr88o83nheroo54rfugc74uoc4v.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//046rZeVnVDR4kCgYIARAAGAQSNwF-L9IrkwkmcSvNRwnVEe9jKr9W_tw5sdTRpgLgpQ4ZoZfdGeGdq5ME5JGm2kn29weVU4jDdkw`;


const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
authClient.setCredentials({refresh_token: REFRESH_TOKEN});

 async function mailer(receiver, id, key){
    try{
        const ACCESS_TOKEN = await authClient.getAccessToken();
        const transport = nodemailer.createTransport({
             service: "gmail",
             auth: {
                type: "OAuth2",
                user: "mansooriaman025@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
             }
        })
        const details = {
            from: `Mohammad Aman <mansooriaman025@gmail.com>`,
            to: receiver,
            subject: "Facebook Clone Password Reset",
            text: "aur kuch kuchhhhhh",
            html: `hey you can reset your Facebook account password by clicking this button &nbsp;&nbsp;&nbsp;&nbsp;<a style="text-decoration: none; color: #fff; padding: 10px 30px; margin-top: 30px; border-radius: 20px; letter-spacing: 0.5px; font-weight: 500; background-color: royalblue; font-size: 20px;" href ="http://localhost:3000/forgot/${id}/${key}">Reset</a>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch(err){
        return err;
    }
 }


// mailer().then(function(a){
//     console.log("sent mail", a)
// })
  

module.exports = mailer;