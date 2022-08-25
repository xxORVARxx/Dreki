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
const fireAsAdmin = httpsCallable(functions, 'fireAsAdmin');

const myGlobalObj = {
  uid: null,
  email: null,
  state: {
    current: null,
    last: null,
    loading_modal: null
  },
  css_rules: {
    show_logout: null,
    show_login: null,
    auth_logged_out: null,
    auth_logged_in: null,
    show_cancel: null
  }
}



document.addEventListener("DOMContentLoaded", function(){
  // Callback function.

  /*** 1 ***/
  state_machine()

  /*** 2 ***/
  GUI_buttons();

  /*** 3 ***/
  login_user_with_email();

  /*** 4 ***/
  logout_user();

  /*** 5 ***/
  share_fire_permit();

  /*** 6 ***/
  fire_dragon();

  /*** 7 ***/
  fire_dragon_as_admin();





  // this 'onAuthStateChanged' event heppens every time user logs-in, -out or signes-up,
  // if user is logged-in we get the 'credentials' but if user is logged-out we get 'null'.
  auth.onAuthStateChanged(function(user){
    // callback function.
    if(user){
      // user is signed in.
      console.log("You have successfully logged in!", user.uid);
      myGlobalObj.uid = user.uid;
      change_state('authLoggedIn');
    }
    else{
      // user NOT signed in.
      console.log("You have successfully logged out!");
      myGlobalObj.uid = null;
      myGlobalObj.email = null;
      change_state('authLoggedOut')
    }
  });



  function change_state(state){
    myGlobalObj.css_rules.show_login.style.setProperty('display', 'none');
    myGlobalObj.css_rules.show_logout.style.setProperty('display', 'none');
    myGlobalObj.css_rules.auth_logged_in.style.setProperty('display', 'none');
    myGlobalObj.css_rules.auth_logged_out.style.setProperty('display', 'none');
    myGlobalObj.css_rules.show_cancel.style.setProperty('display', 'none');
    switch(state){
      case "showLogin":
        console.log("State: 'showLogin'.");
        myGlobalObj.css_rules.show_login.style.setProperty('display', 'block');
        myGlobalObj.css_rules.show_cancel.style.setProperty('display', 'block');
        break;
      case "showLogout":
        console.log("State: 'showLogout'.");
        myGlobalObj.css_rules.show_logout.style.setProperty('display', 'block');
        myGlobalObj.css_rules.show_cancel.style.setProperty('display', 'block');
        break;
      case "authLoggedIn":
        console.log("State: 'authLoggedIn'.");
        myGlobalObj.css_rules.auth_logged_in.style.setProperty('display', 'block');
        break;
      case "authLoggedOut":
        console.log("State: 'authLoggedOut'.");
        myGlobalObj.css_rules.auth_logged_out.style.setProperty('display', 'block');
        break;
      default:
        console.error(`ERROR: State: "${state}" does not exist!`);
        throw new Error(`ERROR: State: "${state}" does not exist!`);
        break;
    }

    if(myGlobalObj.state.loading_modal){
      myGlobalObj.state.loading_modal.classList.remove("c_animation-loading-modal");
      myGlobalObj.state.loading_modal = null;
    }

    if(!(myGlobalObj.state.current === state)){
      myGlobalObj.state.last = myGlobalObj.state.current;
      myGlobalObj.state.current = state;
    }
  }





  /*** 1 ***/
  function state_machine(){
    // Get loading animation modal:
    const loading_modal = document.querySelector(".c_animation-loading-modal");
    myGlobalObj.state.loading_modal = loading_modal;

    // Getting the stylesheet:
    const stylesheet = document.styleSheets[0];
    // looping through all its rules and getting the rules needed:
    for(let i = 0; i < stylesheet.cssRules.length; i++) {
      if(stylesheet.cssRules[i].selectorText === '.c_show-logout') {
        myGlobalObj.css_rules.show_logout = stylesheet.cssRules[i];
      }
      else if(stylesheet.cssRules[i].selectorText === '.c_show-login') {
        myGlobalObj.css_rules.show_login = stylesheet.cssRules[i];
      }
      else if(stylesheet.cssRules[i].selectorText === '.c_auth-logged-out') {
        myGlobalObj.css_rules.auth_logged_out = stylesheet.cssRules[i];
      }
      else if(stylesheet.cssRules[i].selectorText === '.c_auth-logged-in') {
        myGlobalObj.css_rules.auth_logged_in = stylesheet.cssRules[i];
      }
      else if(stylesheet.cssRules[i].selectorText === '.c_show-cancel') {
        myGlobalObj.css_rules.show_cancel = stylesheet.cssRules[i];
      }
      if(myGlobalObj.css_rules.show_logout && 
        myGlobalObj.css_rules.show_login && 
        myGlobalObj.css_rules.auth_logged_out && 
        myGlobalObj.css_rules.auth_logged_in && 
        myGlobalObj.css_rules.show_cancel){
        break;
      }
    }
  }



  /*** 2 ***/
  function GUI_buttons(){
    const login_button = document.querySelector("#id_loggin-button");
    const logout_button = document.querySelector("#id_loggout-button");
    const back_button = document.querySelector("#id_back-button");
    const cancel_button = document.querySelector("#id_cancel-button");

    login_button.addEventListener("click", function(e){
      // callback function.
      e.preventDefault();
      change_state('showLogin');
    });
    logout_button.addEventListener("click", function(e){
      // callback function.
      e.preventDefault();
      change_state('showLogout');
    });
    back_button.addEventListener("click", function(e){
      // callback function.
      e.preventDefault();
      change_state(myGlobalObj.state.last);
    });
    cancel_button.addEventListener("click", function(e){
      // callback function.
      e.preventDefault();
      change_state(myGlobalObj.state.last);
    });
  }

  

  /*** 3 ***/
  function login_user_with_email(){

    function f_error_reset(login_form){
      login_form.querySelector(".c_error-text").innerHTML = "";
    }

    const login_form = document.querySelector("#id_login-form");
    const login_button = document.querySelector("#id_login-form > button");
    login_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      login_button.classList.add("c_animation-loading-button");
      f_error_reset(login_form);

      const email = login_form["id_login-email"].value;
      const password = login_form["id_login-password"].value;
      // using email and password from form to login user with firebase-auth:
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // signed in susessfully.
        myGlobalObj.email = email;

        // See the function above called: "auth.onAuthStateChanged()" for more logic after signing in.

        // clearing form and error-text if any:
        login_form.reset();
        f_error_reset(login_form);
        login_button.classList.remove("c_animation-loading-button");
      })
      .catch((error) => {
        // handle errors here.
        login_button.classList.remove("c_animation-loading-button");
        login_form.querySelector(".c_error-text").innerHTML = error.code;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 4 ***/
  function logout_user(){

    function f_error_reset(logout_form){
        logout_form.querySelector(".c_error-text").innerHTML = "";
    }

    const logout_form = document.querySelector("#id_logout-form");
    const logout_button = document.querySelector("#id_logout-form > button");
    logout_form.addEventListener("submit", async function(e){
      // Asynchronous callback function in another thread.
      e.preventDefault();
      logout_button.classList.add("c_animation-loading-button");
      f_error_reset(logout_form);

      // logout user:
      signOut(auth).then(() => {
        // logout susessfully.

        // See the function above called: "auth.onAuthStateChanged()" for more logic after loging out.

        // clearing error-text if any:
        f_error_reset(logout_form);
        logout_button.classList.remove("c_animation-loading-button");
      }).catch((error) => {
        // handle errors here.
        logout_button.classList.remove("c_animation-loading-button");
        logout_form.querySelector(".c_error-text").innerHTML = error.code;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 5 ***/
  function share_fire_permit(){

    function f_error_reset(permit_form){
      permit_form.querySelector("h2.c_error-text").innerHTML = "";
    }

    function f_on_success(permit_form){
      setTimeout(() => {
        permit_form.querySelector("h2.c_success-text").style.setProperty('display', 'none');
      }, 6667);
      permit_form.querySelector("h2.c_success-text").style.setProperty('display', 'block');
    }

    const permit_form = document.querySelector("#id_permits-for-fire-form");
    const send_button = document.querySelector("#id_permits-for-fire-form > button");
    permit_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      send_button.classList.add("c_animation-loading-button");
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
        f_on_success(permit_form);
        f_error_reset(permit_form);
        send_button.classList.remove("c_animation-loading-button");
      }).catch((error) => {
        // handle errors here.
        send_button.classList.remove("c_animation-loading-button");
        permit_form.querySelector("h2.c_error-text").innerHTML = error.message;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 6 ***/
  function fire_dragon(){

    function f_error_reset(fire_form){
      fire_form.querySelector(".c_error-text").innerHTML = "";
    }

    function f_on_success(fire_form){
      setTimeout(() => {
        fire_form.querySelector("h2.c_success-text").style.setProperty('display', 'none');
      }, 6667);
      fire_form.querySelector("h2.c_success-text").style.setProperty('display', 'block');
    }

    const fire_form = document.querySelector("#id_fire-form");
    const fire_button = document.querySelector("#id_fire-form > button");
    fire_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      fire_button.classList.add("c_animation-loading-button");
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


        f_on_success(fire_form);
        fire_form.reset();
        f_error_reset(fire_form);
        fire_button.classList.remove("c_animation-loading-button");
      }).catch((error) => {
        // handle errors here.
        fire_button.classList.remove("c_animation-loading-button");
        fire_form.querySelector(".c_error-text").innerHTML = error.message;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 7 ***/
  function fire_dragon_as_admin(){

    function f_error_reset(admin_fire_form){
      admin_fire_form.querySelector(".c_error-text").innerHTML = "";
    }

    function f_on_success(admin_fire_form){
      setTimeout(() => {
        admin_fire_form.querySelector("h2.c_success-text").style.setProperty('display', 'none');
      }, 6667);
      admin_fire_form.querySelector("h2.c_success-text").style.setProperty('display', 'block');
    }

    const admin_fire_form = document.querySelector("#id_admin-fire-form");
    const admin_fire_button = document.querySelector("#id_fire-form > button");
    admin_fire_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      f_error_reset(admin_fire_form);
      
      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      fireAsAdmin({email: myGlobalObj.email, code: myGlobalObj.uid})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);


        admin_fire_form.reset();
        f_error_reset(admin_fire_form);
        admin_fire_button.classList.remove("c_animation-loading-button");
      }).catch((error) => {
        // handle errors here.
        admin_fire_button.classList.remove("c_animation-loading-button");
        admin_fire_form.querySelector(".c_error-text").innerHTML = error.message;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }
});