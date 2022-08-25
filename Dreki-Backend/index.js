"use strict";

require('dotenv').config();
require("nodemailer");

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
initializeApp({
  credential: applicationDefault(), // This will look for the credential at the default location.
});
console.log( process.env.GOOGLE_APPLICATION_CREDENTIALS ); // This is the default location for the credential.
const db = getFirestore();



function exitHandler(){
  // Callback function.
  console.log(">> Exiting Dreki Backend <<")
  unsub(); // Detach the listener.
};
//catches ctrl+c event
process.on('SIGINT', exitHandler);
//process.on('exit', exitHandler);





const fireDragon = new Promise((resolve, reject) => {
  console.log('Do Fire!');
  // Just testing hérna:
  setTimeout(() => { resolve("Fire Successful!");}, 300);
});



const fireDoc = db.collection('fire');
const unsub = fireDoc.onSnapshot(docSnapshot => {
  // Callback function.
  console.log('Received fireDoc snapshot.');
  const batch = db.batch();

  docSnapshot.forEach(function(doc){
    const fireID = doc.id;
    const code = doc.data().code;
    const age_sec = docSnapshot.readTime.seconds - doc.data().timestamp.seconds;

    if(age_sec < 45){
      console.log('Fire ID:', fireID);

      fireDragon.then((result) => {
        console.log(result);
        db.collection('permits').doc(code).delete();
      }).catch((error) => {
        console.error(error);
      });

    }
    batch.delete(doc.ref);
  });
  batch.commit();
}, err => {
  console.error(`Encountered error: ${err}`);
});