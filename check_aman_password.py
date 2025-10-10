import mysql.connector
from flask_backend_mysql import DB_CONFIG

def check_aman_password():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Get Aman Kumar's password hash
        cursor.execute("SELECT employee_id, name, password_hash FROM users WHERE employee_id = '50099'")
        result = cursor.fetchone()
        
        if result:
            print(f"Employee: {result[1]} (ID: {result[0]})")
            print(f"Password Hash: {result[2]}")
        else:
            print("Employee not found")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_aman_password()
