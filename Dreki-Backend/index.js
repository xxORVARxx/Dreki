"use strict";

const admin = require("firebase-admin"); //npm i firebase-admin@9.12.0
//npm install firebase@8.10.1 --save
const Mutex = require('async-mutex').Mutex; //npm install async-mutex
const Gpio = require('onoff').Gpio; //npm install onoff

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore();
const mutex = new Mutex();
const GPIO_4 = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is output



const myGlobalObj = {
  fire_pattern: {
    blow_s: 5,
    cooldown_s: 5,
    repeats: 3
  }
};



function exitHandler(){
  // Callback function.
  console.log(">> Exiting Dreki Backend <<")
  dbUnsub(); // Detach the listener.
  GPIO_4.writeSync(0); // Turn LED off
  GPIO_4.unexport(); // Unexport GPIO to free resources
};
//catches ctrl+c event
process.on('SIGINT', exitHandler);
//process.on('exit', exitHandler);



function f_timeout(s){
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

function f_fireDragon(){
  return new Promise( async (resolve, reject) => {
    console.log('Do Fire! ', myGlobalObj.fire_pattern);
    for(let i = 0; i < myGlobalObj.fire_pattern.repeats; i++){
      console.log('FIRE!');
      GPIO_4.writeSync(1); //set pin state to 1.
      await f_timeout(myGlobalObj.fire_pattern.blow_s);
      console.log('Sleep...');
      GPIO_4.writeSync(0); //set pin state to 0.
      await f_timeout(myGlobalObj.fire_pattern.cooldown_s);
    }
    resolve("Fire Successful!");
  });
}



const fireDoc = db.collection('fire');
const dbUnsub = fireDoc.onSnapshot(docSnapshot => {
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

          const dbData = doc.data();
          myGlobalObj.fire_pattern.blow_s = dbData.blow_s;
          myGlobalObj.fire_pattern.cooldown_s = dbData.cooldown_s;
          myGlobalObj.fire_pattern.repeats = dbData.repeats;

          mutex.runExclusive(f_fireDragon).then(function(result){
            console.log(result, myGlobalObj.fire_pattern);
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