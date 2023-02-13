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
const GPIO_fire = new Gpio(4, 'out'); // Use GPIO pin-4, and specify that it is output.



const myGlobalObj = {
  db: {
    UnsubFire: null,
    UnsubSettings: null
  },
  fire_pattern: {
    blow_s: 5,
    cooldown_s: 5,
    repeats: 3
  },
  ShutDown_ts: null,
  TurnOn_ts: null,
  enable_key: null,

  chronic_hours: 7
};



function f_exitHandler(){
  // Callback function.
  console.log(">> Exiting Dreki Backend <<")
  myGlobalObj.db.UnsubFire(); // Detach the listener.
  myGlobalObj.db.UnsubSettings();
  GPIO_fire.writeSync(0); // Turn LED off
  GPIO_fire.unexport(); // Unexport GPIO to free resources
};
//catches ctrl+c event
process.on('SIGINT', f_exitHandler);
//process.on('exit', f_exitHandler);



function f_enforce_fire_pattern(){
  if(myGlobalObj.fire_pattern.blow_s < 3 || myGlobalObj.fire_pattern.blow_s > 180){
    myGlobalObj.fire_pattern.blow_s = 3;
  }
  if(myGlobalObj.fire_pattern.cooldown_s < 3 || myGlobalObj.fire_pattern.cooldown_s > 180){
    myGlobalObj.fire_pattern.cooldown_s = 3;
  }
  if(myGlobalObj.fire_pattern.cooldown_s < 1 || myGlobalObj.fire_pattern.cooldown_s > 30){
    myGlobalObj.fire_pattern.cooldown_s = 1;
  }
}
function f_timeout(s){
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}
function f_fireDragon(){
  const key = myGlobalObj.enable_key;
  return new Promise( async (resolve, reject) => {
    console.log('Do Fire! ', myGlobalObj.fire_pattern);
    f_enforce_fire_pattern();
    for(let i = 0; i < myGlobalObj.fire_pattern.repeats; i++){
      if(!myGlobalObj.enable_key || key !== myGlobalObj.enable_key){
        /*
        * If the global enable-key has changes since this performance has started,
        * a "stop" request has been received from frontend.
        */
        resolve("Fire aborted! Enable-key mismatch.");
        return;
      }
      console.log('FIRE!');
      GPIO_fire.writeSync(1); //set pin state to 1.
      await f_timeout(myGlobalObj.fire_pattern.blow_s);
      console.log('Sleep...');
      GPIO_fire.writeSync(0); //set pin state to 0.
      await f_timeout(myGlobalObj.fire_pattern.cooldown_s);
    }
    resolve("Fire Successful!");
  });
}



/*** 1 ***/
handle_fire_request();

/*** 2 ***/
handle_settings();

/*** 3 ***/
chronic_status_update();



/*** 1 ***/
function handle_fire_request(){
  const fireDoc = db.collection('fire');
  myGlobalObj.db.UnsubFire = fireDoc.onSnapshot(docSnapshot => {
    // Callback function.
    console.log(`Received fireDoc snapshot of size: ${docSnapshot.size}.`);
    if(!myGlobalObj.enable_key){
      // If the enable-key is null the dagon is currenly shutted-down.
      console.log("Fire aborted! Enable-key mismatch.");
      return;
    }
  
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
}



/*** 2 ***/
function handle_settings(){

  async function f_update_status_for_frontend(is_enable, requester){
    const status = is_enable ? "turned_on": "shut_down";
    let update_obj = {
      status: status,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    if(requester){
      update_obj.requester = requester;
    }
    // 'Update'ing the settings in the db for the frontend: (use 'update' not 'set' on the doc)
    // Push data into Firestore using the Firebase Admin SDK.
    const writeResult = await admin.firestore().collection('settings-frontend').doc("backend").update(update_obj);
    console.log(`Status for frontend updated to: '${status}'.\nWrite-Result-ID: ${writeResult}`);
  }

  async function f_on_turn_on(requester){
    f_update_status_for_frontend(true, requester);
  }

  async function f_on_shut_down(requester){
    f_update_status_for_frontend(false, requester);
  }

  function f_is_enable(){
    /*
    * If it is shorter time since the dragon was turned-on then when it was shutted-down, 
    * the dragon is active and this function will generate the enable-key eles the 
    * enable-key will be 'null' and the dragon won't be able to fire.
    * The 'enable-key' is a randomly generated 32bit unsigned number, or 'null'.
    */
    if(myGlobalObj.TurnOn_ts > myGlobalObj.ShutDown_ts && myGlobalObj.enable_key == null){
      // This gives two numbers each with an unsigned integer value in the range: '0'-'UINT32_MAX':
      const [x, y] = new Uint32Array(Float64Array.of(Math.random()).buffer);
      // https://stackoverflow.com/questions/28461796/randomint-function-that-can-uniformly-handle-the-full-range-of-min-and-max-safe
      myGlobalObj.enable_key = x;
      return true;
    }
    return false;
  }

  const settingsDoc = db.collection('settings-backend');
  myGlobalObj.db.UnsubSettings = settingsDoc.onSnapshot(docSnapshot => {
    // Callback function.
    console.log('Received settingsDoc snapshot.');
    docSnapshot.docChanges().forEach(function(change){
      /*
      * only the very first snapshot changes should be of type 'added' and all later snapshot
      * changes should be of type 'modified' and will be used to received different types of 
      * requests from frontend.
      */
      if(change.type === 'added'){
        if(myGlobalObj.enable_key){
          console.error("Something went wrong! The request 'type' should be 'modified'.");
          return;
        }
        if(change.doc.id == 'shut_down'){
          // Initialize the global variable:
          myGlobalObj.ShutDown_ts = change.doc.data().timestamp;
          if(myGlobalObj.TurnOn_ts){
            // Call this function when both variables have been initialized:
            if(f_is_enable()){
              f_on_turn_on(null);
            }else{
              f_on_shut_down(null);
            }
          }
        }
        if(change.doc.id == 'turn_on'){
          // Initialize the global variable:
          myGlobalObj.TurnOn_ts = change.doc.data().timestamp;
          if(myGlobalObj.ShutDown_ts){
            // Call this function when both variables have been initialized:
            if(f_is_enable()){
              f_on_turn_on(null);
            }else{
              f_on_shut_down(null);
            }
          }
        }
        console.log("Enable key:", myGlobalObj.enable_key);
        return;
      }

      if(docSnapshot.readTime.seconds - change.doc.data().timestamp.seconds > 60){
        onsole.log('Request is to old.');
        return;
      }
      const requester_admin_id = change.doc.data().requester;
      switch(change.doc.id){
        case 'stop':
          /*
          * If the dragon is currently performing, this will generate new enable-key which will 
          * disable the dragon's ability to fire (it will be using the old outdated enable-key).
          */
          console.log('Received a "stop" request from:', requester_admin_id);
          myGlobalObj.enable_key = null;
          f_is_enable();
          GPIO_fire.writeSync(0); //set pin state to 0.
          break;
        case 'shut_down':
          /*
          * This will set the enable-key to null which will disable the dragon's ability to fire 
          * and perform until it is turned-on again and a new enable-key is generated.
          */
          console.log('Received a "ShutDown" request from:', requester_admin_id);
          myGlobalObj.ShutDown_ts = change.doc.data().timestamp;
          if(myGlobalObj.enable_key){
            f_on_shut_down(requester_admin_id);
          }
          myGlobalObj.enable_key = null;
          GPIO_fire.writeSync(0); //set pin state to 0.
          break;
        case 'turn_on':
          /*
          * This will generate a enable-key if the dragon is currenly shutted-down, which will 
          * enable it to perform and fire.
          */
          console.log('Received a "TurnOn" request from:', requester_admin_id);
          myGlobalObj.TurnOn_ts = change.doc.data().timestamp;
          if(f_is_enable()){
            f_on_turn_on(requester_admin_id);
          }
          break;
          case 'poke':
            /*
            * Poking the dragon will trigger a response from the dragon which can be used to 
            * check/get the status of the dragon.
            */
            console.log('Received a "poke" request from:', requester_admin_id);
            const update_obj = {
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            // 'Update'ing the settings in the db for the frontend: (use 'update' not 'set' on the doc)
            // Push data into Firestore using the Firebase Admin SDK.
            admin.firestore().collection('settings-frontend').doc("backend").update(update_obj).then(function(){
              console.log("Status for frontend updated at:", update_obj.timestamp);
            });
            break;
        default:
          console.error('Something went wrong! Change.doc.id: ', change.doc.id, '\nChange.doc.data(): ', change.doc.data());
      }
    });
  }, err => {
    console.error(`Encountered error: ${err}`);
  });
}





/*** 3 ***/
function chronic_status_update(){

  function f_chronic(){
    const update_obj = {
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    // 'Update'ing the settings in the db for the frontend: (use 'update' not 'set' on the doc)
    // Push data into Firestore using the Firebase Admin SDK.
    admin.firestore().collection('settings-frontend').doc("backend").update(update_obj).then(function(){
      console.log("Chronic status updated at:", update_obj.timestamp);
      setTimeout(f_chronic, 7);
    });
  }

  const one_hour = 3600000;
  if(myGlobalObj.chronic_hours){
    setTimeout(f_chronic, 7);
  }
}





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