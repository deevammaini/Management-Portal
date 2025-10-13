#!/usr/bin/env python3
"""
Script to reset Aman's password in the database
"""

import bcrypt
import os
from flask_backend_mysql import execute_query

def reset_aman_password():
    """Reset Aman's password to a known value"""
    
    # New password for Aman
    new_password = "aman123"  # Change this to whatever you want
    
    # Hash the new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update Aman's password in the database
    query = "UPDATE users SET password_hash = %s WHERE employee_id = %s AND user_type = 'employee'"
    
    try:
        result = execute_query(query, (password_hash, '50099'))
        if result is not None:
            print(f"✅ Password reset successful!")
            print(f"Employee ID: 50099")
            print(f"New Password: {new_password}")
            print(f"Password Hash: {password_hash}")
        else:
            print("❌ Failed to reset password")
    except Exception as e:
        print(f"❌ Error resetting password: {e}")

if __name__ == "__main__":
    reset_aman_password()
