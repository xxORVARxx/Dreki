"use strict";

const admin = require("firebase-admin"); //npm i firebase-admin@9.12.0
//npm install firebase@8.10.1 --save
const Mutex = require('async-mutex').Mutex; //npm install async-mutex

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore();
const mutex = new Mutex();



const myGlobalObj = {
  fire: {
    repeats: 3,
    blow_ms: 3000,
    sleep_ms: 3000
  }
};



function exitHandler(){
  // Callback function.
  console.log(">> Exiting Dreki Backend <<")
  unsub(); // Detach the listener.
};
//catches ctrl+c event
process.on('SIGINT', exitHandler);
//process.on('exit', exitHandler);



function f_timeout(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

function f_fireDragon(){
  return new Promise( async (resolve, reject) => {
    console.log('Do Fire!');
    for(let i = 0; i < myGlobalObj.fire.repeats; i++){
      console.log('FIRE!');
      await f_timeout(myGlobalObj.fire.blow_ms);
      console.log('Sleep...');
      await f_timeout(myGlobalObj.fire.sleep_ms);
    }
    resolve("Fire Successful!");
  });
}



const fireDoc = db.collection('fire');
const unsub = fireDoc.onSnapshot(docSnapshot => {
  // Callback function.
  console.log(`Received fireDoc snapshot of size: ${docSnapshot.size}.`);

  const batch = db.batch();
  docSnapshot.forEach(function(doc){
      const fireID = doc.id;
      const code = doc.data().code;
      const age_sec = docSnapshot.readTime.seconds - doc.data().timestamp.seconds;
  
      if(age_sec < 45){
        if(mutex.isLocked()){
          console.log('Dragon is already firing try again later');
        }else{
          console.log('Fire ID:', fireID);

          mutex.runExclusive(f_fireDragon).then(function(result){
            console.log(result);
            db.collection('permits').doc(code).delete();
          });
        }
      }
    batch.delete(doc.ref);
  });
  batch.commit();   
}, err => {
  console.error(`Encountered error: ${err}`);
});








/* Newer way fo doing things:
require('dotenv').config();
//require("nodemailer");
const Gpio = require('onoff').Gpio; // npm install onoff

//const { initializeApp, applicationDefault } = require('firebase-admin/app'); // npm install --save firebase-admin
const admin = require("firebase-admin"); // npm i firebase-admin@9.12.0
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
initializeApp({
  credential: applicationDefault(), // This will look for the credential at the default location.
});
console.log( process.env.GOOGLE_APPLICATION_CREDENTIALS ); // This is the default location for the credential.
const db = getFirestore();
*/