import mysql.connector as sql
from datetime import datetime

def get_db_connection():
  conn = sql.connect(
    host="localhost",
    user="root",
    password="root",
    database="budget_nest"
  )

  return conn

def register_user(uid, email):
  with get_db_connection() as conn:
    cursor = conn.cursor()

    query = """
              INSERT INTO user_data (uid, email)
              VALUES (%s, %s)
            """

    data = uid, email
    cursor.execute(query, data)
    conn.commit()

def get_user_data(uid, email):
  with get_db_connection() as conn:
    cursor = conn.cursor()

    query = """
              SELECT * FROM user_data
              WHERE uid=%s AND email=%s
            """

    data = uid, email
    cursor.execute(query, data)
    result_row = cursor.fetchone()

    user_data = {
      "total_income": result_row[2],
      "total_expense": result_row[3],
      "budget_goal": result_row[4],
      "savings_goal": result_row[5],
      "current_month_expense": result_row[6],
      "current_month_savings": result_row[7],
      "recent_transactions": get_transactions(uid, email, 10)
    }

    return user_data

def get_transactions(uid, email, limit = None, transaction_from_date = None, transaction_to_date =None):
  with get_db_connection() as conn:
    cursor = conn.cursor()
    
    if transaction_from_date and transaction_to_date:

      query = """
                SELECT * FROM transactions
                WHERE uid=%s AND email=%s AND date BETWEEN %s AND %s
                ORDER BY date DESC
              """
      data = uid, email, transaction_from_date, transaction_to_date
    else:

      query = """
                SELECT * FROM transactions
                WHERE uid=%s AND email=%s
                ORDER BY date DESC
              """
      data = uid, email

    cursor.execute(query, data)

    if limit:
      result_row = cursor.fetchmany(limit)
    else:
      result_row = cursor.fetchall()

    recent_transactions = []
    for row in result_row:
      transaction = {
        "transaction_id": row[0],
        "date": row[2],
        "amount": row[3],
        "category": row[4],
        "message": row[5],
        "counterparty": row[6],
        "is_income": row[8]
      }

      recent_transactions.append(transaction)

  print(recent_transactions)
  return recent_transactions

def setgoal(data):
  if "budget_goal" in data:
    goal_type = "budget_goal"
  else:
    goal_type = "savings_goal"

  uid = data.get("uid")
  email = data.get("email")
  goal_value = data.get(goal_type)
  query = f"""
            UPDATE user_data SET {goal_type} = %s
            WHERE uid = %s AND email = %s
          """
  data = goal_value, uid, email
  with get_db_connection() as conn:
    cursor = conn.cursor()

    cursor.execute(query, data)
    conn.commit()
    

def store_transacton(transaction_data):
  uid = transaction_data.get("uid")
  email = transaction_data.get("email")
  transaction_id = transaction_data.get("id")
  date = transaction_data.get("date")
  amount = transaction_data.get("amount")
  category = transaction_data.get("category")
  is_income = transaction_data.get("is_income")
  counterparty = transaction_data.get("counterparty")
  custom_message = transaction_data.get("message")

  if counterparty == "": counterparty = "-"

  query = """
            INSERT INTO transactions (uid, email, id, date, amount, category, is_income, counterparty, custom_msg)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
          """
  data = uid, email, transaction_id, date, amount, category, is_income, counterparty, custom_message

  with get_db_connection() as conn:
    cursor = conn.cursor()

    cursor.execute(query, data)
    conn.commit()
  update_user_data(uid, email)

def delete_transaction(uid, email, transaction_id):
  with get_db_connection() as conn:
    cursor = conn.cursor()



    query = """
              DELETE FROM transactions
              WHERE uid=%s AND email=%s AND id=%s
            """
    
    data = uid, email, transaction_id
    cursor.execute(query, data)
    conn.commit()
  update_user_data(uid, email)

def update_user_data(uid, email):
  with get_db_connection() as conn:
    cursor = conn.cursor()
    data = uid, email

    query = """
              SELECT SUM(amount) FROM transactions
              WHERE uid=%s AND email=%s AND is_income = 1
            """
    cursor.execute(query, data)
    total_income = cursor.fetchone()[0]

    query = """
              SELECT SUM(amount) FROM transactions
              WHERE uid=%s AND email=%s AND is_income = 0
            """

    cursor.execute(query, data)
    total_expense = cursor.fetchone()[0]

    currentMonth = datetime.now().month
    currentYear = datetime.now().year

    query = """
              SELECT SUM(amount) FROM transactions
              WHERE 
              uid=%s AND 
              email=%s AND 
              category != 'Savings' AND 
              is_income = 0 AND
              MONTH(date) = MONTH(now())
            """

    cursor.execute(query, data)
    current_expense = cursor.fetchone()[0]

    query = """
              SELECT SUM(amount) FROM transactions
              WHERE uid=%s AND
              email=%s AND
              category = 'Savings' AND
              MONTH(date) = MONTH(now())
            """

    cursor.execute(query, data)
    current_savings = cursor.fetchone()[0]

    if total_income is None: total_income = 0
    if total_expense is None: total_expense = 0
    if current_savings is None: current_savings = 0
    if current_expense is None: current_expense = 0

    query = """
              UPDATE user_data 
              SET total_income=%s, total_expense=%s, current_expense=%s, current_savings=%s
              WHERE uid=%s AND email=%s
            """
    data = total_income, total_expense, current_expense, current_savings, uid, email
    cursor.execute(query, data)
    conn.commit()

def update_transaction(transaction_data):
  query = """
            UPDATE transactions
            SET date=%s, amount=%s, category=%s, counterparty=%s, is_income=%s, custom_msg=%s
            WHERE uid=%s AND email=%s AND id=%s
          """
  data = transaction_data["date"], transaction_data["amount"], transaction_data["category"], transaction_data["counterparty"], transaction_data["is_income"], transaction_data["message"], transaction_data["uid"], transaction_data["email"], transaction_data["id"]

  with get_db_connection() as conn:
    cursor = conn.cursor()

    cursor.execute(query, data)
    conn.commit()

  update_user_data(transaction_data["uid"], transaction_data["email"])