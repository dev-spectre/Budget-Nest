import db
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def index():
  return render_template("index.html")

@app.route("/signup")
def sign_up():
  return render_template("signup.html")

@app.route("/home")
def home():
  return render_template("home.html")

@app.route("/transaction")
def transaction():
  return render_template("transaction.html")

@app.route("/history")
def history():
  return render_template("history.html")

@app.route("/reset")
def reset_password():
  return render_template("reset.html")

@app.route("/api/registerUser", methods=["POST"])
def register_user():
  user = request.get_json()
  db.register_user(user["uid"], user["email"])
  return "", 201

@app.route("/api/home/userData", methods=["GET"])
def data_home():
  uid = request.args.get("uid")
  email = request.args.get("email")
  user_data  = db.get_user_data(uid, email)

  return jsonify(user_data), 200

@app.route("/api/setGoal", methods=["PUT"])
def store_to_database():
  data = request.get_json()
  db.setgoal(data)

  return "", 204

@app.route("/api/storeTransaction", methods=["POST"])
def store_transaction_data():
  transaction_data = request.get_json()
  db.store_transacton(transaction_data)

  return "", 201

@app.route("/api/transactionHistory", methods=["GET"])
def send_transaction_history():
  uid = request.args.get("uid")
  email = request.args.get("email")
  limit = request.args.get("limit")
  if limit and limit.isdigit():
    limit = int(limit)
  transaction_from_date = request.args.get("from")
  transaction_to_date = request.args.get("to")
  if not (transaction_from_date and transaction_to_date):
    transaction_history = db.get_transactions(uid, email, limit)
  
  return jsonify(transaction_history), 200

@app.route("/api/deleteTransaction", methods=["DELETE"])
def delete_transaction():
  uid = request.args.get("uid")
  email = request.args.get("email")
  transaction_id = request.args.get("transactionId")

  db.delete_transaction(uid, email, transaction_id)

  return jsonify([uid, email, transaction_id]), 202

@app.route("/api/updateTransaction", methods=["PUT"])
def update_transaction():
  transaction_data = request.get_json()
  db.update_transaction(transaction_data)

  return "", 204

@app.route("/api/download_transactions", methods=["POST"])
def download_transactions():
  
  return "./transaction.pdf", 201

if __name__ == "__main__":
  app.run()