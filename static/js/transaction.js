import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

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

auth.onAuthStateChanged(user => {
  if (user) return;
  window.location = "/"
});

const usernames = document.querySelectorAll(".account p.username");
usernames.forEach((username) => (username.innerText = localStorage.getItem("username")));

const accountButton = document.querySelector(".account > button")
accountButton.addEventListener("click", () => {
  const accountInfo = document.querySelector(".account-info");
  accountInfo.classList.toggle("hidden");
});

const logoutButton = document.querySelector(".logout-btn");
logoutButton.addEventListener("click", () => {
  signOut(auth)
  .then(() => {
    localStorage.clear();
    window.location = "/";
  });
});

const radioInputs = document.querySelectorAll("input[type='radio']");
radioInputs.forEach((input) => {
  disableInput(input)
  input.addEventListener("change", disableInput.bind(input, input));
});

const category = document.querySelector("select");
displayCustomMessage();
category.addEventListener("change", displayCustomMessage);

const submitButton = document.querySelector("button[type='submit']");
submitButton.addEventListener("click", (event) => {
  event.preventDefault();
  const form = document.forms[0];
  const formData = new FormData(form);
  const transactionData = {};
  let isFormIncomplete = false;
  formData.forEach((value, key) => {
    if (value === "" && !(key === "message" || key === "counterparty")) {
      alertUser("Please fill all the details");
      isFormIncomplete = true;
    }
    key = (key === "income_expense")? "is_income" : key;
    value = (key === "is_income")? value === "income" : value;

    if (key === "message") {
      const message = document.querySelector("input[name='message']");
      if (message.style.display === "none") {
        value = "";
      }
    }

    transactionData[key] = value;
  });
  transactionData["id"] = `ID/${(new Date()).getTime().toString(16)}/${crypto.randomUUID()}`;
  transactionData["email"] = localStorage.getItem("email");
  transactionData["uid"] = localStorage.getItem("uid");
  if (isFormIncomplete) return;

  fetch("/api/storeTransaction", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(transactionData),
  })
    .then(res => {
      const successMessage = document.querySelector(".success-msg");
      if (res.ok) {
        successMessage.style.visibility = "visible";
      } else {
        successMessage.style.visibility = "hidden";
        console.error(res);
        throw new Error("POST Request Failed: couldn't post transaction data");
      }
    })
    .catch(err => {
      console.error(err);
      const errorMessage = getErrorMessage(err.code);
     alertUser(errorMessage);
   });
});

const inputs = document.querySelectorAll("input, select");
inputs.forEach(input => {
  input.addEventListener("change", () => {
    const successMessage = document.querySelector(".success-msg");
    if (successMessage.style.visibility === "visible") {
      successMessage.style.visibility = "hidden";
    }
  });
});

function disableInput(input) {
  const fromInput = document.querySelector("#from");
  const toInput = document.querySelector("#to");
  if (input.checked && input.id === "expense") {
    fromInput.setAttribute("disabled", "true");
    toInput.removeAttribute("disabled");
  } else if (input.checked && input.id === "income") {
    toInput.setAttribute("disabled", "true");
    fromInput.removeAttribute("disabled");
  }

  [toInput.value, fromInput.value] = [fromInput.value, toInput.value];
}

function displayCustomMessage() {
  if (category.value === "Other") {
    category.nextElementSibling.style.display = "inline";
  } else {
    category.nextElementSibling.style.display = "none";
  }
}

function alertUser(message) {
  const modalMessage = document.querySelector(".dialog-message");
  modalMessage.innerText = message;
  const modal = document.querySelector(".alert");
  modal.showModal();
}

const modalCloseButton = document.querySelector(".alert .close");
modalCloseButton.addEventListener("click", () => {
  const modal = document.querySelector(".alert");
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