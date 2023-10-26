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

auth.onAuthStateChanged((user) => {
  if (user) return;
  window.location = "/";
});

const usernames = document.querySelectorAll(".account p.username");
usernames.forEach((username) => (username.innerText = localStorage.getItem("username")));
getDataFromDatabase();

const accountButton = document.querySelector(".account > button");
accountButton.addEventListener("click", () => {
  const accountInfo = document.querySelector(".account-info");
  accountInfo.classList.toggle("hidden");
});

const logoutButton = document.querySelector(".logout-btn");
logoutButton.addEventListener("click", () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location = "/";
  });
});

const editButtons = document.querySelectorAll(".edit");
editButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.nextElementSibling.showModal();
  });
});

const modalCloseButtons = document.querySelectorAll(".btn--cancel");
modalCloseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.parentElement.parentElement.parentElement.close();
  });
});

const saveButtons = document.querySelectorAll(".btn--save");
saveButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.previousElementSibling;
    const value = input.value;

    let goal = input.id.startsWith("savings") ? "savings" : "budget";

    setGoal(goal, value);
    setProgressBar(goal, value);
    const email = localStorage.getItem("email");
    const uid = localStorage.getItem("uid");
    sendDataToDatabase(goal, value, email, uid);
    btn.parentElement.parentElement.parentElement.close();
  });
});

function setProgressBar(goal, goalValue) {
  const progressBar = document.querySelector(`.${goal} .bar`);
  const currentValue = Number(document.querySelector(`.${goal} .goal__progress p`).innerText.substring(1).replace(/,/g, ""));
  const percentage = (currentValue / goalValue) * 100;
  progressBar.style.width = `${percentage}%`;

  const goalClass = goal;
  if (percentage >= 100) {
    const goal = document.querySelector(`.${goalClass}`);
    if (goal.classList.contains("savings")) {
      goal.style.setProperty("--clr-goal-status", "var(--clr-primary-light)");
    } else {
      goal.style.setProperty("--clr-goal-status", "var(--clr-secondary)");
    }
  } else {
    const goal = document.querySelector(`.${goalClass}`);
    if (!goal.classList.contains("savings")) {
      goal.style.setProperty("--clr-goal-status", "var(--clr-primary-light)");
    } else {
      goal.style.setProperty("--clr-goal-status", "var(--clr-secondary)");
    }
  }
}

function setGoal(goal, value) {
  const formattedValue = Number(value).toLocaleString("en-IN");
  const goalAmount = document.querySelector(`.${goal} .goal__amount p`);
  goalAmount.innerText = goalAmount.innerText.charAt(0).concat(formattedValue);
}

function sendDataToDatabase(goal, value, email, uid) {
  fetch(`/api/setGoal`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ uid, email, [`${goal}_goal`]: value }),
  }).catch(err => {
     const errorMessage = getErrorMessage(err.code);
    alertUser(errorMessage);
  });
}

function getDataFromDatabase() {
  const uid = localStorage.getItem("uid");
  const email = localStorage.getItem("email");
  fetch(`/api/home/userData?uid=${uid}&email=${email}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      fillHomepageData(data);
    }).catch(err => {
      const errorMessage = getErrorMessage(err.code);
     alertUser(errorMessage);
   });
}

function fillHomepageData(data) {
  const rupee = "₹";

  const netIncome = document.querySelector(".net-income > p");
  netIncome.innerText = rupee + (data["total_income"] - data["total_expense"]).toLocaleString("en-IN");

  const totalIncome = document.querySelector(".total-income p");
  totalIncome.innerText = rupee + data["total_income"].toLocaleString("en-IN");

  const totalExpense = document.querySelector(".total-expense p");
  totalExpense.innerText = rupee + data["total_expense"].toLocaleString("en-IN");

  const budgetGoal = document.querySelector(".budget .goal__amount p");
  budgetGoal.innerText = rupee + data["budget_goal"].toLocaleString("en-IN");

  const amountSpent = document.querySelector(".budget .goal__progress p");
  amountSpent.innerText = rupee + data["current_month_expense"].toLocaleString("en-IN");
  setProgressBar("budget", data["budget_goal"]);

  const savignsGoal = document.querySelector(".savings .goal__amount p");
  savignsGoal.innerText = rupee + data["savings_goal"].toLocaleString("en-IN");

  const amountSaved = document.querySelector(".savings .goal__progress p");
  amountSaved.innerText = rupee + data["current_month_savings"].toLocaleString("en-IN");
  setProgressBar("savings", data["savings_goal"]);

  const recentTransactions = data["recent_transactions"];

  recentTransactions.forEach((transaction) => {
    const date = convertDate(transaction["date"]);
    const amount = rupee + transaction["amount"].toLocaleString("en-IN");
    const category = transaction["category"];
    const counterparty = transaction["counterparty"];
    const gainOrLoss = transaction["is_income"];
    const custom_msg = transaction["message"];

    const tableRow = document.createElement("tr");
    tableRow.setAttribute("title", custom_msg);

    const rowDate = td(date);
    rowDate.classList.add("date");
    const rowCategory = td(category);
    rowCategory.classList.add("category");
    
    const rowToFrom = td(counterparty);
    rowToFrom.classList.add("counterparty");
    let rowAmount;
    if (gainOrLoss == true) {
      tableRow.classList.add("gain");
      rowAmount = td("+" + amount);
    } else {
      rowAmount = td(amount);
    }
    rowAmount.classList.add("amount");

    tableRow.appendChild(rowDate);
    tableRow.appendChild(rowAmount);
    tableRow.appendChild(rowCategory);
    tableRow.appendChild(rowToFrom);

    const tableBody = document.querySelector("tbody");
    tableBody.appendChild(tableRow);
  });

  function td(data) {
    const td = document.createElement("td");
    td.innerText = data;
    return td;
  }
}

function convertDate(dateString) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let date = new Date(dateString);
  return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
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