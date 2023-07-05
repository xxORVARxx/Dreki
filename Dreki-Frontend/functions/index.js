'use strict'; // WHOLE-SCRIPT STRICT MODE SYNTAX.

// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// Nodemailer is a module to allow email sending within Node.js applications.
const nodemailer = require("nodemailer"); // npm install nodemailer


/*
 * FunctionsErrorCodeCore: 
 * 'ok', 'cancelled', 'unknown', 'invalid-argument', 'deadline-exceeded', 'not-found'
 * 'already-exists', 'permission-denied', 'resource-exhausted', 'failed-precondition'
 * 'aborted', 'out-of-range', 'unimplemented', 'internal', 'unavailable', 'data-loss'
 * 'unauthenticated'
*/


// Call functions from your app:
exports.createFirePermit = functions.https.onCall(async (data, context) => {
  functions.logger.log('From createFirePermit.', process.env.USER);

  // Checking data from frontend:
  const applicant_email = data.email;
  const fire_pattern = data.fire_pattern;
  // Checking attribute.
  if (!(typeof applicant_email === 'string') || applicant_email.length === 0) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with this argument: "email".');
  }
  if(!(typeof fire_pattern === 'object') || !fire_pattern.blow_s || !fire_pattern.cooldown_s || !fire_pattern.repeats) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with this argument: "fire_pattern".\n "fire_pattern={blow_s,cooldown_s,repeats}".');
  }
  functions.logger.log("Applicant's email:", applicant_email, "\tFire-pattern:", fire_pattern);


  // Checking that the user is authenticated:
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', '(user not signed-in) The function must be called while authenticated.');
  }
  const uid = context.auth.uid;
  functions.logger.log('User ID:', uid);

  // Checking that the user is admin.
  const isAdmin = await admin.firestore().collection('admin').doc(uid).get();
  functions.logger.log('isAdmin:', isAdmin);
  if (!isAdmin.exists) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('permission-denied', '(user not admin) Only admin allowed to call this function.');
  }


  // Create the fire permit:
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('permits').add({
    email: applicant_email.toLowerCase(),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    blow_s: fire_pattern.blow_s,
    cooldown_s: fire_pattern.cooldown_s,
    repeats: fire_pattern.repeats
  });
  const permitID = writeResult.id;
  functions.logger.log('Permit ID:', permitID);
  

  // Sending the email using NodeMailer:
  // create reusable transporter object using the default SMTP transport:
  let transporter = nodemailer.createTransport({
    name: 'smtp.gmail.com',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.USER, // <- Gmail which email is sent from.
      pass: process.env.PASS // <- special Gmail password called 'App Password'.
    }
  });

  // send mail with defined transport object:
  let info = null;
  try{
    info = await transporter.sendMail({
      from: '"DREKI" <dreki.raufarhofn@gmail.com>', //<- sender address.
      to: applicant_email, //<- list of receivers.
      subject: "Spúa Eldi? | Breathe Fire?", //<- Subject line.
      html: 
      '<div style="text-align: center; width: 95%; background: #333; color: #fff; padding: 5vw 10px;">\
      <h1 style="color: #d35536;">Halló!</h1>\
      <span>Hér er <b>netfangið</b> ásamt <b>auðkenninu</b> sem þú þarft til að drekinn spúi eldi:</span>\
      <div style="width: min-content; margin: 5px auto; padding: 10px; border: 5px solid #d35536;"> <p>'+ applicant_email +'</p> <p>'+ permitID +'</p> </div>\
      <span>Smelltu <b><a href="https://dreki-19662.web.app?lang=is&permit='+ permitID +'">hér</a></b> til að komast á vefsíðu drekans, til að spúa!</span>\
      <p>Takk fyrir og eigðu góðan dag!</p></div>\
      <div style="height: 5vw;"></div>\
      <div style="text-align: center; width: 95%; background: #333; color: #fff; padding: 5vw 10px;">\
      <h1 style="color: #d35536;">Hello!</h1>\
      <span>Here is the <b>email</b> and <b>ID number</b> you need to make the dragon breathe fire:</span>\
      <div style="width: min-content; margin: 5px auto; padding: 10px; border: 5px solid #d35536;"> <p>'+ applicant_email +'</p> <p>'+ permitID +'</p> </div>\
      <span>Click <b><a href="https://dreki-19662.web.app?lang=en&permit='+ permitID +'">here</a></b> for Dreki’s website, where you can find the fire button!</span>\
      <p>Thank you for visiting and have a nice day!</p></div>', //<- html body.
      text: `| ${applicant_email} | ${permitID} | https://dreki-19662.web.app |`, //<- plain text body.
    });
  }catch(err){
    throw new functions.https.HttpsError('unavailable', 'Error when sending the email!', err);
  }
  functions.logger.log('Email sent:', info);


  return {
    message: `Success! FirePermit has been created for '${applicant_email}'.`
  }
});





// Call functions from your app:
exports.useFirePermit = functions.https.onCall(async (data, context) => {
  functions.logger.log('From useFirePermit.');
  const email = data.email.toLowerCase();
  const code = data.code;

  // Checking attribute.
  if (!(typeof email === 'string' && typeof code === 'string') || email.length === 0  || code.length === 0) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with tvo arguments: "email" and "code".');
  }

  // Search for the permit in the db:
  const dataRef = admin.firestore().collection('permits').doc(code);
  const permit = await dataRef.get();
  if (!permit.exists) {
    // Permit not found:
    throw new functions.https.HttpsError('not-found', 'The permit you are looking for was not found: "'+ code +'".');
  }
  const dbData = permit.data();
  functions.logger.log('Permit data found:', dbData);
  if(!(dbData.email === email)){
    throw new functions.https.HttpsError('unavailable', 'The permit you are looking for in not yours.');
  }
  if(!dbData.blow_s || !dbData.cooldown_s || !dbData.repeats) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The "FirePermit" from the db must contain these fields: "blow_s", "cooldown_s" and "repeats".');
  }
  

  // Authorizing the dragon to fire:
  // Push data into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('fire').add({
    code: code,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    blow_s: dbData.blow_s,
    cooldown_s: dbData.cooldown_s,
    repeats: dbData.repeats
  });
  const fireID = writeResult.id;
  functions.logger.log('Fire ID:', fireID);


  return {
    message: 'Success! Fire permit has been sent to the dragon.'
  }
});





// Call functions from your app:
exports.fireAsAdmin = functions.https.onCall(async (data, context) => {
  functions.logger.log('From fireAsAdmin.');

  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', '(user not signed-in) The function must be called while authenticated.');
  }
  const admin_id = context.auth.uid;
  functions.logger.log('User ID:', admin_id);

  // Checking that the user is admin.
  const isAdmin = await admin.firestore().collection('admin').doc(admin_id).get();
  functions.logger.log('isAdmin:', isAdmin);
  if (!isAdmin.exists) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('permission-denied', '(user not admin) Only admins allowed to call this function.');
  }
  functions.logger.log('Name:', isAdmin.data());

  // Checking attribute.
  if(!data.fire_pattern.blow_s || !data.fire_pattern.cooldown_s || !data.fire_pattern.repeats) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with this argument: "fire_pattern".\n "fire_pattern={blow_s,cooldown_s,repeats}".');
  }


  // Authorizing the dragon to fire:
  // Push data into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('fire').add({
    isAdmin: true,
    code: admin_id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    blow_s: data.fire_pattern.blow_s,
    cooldown_s: data.fire_pattern.cooldown_s,
    repeats: data.fire_pattern.repeats
  });
  const fireID = writeResult.id;
  functions.logger.log('Fire ID:', fireID);


  return {
    message: 'Success! Fire request has been sent to the dragon.'
  }
});





// Call functions from your app:
exports.settingsBackend = functions.https.onCall(async (data, context) => {
  functions.logger.log('From settingsBackend.');

  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', '(user not signed-in) The function must be called while authenticated.');
  }
  const admin_id = context.auth.uid;
  functions.logger.log('User ID:', admin_id);

  // Checking that the user is admin.
  const isAdmin = await admin.firestore().collection('admin').doc(admin_id).get();
  functions.logger.log('isAdmin:', isAdmin);
  if (!isAdmin.exists) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('permission-denied', '(user not admin) Only admins allowed to call this function.');
  }
  functions.logger.log('Name:', isAdmin.data());

  // Checking attribute.
  if(!data.settings){
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument: "settings".');
  }
  if(!(data.settings == "stop" || data.settings == "shut_down"  || data.settings == "turn_on")){
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The available settings are the following: "stop", "shut_down" and "turn_on".');
  }


  // 'Update'ing the settings in the db for the backend: (use 'update' not 'set' on the doc)
  // Push data into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('settings-backend').doc(data.settings).update({
    requester: admin_id,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  functions.logger.log("Firestore's backend settings write-result-ID:", writeResult.id);


  return {
    message: 'Success! Request has been sent to dragon.'
  }
});






  /*
// Call functions from your app:
// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.

exports.addMessage2 = functions.https.onCall((data, context) => {
  functions.logger.log('From addMessage2.');

  // Message text passed from the client.
  const text = data.text;
  // Checking attribute.
  if (!(typeof text === 'string') || text.length === 0) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
        'one arguments "text" containing the message text to add.');
  }


  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        'while authenticated.');
  }
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;
  const name = context.auth.token.name || null;
  const picture = context.auth.token.picture || null;
  const email = context.auth.token.email || null;
  

  return "okay";
});
*/



















// Take the text parameter passed to this HTTP endpoint and insert it into 
// Firestore under the path /messages/:documentId/original
/*
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});
*/




// Listens for new messages added to /messages/:documentId/original and creates an
// uppercase version of the message to /messages/:documentId/uppercase
/*
exports.makeUppercase = functions.firestore.document('/messages/{documentId}').onCreate((snap, context) => {
  // Grab the current value of what was written to Firestore.
  const original = snap.data().original;

  // Access the parameter `{documentId}` with `context.params`
  functions.logger.log('Uppercasing', context.params.documentId, original);
  
  const uppercase = original.toUpperCase();
  
  // You must return a Promise when performing asynchronous tasks inside a Functions such as
  // writing to Firestore.
  // Setting an 'uppercase' field in Firestore document returns a Promise.
  return snap.ref.set({uppercase}, {merge: true});
});
*/





// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
*/