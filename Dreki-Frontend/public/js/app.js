"use strict" // WHOLE-SCRIPT STRICT MODE SYNTAX.

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-functions.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjBAJBXPWpdT66G_eiYo1C0Jd-MAZdxyc",
  authDomain: "dreki-19662.firebaseapp.com",
  projectId: "dreki-19662",
  storageBucket: "dreki-19662.appspot.com",
  messagingSenderId: "394041742187",
  appId: "1:394041742187:web:22a20963fd962d4ce5722e",
  measurementId: "G-8Q54EJPNC9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const functions = getFunctions(app);

/*
// THIS IS THE DEFAULT HOST AND PORT USED BY 'firebase serve command':
connectFunctionsEmulator(functions, 'localhost', 5001);
*/

const createFirePermit = httpsCallable(functions, 'createFirePermit');
const useFirePermit = httpsCallable(functions, 'useFirePermit');



document.addEventListener("DOMContentLoaded", function(){
  // Callback function.

  /*** 1 ***/
  login_user_with_email();

  /*** 2 ***/
  logout_user();

  /*** 3 ***/
  share_fire_permit();

  /*** 4 ***/
  fire_the_dragon();

    /*
  const button = document.querySelector("#id_button");
  button.addEventListener("click", function(e){
    // Callback function.

    e.preventDefault();
    console.log("Button clicked!");
    // Call the function:
    // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".

    addMessage2({text: "þetta er test frá callable function!"})
      .then((result) => {
        // Read result of the Cloud Function.
        */
        /** @type {any} */
        /*
        const data = result.data;
        console.log(data);
        //const sanitizedMessage = data.text;
    
      }).catch((error) => {
        // Getting the Error details.
        const code = error.code;
        const message = error.message;
        const details = error.details;
        console.log({" Code": error.code, " Message": error.message, " Details": error.details});
      });

      console.log("function called");

  });



  const button_db = document.querySelector("#id_button_db");
  button_db.addEventListener("click", async function(e){
    // Asynchronous callback function.

    e.preventDefault();
    console.log("Button clicked!");
    
    const querySnapshot = await getDocs(collection(db, "server"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      console.log(doc.data());
    });


    console.log("data from firestore!");
  });
      */







  /*** 1 ***/
  function login_user_with_email(){

    function f_error_reset(login_form){
      login_form.querySelector(".c_error-text").innerHTML = "";
    }

    /*async function f_update_user_info(the_credential){
      const obj = {
          fs_first_time: false
      };
      return fb_store.collection("fs_users").doc(the_credential.user.uid).update(obj);
    }*/

    const login_form = document.querySelector("#id_login-form");
    login_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      f_error_reset(login_form);
      const email = login_form["id_login-email"].value;
      const password = login_form["id_login-password"].value;

      // using email and password from form to login user with firebase-auth:
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // signed in susessfully.
        const uid = userCredential.user.uid;
        console.log(uid);
        console.log("You have successfully logged in!");

        // clearing form and error-text if any:
        login_form.reset();
        f_error_reset(login_form);
      })
      .catch((error) => {
        // handle errors here.
        login_form.querySelector(".c_error-text").innerHTML = error.message;
        console.error(error.code, error.message);
      });
    });
  }



  /*** 2 ***/
  function logout_user(){

    function f_error_reset(logout_form){
        logout_form.querySelector(".c_error-text").innerHTML = "";
    }

    const logout_form = document.querySelector("#id_logout-form");
    logout_form.addEventListener("submit", async function(e){
      // Asynchronous callback function in another thread.
      e.preventDefault();
      f_error_reset(logout_form);

      // logout user:
      signOut(auth).then(() => {
        console.log("You have successfully logged out!");
        f_error_reset(logout_form);
      }).catch((error) => {
        // handle errors here.
        logout_form.querySelector(".c_error-text").innerHTML = err.message;
        console.error(err);
      });
    });
  }



  /*** 3 ***/
  function share_fire_permit(){

    function f_error_reset(permit_form){
      permit_form.querySelector(".c_error-text").innerHTML = "";
    }

    const permit_form = document.querySelector("#id_permits-for-fire");
    permit_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      f_error_reset(permit_form);
      const email = permit_form["id_share-to-email"].value;

      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      createFirePermit({email: email})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);



        //permit_form.reset();
        f_error_reset(permit_form);
      }).catch((error) => {
        // handle errors here.
        console.log({" Code": error.code, " Message": error.message, " Details": error.details});
        permit_form.querySelector(".c_error-text").innerHTML = error.message;
      });
    });
  }



  /*** 4 ***/
  function fire_the_dragon(){

    function f_error_reset(fire_form){
      fire_form.querySelector(".c_error-text").innerHTML = "";
    }

    const fire_form = document.querySelector("#id_fire");
    fire_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      f_error_reset(fire_form);
      const email = fire_form["id_email-with-permit"].value;
      const code = fire_form["id_permit-code"].value;
      
      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      useFirePermit({email: email, code: code})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);


        fire_form.reset();
        f_error_reset(fire_form);
      }).catch((error) => {
        // handle errors here.
        console.log({" Code": error.code, " Message": error.message, " Details": error.details});
        fire_form.querySelector(".c_error-text").innerHTML = error.message;
      });
    });
  }
});