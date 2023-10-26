import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js"
import { getAuth, sendEmailVerification, createUserWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyDAMJmNbSfeEn6R7-R7rezu8Pzrd2_YLMI",
  authDomain: "budget-nest.firebaseapp.com",
  databaseURL: "https://budget-nest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "budget-nest",
  storageBucket: "budget-nest.appspot.com",
  messagingSenderId: "1012068650368",
  appId: "1:1012068650368:web:7590a9374e50d519bd4565",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signUpBtn = document.querySelector("#sign-up");
signUpBtn.addEventListener("click", () => {
  if (!verifyPassword()) {
    alertUser("Passwords don't match");
    return;
  }
  const user = getUserData();
  const email = user.email;
  const password = user.password;
  const username = user.username;
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => { 
    const user = userCredential.user;

    fetch("/api/registerUser", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ 
        uid: user.uid,
        email: user.email,
      })
    });

    sendEmailVerification(user)
    .then(() => {
      signOut(auth);
      alertUser("An email verification link has been sent to your email, please verify your email to continue.");
    })
    .catch((error) => {
      console.error(error);
      const errorMessage = getErrorMessage(error.code);
      alertUser(errorMessage);
    });
    return updateProfile(auth.currentUser, {
      displayName: username
    });
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = getErrorMessage(errorCode);
    alertUser(errorMessage);
  });

});

function verifyPassword() {
  const password = document.querySelector("#password");
  const confirmPassword = document.querySelector("#confirm-password");
  if (password.value !== confirmPassword.value) {
    password.setCustomValidity("Passwords do not match");
    confirmPassword.setCustomValidity("Passwords do not match");
    return false;
  }
  return true;
}

function getUserData() {
  const form = document.querySelector("form");
  const formData = new FormData(form);
  const firstName = formData.get("first-name");
  const lastName = formData.get("last-name");
  const username = firstName.concat(" ", lastName);
  const email = formData.get("email");
  const password = formData.get("password");
  const user = {
    username,
    email,
    password,
  }

  return user;
}

const showPassword = document.querySelector("#show-password");
const passwordInputs = document.querySelectorAll("#password, #confirm-password");
showPassword.addEventListener("change", () => {
  const passwordInputs = document.querySelectorAll("#password, #confirm-password");
  passwordInputs.forEach((passwordInput) => {
    if (showPassword.checked) {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }
  });
});

passwordInputs.forEach((passwordInput) => {
  if (showPassword.checked) {
    passwordInput.type = "text";
  } else {
    passwordInput.type = "password";
  }
});

function alertUser(message) {
  const modalMessage = document.querySelector(".dialog-message");
  modalMessage.innerText = message;
  const modal = document.querySelector("dialog");
  modal.showModal();
}

const modalCloseButton = document.querySelector(".close");
modalCloseButton.addEventListener("click", () => {
  const modal = document.querySelector("dialog");
  modal.close();
});

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/claims-too-large":
      return "The information you provided is too large. Please try again with less or different information.";
    case "auth/email-already-exists":
      return "The email you entered is already in use by another user. Please use a different email or sign in with your existing account.";
    case "auth/email-already-in-use":
      return "The email you entered is already in use by another user. Please use a different email or sign in with your existing account.";
    case "auth/id-token-expired":
      return "Your session has expired. Please sign in again to continue.";
    case "auth/id-token-revoked":
      return "Your account has been disabled by an administrator. Please contact support for assistance.";
    case "auth/insufficient-permission":
      return "You do not have permission to perform this action. Please check your account settings or contact support for assistance.";
    case "auth/internal-error":
      return "An unexpected error occurred. Please try again later or contact support if the problem persists.";
    case "auth/invalid-argument":
      return "The information you entered is invalid. Please check your input and try again.";
    case "auth/invalid-claims":
      return "The information you provided is not allowed. Please try again with different or less information.";
    case "auth/invalid-continue-uri":
      return "The link you clicked is invalid. Please make sure you copied the link correctly or contact support for assistance.";
    case "auth/invalid-creation-time":
      return "The date you entered is invalid. Please enter a valid date in UTC format.";
    case "auth/invalid-credential":
      return "The credential you used to sign in is invalid. Please use a different credential or contact support for assistance.";
    case "auth/invalid-disabled-field":
      return "The status you selected is invalid. Please choose either enabled or disabled.";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/invalid-password":
      return "Please enter a password with atleast 6 characters";
    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
    case "auth/invalid-login-credentials":
      return "Your email or password is incorrect";
    default:
      return "An unknown error occurred. Please contact support for assistance.";
  }
}