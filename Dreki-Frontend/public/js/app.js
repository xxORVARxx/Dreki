"use strict" // WHOLE-SCRIPT STRICT MODE SYNTAX.

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js";
//import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
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
//const analytics = getAnalytics(app);
const auth = getAuth();
//const db = getFirestore(app);
const functions = getFunctions(app);

/*
// THIS IS THE DEFAULT HOST AND PORT USED BY 'firebase serve command':
connectFunctionsEmulator(functions, 'localhost', 5001);
*/

const createFirePermit = httpsCallable(functions, 'createFirePermit');
const useFirePermit = httpsCallable(functions, 'useFirePermit');
const fireAsAdmin = httpsCallable(functions, 'fireAsAdmin');
const settingsBackend = httpsCallable(functions, 'settingsBackend');

const myGlobalObj = {
  uid: null,
  email: null,
  state: {
    current: null,
    last: null,
    is_processing: false,
    loading_modal: null
  },
  css_rules: {
    show_logout: null,
    show_login: null,
    auth_logged_out: null,
    auth_logged_in: null,
    show_cancel: null
  },
  fire_pattern: {
    blow_s: 5,
    cooldown_s: 5,
    repeats: 3,
    total_s: 30
  }
}

// for debuging:
function f_debug_sleep_function(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
  // to use:
  //await f_debug_sleep_function(10000);
}



document.addEventListener("DOMContentLoaded", function(){
  // Callback function.

  /*** 1 ***/
  state_machine()

  /*** 2 ***/
  GUI_buttons();

  /*** 3 ***/
  GUI_sliders();

  /*** 4 ***/
  data_from_backend();

  /*** 5 ***/
  login_user_with_email();

  /*** 6 ***/
  logout_user();

  /*** 7 ***/
  fire_dragon();

  /*** 8 ***/
  share_fire_permit();

  /*** 9 ***/
  fire_dragon_as_admin();

  /*** 10 ***/
  stop_dragon();




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
  function GUI_sliders(){

    function f_update_totla_performance_time(){
      const totals = document.querySelectorAll(".c_total-value");
      // Calculate the total seconds and put into the global-object:
      myGlobalObj.fire_pattern.total_s = (myGlobalObj.fire_pattern.blow_s + myGlobalObj.fire_pattern.cooldown_s) * myGlobalObj.fire_pattern.repeats;
      // Upate the values in the HTML-DOM:
      for(let i = 0; i < totals.length; i++){
        // see: https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
        totals[i].innerHTML = new Date(myGlobalObj.fire_pattern.total_s * 1000).toISOString().slice(11, 19);
      }
    }

    // Make the slider value nonlinear:
    function f_construct_slider(IDslider, cValues, gVar){ //<-'gVar'= names of the member-variables in 'myGlobalObj'.
      const slider = document.querySelector(IDslider);
      const values = document.querySelectorAll(cValues);
      // Update the current slider value (each time you drag the slider handle).
      slider.oninput = function(){
        // callback function.
        let v = Number(this.value); // 'this.value' returns a string!
        if(v < 10){
          // v = v  <-do nothing.
        }else if(v < 20){
          v = 10 + ((v - 10) * 2);
        }else if(v < 30){
          v = 30 + ((v - 20) * 5);
        }else if(v <= 40){
          v = 80 + ((v - 30) * 10);
        }
        // Upate the values in the HTML-DOM:
        for(let i = 0; i < values.length; i++) {
          values[i].innerHTML = v;
        }
        // Put the value into the global-object:
        myGlobalObj.fire_pattern[gVar] = v; //<-Access member-variables using 'bracket-notation'.
        f_update_totla_performance_time();
      }
    }

    // Initialize the HTML-input slides located in the 'ADMIN FIRE-PATTERN MODAL':
    f_construct_slider("#id_blow-slider", ".c_blow-value", "blow_s");
    f_construct_slider("#id_cooldown-slider", ".c_cooldown-value", "cooldown_s");
    f_construct_slider("#id_repeat-slider", ".c_repeat-value", "repeats");
    f_update_totla_performance_time();
  }



  /*** 4 ***/
  function data_from_backend(){

  }

  

  /*** 5 ***/
  function login_user_with_email(){

    function f_process_started(login_form, login_button){
      login_button.classList.add("c_animation-loading-button");
      myGlobalObj.state.is_processing = true;
    }
    function f_process_finished(login_form, login_button){
      login_button.classList.remove("c_animation-loading-button");
      myGlobalObj.state.is_processing = false;
    }

    function f_error_reset(login_form){
      login_form.querySelector(".c_error-text").innerHTML = "";
    }

    const login_form = document.querySelector("#id_login-form");
    const login_button = document.querySelector("#id_login-form > button");
    login_form.addEventListener("submit", async function(e){
      // Callback function.
      e.preventDefault();
      if(myGlobalObj.state.is_processing){
        console.log("Please wait for current process to finish before starting another!");
        return;
      }
      f_process_started(login_form, login_button);
      f_error_reset(login_form);

      const email = login_form["id_login-email"].value;
      const password = login_form["id_login-password"].value;
      // using email and password from form to login user with firebase-auth:
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // signed in susessfully.
        myGlobalObj.email = email;

        // See the function above called: "auth.onAuthStateChanged()" for more logic after signing in.

        login_form.reset();
        f_process_finished(login_form, login_button);
      })
      .catch((error) => {
        f_process_finished(login_form, login_button);
        // handle errors here.
        login_form.querySelector(".c_error-text").innerHTML = error.code;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 6 ***/
  function logout_user(){

    function f_error_reset(logout_form){
        logout_form.querySelector(".c_error-text").innerHTML = "";
    }

    const logout_form = document.querySelector("#id_logout-form");
    const logout_button = document.querySelector("#id_logout-form > button");
    logout_form.addEventListener("submit", function(e){
      // Asynchronous callback function in another thread.
      e.preventDefault();
      logout_button.classList.add("c_animation-loading-button");
      f_error_reset(logout_form);

      // logout user:
      signOut(auth).then(() => {
        // logout susessfully.

        // See the function above called: "auth.onAuthStateChanged()" for more logic after loging out.

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



  /*** 7 ***/
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

    function f_check_url_for_permit(fire_form){
      // Picking out the parameters from the URL:
      const url_param_map = new URLSearchParams(document.URL.toLowerCase().split('?')[1]);
      // Geting the parameter containing the fire-permit-id:
      const url_permit = url_param_map.get("permit");
      if(url_permit){
        // Putting the fire-permit-id in to the input-field in HTML:
        fire_form.querySelector("#id_permit-code").setAttribute("value", url_permit);
      }
    }

    const fire_form = document.querySelector("#id_fire-form");
    const fire_button = document.querySelector("#id_fire-form > button");
    f_check_url_for_permit(fire_form);
    fire_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      fire_button.classList.add("c_animation-loading-button");
      f_error_reset(fire_form);
      const email = fire_form["id_email-with-permit"].value;
      const permit_code = fire_form["id_permit-code"].value;
      
      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      useFirePermit({email: email, code: permit_code})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);


        f_on_success(fire_form);
        fire_form.reset();
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



  /*** 8 ***/
  function share_fire_permit(){

    function f_process_started(permit_form, send_button){
      send_button.classList.add("c_animation-loading-button");
      myGlobalObj.state.is_processing = true;
    }
    function f_process_finished(permit_form, send_button){
      send_button.classList.remove("c_animation-loading-button");
      myGlobalObj.state.is_processing = false;
    }

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
    permit_form.addEventListener("submit", function(e){
      // Asynchronous callback function.
      e.preventDefault();
      if(myGlobalObj.state.is_processing){
        console.log("Please wait for current process to finish before starting another!");
        return;
      }
      f_process_started(permit_form, send_button)
      f_error_reset(permit_form);

      const email = permit_form["id_share-to-email"].value;
      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      createFirePermit({email: email, fire_pattern: myGlobalObj.fire_pattern})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);


        f_on_success(permit_form);
        //permit_form.reset();
        f_process_finished(permit_form, send_button)
      })
      .catch((error) => {
        f_process_finished(permit_form, send_button);
        // handle errors here.
        permit_form.querySelector("h2.c_error-text").innerHTML = error.message;
        console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
        console.error({error});
      });
    });
  }



  /*** 9 ***/
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
    const admin_fire_button = document.querySelector("#id_admin-fire-form > button");
    admin_fire_form.addEventListener("submit", async function(e){
      // Asynchronous callback function.
      e.preventDefault();
      admin_fire_button.classList.add("c_animation-loading-button");
      f_error_reset(admin_fire_form);
      
      // Call the cloud-function:
      // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
      fireAsAdmin({fire_pattern: myGlobalObj.fire_pattern})
      .then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);

        f_on_success(admin_fire_form);
        admin_fire_form.reset();
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



  /*** 10 ***/
  function stop_dragon(){

    function f_error_reset(stop_form){
      stop_form.querySelector(".c_error-text").innerHTML = "";
    }

    function f_on_success(stop_form){
      setTimeout(() => {
        stop_form.querySelector("h2.c_success-text").style.setProperty('display', 'none');
      }, 6667);
      stop_form.querySelector("h2.c_success-text").style.setProperty('display', 'block');
    }

    const stop_form = document.querySelector("#id_admin-stop-form");
    const stop_buttons = document.querySelectorAll("#id_admin-stop-form > button");
    stop_buttons.forEach(function(button){
      button.addEventListener("click", async function(e){
        // Asynchronous callback function in another thread.
        e.preventDefault();
        const button_tag = (e.target.tagName === "SPAN") ? e.target.parentNode : e.target;
        button_tag.classList.add("c_animation-loading-button");
        f_error_reset(stop_form);
        console.log("Button value:", button_tag.value);

        // Call the cloud-function:
        // Before deplying see "https://firebase.google.com/docs/app-check?authuser=3".
        settingsBackend({settings: button_tag.value})
        .then((result) => {
          // Read result of the Cloud Function.
          /** @type {any} */
          const data = result.data;
          console.log(data);

          f_on_success(stop_form);
          stop_form.reset();
          button_tag.classList.remove("c_animation-loading-button");
        }).catch((error) => {
          // handle errors here.
          button_tag.classList.remove("c_animation-loading-button");
          stop_form.querySelector(".c_error-text").innerHTML = error.code;
          console.error("Error\nCode: "+ error.code, "\nMessage: "+ error.message, "\nDetails: "+ error.details);
          console.error({error});
        });
      });
    });
  }
});