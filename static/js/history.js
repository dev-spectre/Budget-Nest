"use strict";

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

const transactionsMap = {};
let transactions = [];
const email = localStorage.getItem("email");
const uid = localStorage.getItem("uid");

fetch(`/api/transactionHistory?uid=${uid}&email=${email}`)
  .then((res) => res.json())
  .then((data) => {
    fillTableData(data, transactionsMap, transactions);
  })
  .catch((err) => {
    console.error(err);
    const errorMessage = getErrorMessage(err.code);
    alertUser(errorMessage);
  });

const sortButton = document.querySelector(".btn.sort");
const sortSelect = sortButton.nextElementSibling;
sortButton.addEventListener("click", () => {
  sortButton.nextElementSibling.classList.toggle("hidden");
});

let isFilterMode = false;
const selectedCategories = [];
let sortMode = "date_dsc";
let fromDate;
let toDate;
let filteredTransactions = [];
sortSelect.childNodes.forEach((childNode) => {
  childNode.addEventListener("click", () => {
    if (isFilterMode) {
      sortTransactions(filteredTransactions, childNode.value);
      fillTableData(filteredTransactions);
    } else {
      sortTransactions(transactions, childNode.value);
      fillTableData(transactions, transactionsMap);
    }
    sortSelect.classList.toggle("hidden");
  });
});

const filterButton = document.querySelector("button.filter");
const filterModal = filterButton.nextElementSibling;
filterButton.addEventListener("click", () => {
  filterModal.showModal();
  document.querySelector("#from-date").value = "";
  document.querySelector("#to-date").value = "";
});

const modalCloseButton = document.querySelector("dialog .btn--cancel");
modalCloseButton.addEventListener("click", () => {
  const filterInputs = document.querySelectorAll("input[type='checkbox']");
  filterInputs.forEach((input) => {
    input.checked = false;
    const label = document.querySelector(`label[for="${input.id}"]`);
    label.classList.remove("selected");
  });
  filterModal.close();
});

const filterCategory = document.querySelectorAll("label.category");
filterCategory.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
});

const filterSubmitButton = document.querySelector("dialog .btn--filter");
filterSubmitButton.addEventListener("click", () => {
  const selectedCategoryButtons = document.querySelectorAll("dialog label.selected");
  selectedCategories.splice(0, selectedCategories.length);
  selectedCategoryButtons.forEach((btn) => {
    const input = document.querySelector(`input#${btn.getAttribute("for")}`);
    selectedCategories.push(input.value);
  });

  fromDate = document.querySelector("#from-date").value;
  toDate = document.querySelector("#to-date").value;

  isFilterMode = fromDate || selectedCategories.length;

  filteredTransactions = filterTransactions(transactions, selectedCategories, fromDate, toDate);
  if (isFilterMode) fillTableData(filteredTransactions);
  else fillTableData(transactions, transactionsMap);

  filterSubmitButton.parentElement.parentElement.close();
  selectedCategoryButtons.forEach((btn) => {
    btn.classList.remove("selected");
  });
});

const deleteConfirmationModalCloseButton = document.querySelector(".delete-confirmation");
deleteConfirmationModalCloseButton.addEventListener("click", () => {
  const deleteConfirmationModal = document.querySelector(".delete-confirmation");
  deleteConfirmationModal.close();
});

let targetNode;
const deleteConfirmationModalDeleteButton = document.querySelector(".delete-transaction");
deleteConfirmationModalDeleteButton.addEventListener("click", () => {
  const deleteConfirmationModal = document.querySelector(".delete-confirmation");
  deleteConfirmationModal.close();
  const transactionId = targetNode.getAttribute("data-id");
  fetch(`/api/deleteTransaction?uid=${uid}&email=${email}&transactionId=${transactionId}`, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) return;
      targetNode.remove();
      let index = transactionsMap[transactionId];
      transactions.splice(index, 1);
    })
    .catch((err) => {
      const errorMessage = getErrorMessage(err.code);
      alertUser(errorMessage);
    });
});

const editModalCancelButton = document.querySelector(".edit-modal .btn--cancel");
editModalCancelButton.addEventListener("click", () => {
  const editModal = document.querySelector(".edit-modal");
  editModal.close();
});

const radioInputs = document.querySelectorAll("input[type='radio']");
radioInputs.forEach((input) => {
  disableInput(input);
  input.addEventListener("change", disableInput.bind(input, input));
});

const submitButton = document.querySelector("button[type='submit']");
submitButton.addEventListener("click", (event) => {
  event.preventDefault();
  const form = document.forms[1];
  const formData = new FormData(form);
  const transactionData = {};
  let isFormIncomplete = false;
  formData.forEach((value, key) => {
    if (value === "" && !(key === "message" || key === "counterparty")) {
      alertUser("Please fill all the details");
      isFormIncomplete = true;
    }
    key = key === "income_expense" ? "is_income" : key;
    value = key === "is_income" ? value === "income" : value;
    transactionData[key] = value;
  });
  const transactionId = document.querySelector(".edit-modal").getAttribute("data-id");
  transactionData["id"] = transactionId;
  transactionData["email"] = localStorage.getItem("email");
  transactionData["uid"] = localStorage.getItem("uid");
  if (isFormIncomplete) return;
  fetch("/api/updateTransaction", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(transactionData),
  })
    .then((res) => {
      if (res.ok) {
        const index = transactionsMap[transactionId];
        transactions[index] = transactionData;

        sortTransactions(transactions, sortMode);
        fillTableData(transactions, transactionsMap);
      } else {
        console.error(res);
      }

      const editModal = document.querySelector(".edit-modal");
      editModal.close();
    })
    .catch((err) => {
      console.error(err);
      const errorMessage = getErrorMessage(err.code);
      alertUser(errorMessage);
    });
});

const category = document.querySelector("select");
displayCustomMessage();
category.addEventListener("change", displayCustomMessage);

function displayCustomMessage() {
  if (category.value === "Other") {
    category.nextElementSibling.style.display = "inline";
  } else {
    category.nextElementSibling.style.display = "none";
  }
}

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

function convertDate(dateString) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let date = new Date(dateString);
  return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function fillTableData(data, map = {}, dataCopy = null) {
  const rupee = "₹";
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  console.log(data);

  data.forEach((transaction, index) => {
    dataCopy?.push({ ...transaction });

    const transactionId = transaction["transaction_id"];
    const date = convertDate(transaction["date"]);
    const amount = rupee + transaction["amount"].toLocaleString("en-IN");
    const category = transaction["category"];
    const counterparty = transaction["counterparty"] === "" ? "-" : transaction["counterparty"];
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
    tableRow.setAttribute("data-id", transactionId);
    tableRow.innerHTML += `
      <td class="actions">
        <div class="hidden">
          <button class="edit">
            <img src="../static/assets/edit-transaction.svg" alt="Edit">
            <span>Edit</span>
          </button>
          <button class="delete">
            <img src="../static/assets/delete.svg" alt="delete">
            <span>Delete</span>
          </button>
        </div>
        <button class="more-opt">
          <img src="../static/assets/more.svg" alt="More options">
        </button>
      </td>
    `;

    tbody.appendChild(tableRow);

    const moreOptionButton = tableRow.lastElementChild.children[1];
    moreOptionButton.addEventListener("click", () => {
      const activeButton = document.querySelector(".actions > div:not(.hidden)");
      activeButton?.classList.toggle("hidden");
      const actions = moreOptionButton.previousElementSibling;
      if (activeButton === actions) return;
      actions.classList.toggle("hidden");
    });

    const deleteButton = tableRow.lastElementChild.children[0].children[1];
    deleteButton.addEventListener("click", (e) => {
      const deleteConfirmationModal = document.querySelector(".delete-confirmation");
      deleteConfirmationModal.showModal();
      targetNode = e.target.parentElement.parentElement.parentElement.parentElement;
      const activeButton = document.querySelector(".actions > div:not(.hidden)");
      activeButton?.classList.toggle("hidden");
    });

    const editButton = tableRow.lastElementChild.children[0].children[0];
    editButton.addEventListener("click", () => {
      const tableRow = editButton.parentElement.parentElement.parentElement;
      const editModal = document.querySelector(".edit-modal");
      const activeButton = document.querySelector(".actions > div:not(.hidden)");
      const transactionId = tableRow.getAttribute("data-id");
      fillEditModalDetails(transactionId);
      editModal.setAttribute("data-id", transactionId);
      activeButton?.classList.toggle("hidden");
      editModal.showModal();
    });

    map[transactionId] = index;
  });

  function td(data) {
    const td = document.createElement("td");
    td.innerText = data;
    return td;
  }
}

function sortTransactions(transactions, sortMode) {
  switch (sortMode) {
    case "amount_asc":
      transactions.sort((a, b) => {
        return a["amount"] - b["amount"];
      });
      break;
    case "amount_dsc":
      transactions.sort((a, b) => {
        return b["amount"] - a["amount"];
      });
      break;
    case "date_asc":
      transactions.sort((a, b) => {
        return new Date(a["date"]) - new Date(b["date"]);
      });
      break;
    case "date_dsc":
      transactions.sort((a, b) => {
        return new Date(b["date"]) - new Date(a["date"]);
      });
      break;
  }
}

function filterTransactions(array, categories, startDate, endDate) {
  if (!endDate) {
    endDate = new Date();
  }

  if (categories.length === 0) {
    return array.filter((item) => {
      if (startDate) {
        let itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      }
      return false;
    });
  }

  return array.filter((item) => {
    if (categories.includes(item.category)) {
      if (startDate) {
        let itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      }
      return true;
    }
    return false;
  });
}

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

function alertUser(message) {
  const modalMessage = document.querySelector(".dialog-message");
  modalMessage.innerText = message;
  const modal = document.querySelector(".alert");
  modal.showModal();
}

const alertModalCloseButton = document.querySelector(".alert .close");
alertModalCloseButton.addEventListener("click", () => {
  const modal = document.querySelector(".alert");
  modal.close();
});

function fillEditModalDetails(transactionId) {
  const index = transactionsMap[transactionId];
  const transactionData = transactions[index];
  console.log(transactionData);
  const from = document.querySelector("#from");
  const to = document.querySelector("#to");
  from.value = "";
  to.value = "";
  if (transactionData["is_income"] == true) {
    const incomeRadio = document.querySelector("#income");
    incomeRadio.checked = true;
    from.value = transactionData["counterparty"] === "-" ? "" : transactionData["counterparty"];
    from.disabled = false;
    to.disabled = true;
  } else {
    const expenseRadio = document.querySelector("#expense");
    expenseRadio.checked = true;
    to.value = transactionData["counterparty"];
    from.disabled = true;
    to.disabled = false;
  }
  const amount = document.querySelector("#amount");
  amount.value = transactionData["amount"];

  const dateInput = document.querySelector("#date");
  const dateValue = new Date(transactionData["date"]);
  const year = dateValue.getFullYear();
  const month = (dateValue.getMonth() + 1).toString().padStart(2, "0");
  const date = dateValue.getDate().toString().padStart(2, "0");
  dateInput.value = `${year}-${month}-${date}`;

  const category = document.querySelector(`option[value="${transactionData["category"]}"]`);
  category.selected = true;

  if (category.value === "Other") {
    const customMessage = document.querySelector("input[name='message']");
    customMessage.value = transactionData["message"];
  }
  displayCustomMessage();
}


const downloadButton = document.querySelector("button.download");
downloadButton.addEventListener("click", () => {
  if (isFilterMode) {
    createPDF(filteredTransactions);
  } else {
    createPDF(transactions);
  }
})

function createPDF(data) {
  const doc = new jsPDF();
  const timeZoneOffset = new Date().getTimezoneOffset() * 60000;

  const dataCopy = JSON.parse(JSON.stringify(data));

  dataCopy.forEach(function(item) {
      var localDateTime = new Date(new Date(item.date) - timeZoneOffset);
      item.date = localDateTime.toISOString().slice(0,10).split("-").reverse().join("-");
  });

  doc.autoTable({
      head: [["Date", "Amount (INR)", "To/From", "Category", "Description"]],
      body: dataCopy.map(item => {
        let amount;
        if (item.is_income) {
          amount = "+" + item.amount;
        } else {
          amount = item.amount;
        }
        return [item.date, amount, item.counterparty, item.category, item.message]
      })
  });

  const timestamp = (new Date()).getTime()
  doc.save(`Transaction_History_${timestamp}.pdf`);
}