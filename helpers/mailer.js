const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: 'pgr0101mm@gmail.com', // using .env files and also handling lesssecure
           pass: 'pgr1110098'
       }
    }
);


module.exports.sendMail = function(message ,cb){
    transporter.sendMail(message , cb);
};

module.exports.messageOfForgot = function(username, email, link){
    // TODO : creating mail to send for forgot password request
    // i will return a special code for you to change your password
    return {
        from: '"Zero bits" <zerobits0101@gmail.com>', // sender address
        to: email, // list of receivers
        subject: 'Code to change pwd✔', // Subject line
        text: 'Hello dear '+ username, // plain text body
        html: '<h3>This message is for changing your password</h3>' +
              '<h5>your password changed to '+ link +' you can chang it later</h5>' // html body
    };
};

module.exports.messageOfVerify = function(username, email, link){
    return {
        from: '"Zero bits" <zerobits0101@gmail.com>', // sender address
        to: email, // list of receivers
        subject: 'verify ✔', // Subject line
        text: 'Hello dear '+ username, // plain text body
        html: '<h3>This message is for verifying</h3>' +
              '<h5>click <a href="'+link+'">this link</a> to verify.</h5>' // html body
    };
};