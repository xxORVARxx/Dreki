"use strict";
const nodemailer = require("nodemailer");

require('dotenv').config();
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');



initializeApp({
  credential: applicationDefault(), // This will look for the credential at the default location.
});
console.log( process.env.GOOGLE_APPLICATION_CREDENTIALS ); // This is the default location for the credential.

const db = getFirestore();



async function fire(){
  console.log('Do Fire!');
  return true;
}



const doc = db.collection('fire');
const unsub = doc.onSnapshot(docSnapshot => {
  // Callback function.
  console.log('Received doc snapshot.');
  const batch = db.batch();

  // The 'every()' function behaves exactly like 'forEach()', except that...
  // returning false is equivalent to a 'break', and returning true is equivalent to a 'continue'.
  docSnapshot.forEach(function(doc) {
    const fireID = doc.id;
    const code = doc.data().code;
    const age_sec = docSnapshot.readTime.seconds - doc.data().timestamp.seconds;

    if(age_sec < 90){
      console.log('Fire ID:', fireID);
      if(fire()){
        db.collection('permits').doc(code).delete();
      }
    }
    batch.delete(doc.ref);
    
  });

  batch.commit();
}, err => {
  console.log(`Encountered error: ${err}`);
});



function exitHandler(){
  // Callback function.
  console.log(">> Exiting Dreki Backend <<")
  unsub(); // Detach the listener.
};
//catches ctrl+c event
process.on('SIGINT', exitHandler);
//process.on('exit', exitHandler);





/*
async function get_firestore(){
  const querySnapshot = await db.collection('server').get();
  console.log( querySnapshot.docs.map(doc => ({
    id: doc.id
  })) );
}
get_firestore();
*/