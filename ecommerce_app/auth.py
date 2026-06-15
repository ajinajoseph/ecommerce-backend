from .enums import UserRole
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
from .models import User, Cart
from .extensions import db, blacklisted_tokens
from datetime import datetime, timedelta
import random
import smtplib
import re
import secrets
from email.mime.text import MIMEText

auth_bp = Blueprint("auth", __name__)

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = current_app.config["MAIL_USERNAME"]
    msg["To"] = to_email

    print(f"Mail to {to_email}: {body}")

    try:
        print("Connecting to SMTP server...")

        server = smtplib.SMTP(
            current_app.config["MAIL_SERVER"],
            current_app.config["MAIL_PORT"],
            timeout=5
        )

        print("Starting TLS...")
        server.starttls()

        print("Logging in...")
        server.login(
            current_app.config["MAIL_USERNAME"],
            current_app.config["MAIL_PASSWORD"]
        )

        print("Sending mail...")
        server.sendmail(
            current_app.config["MAIL_USERNAME"],
            [to_email],
            msg.as_string()
        )

        print("Mail sent successfully")

        server.quit()

    except Exception as e:
        print("Email sending failed:", str(e))

def validate_password(password):
    if len(password) < 6:
        return "password must be at least 6 characters long"

    pattern = r'^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$'
    if not re.match(pattern, password):
        return "password must contain at least one number and one special character"

    return None


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", UserRole.USER.value).strip().lower()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_pattern, email):
        return jsonify({"error": "invalid email format"}), 400

    password_error = validate_password(password)
    if password_error:
        return jsonify({"error": password_error}), 400

    valid_roles = [role.value for role in UserRole]
    if role not in valid_roles:
        return jsonify({
            "error": f"invalid role. allowed roles are: {', '.join(valid_roles)}"
        }), 400

    existing_user = User.query.filter(
        or_(User.username == username, User.email == email)
    ).first()

    if existing_user:
        return jsonify({"error": "username or email already exists"}), 409

    hashed_password = generate_password_hash(password)

    user = User(
        username=username,
        email=email,
        password=hashed_password,
        role=role
    )

    db.session.add(user)
    db.session.flush()

    if role == UserRole.USER.value:
        cart = Cart(user_id=user.id)
        db.session.add(cart)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to register user"}), 500

    if role == UserRole.USER.value:
        message = "User registered and cart created"
    else:
        message = f"{role.capitalize()} registered successfully"

    return jsonify({"message": message}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    if user.locked_until and datetime.utcnow() < user.locked_until:
        return jsonify({
            "error": "account is locked",
            "locked_until": user.locked_until.isoformat()
        }), 423

    if not check_password_hash(user.password, password):
        user.failed_attempts += 1

        if user.failed_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(
                minutes=current_app.config["ACCOUNT_LOCK_MINUTES"]
            )
            user.failed_attempts = 0

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"error": "failed to process login"}), 500

        return jsonify({"error": "invalid credentials"}), 401

    user.failed_attempts = 0
    user.locked_until = None
    user.otp_failed_attempts = 0
    user.otp_locked_until = None

    otp_code = str(random.randint(100000, 999999))

    user.otp_code = otp_code

    user.otp_expires_at = datetime.utcnow() + timedelta(
        minutes=current_app.config["OTP_EXPIRES_MINUTES"]
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to generate otp"}), 500

    try:
        send_email(
            user.email,
            "Your OTP Code",
            f"Your OTP for login is {otp_code}. It will expire in {current_app.config['OTP_EXPIRES_MINUTES']} minutes."
        )
    except Exception as e:
        print("OTP sending error:", str(e))

    print(f"OTP for {user.email}: {otp_code}")

    return jsonify({
        "message": "OTP generated successfully",
        "otp_for_testing": otp_code
    }), 200


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    otp = data.get("otp", "").strip()

    if not username or not otp:
        return jsonify({"error": "username and otp are required"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "invalid user"}), 404

    if user.otp_locked_until and datetime.utcnow() < user.otp_locked_until:
        return jsonify({
            "error": "otp verification locked",
            "locked_until": user.otp_locked_until.isoformat()
        }), 423

    if not user.otp_code or not user.otp_expires_at:
        return jsonify({"error": "no active otp"}), 400

    if datetime.utcnow() > user.otp_expires_at:
        user.otp_code = None
        user.otp_expires_at = None

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"error": "failed to clear expired otp"}), 500

        return jsonify({"error": "otp expired"}), 410

    if user.otp_code != otp:
        user.otp_failed_attempts += 1

        if user.otp_failed_attempts >= current_app.config["OTP_MAX_FAILED_ATTEMPTS"]:
            user.otp_locked_until = datetime.utcnow() + timedelta(
                minutes=current_app.config["OTP_LOCK_MINUTES"]
            )
            user.otp_failed_attempts = 0

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"error": "failed to process otp"}), 500

        return jsonify({"error": "invalid otp"}), 401

    user.otp_code = None
    user.otp_expires_at = None
    user.otp_failed_attempts = 0
    user.otp_locked_until = None

    session_token = secrets.token_hex(16)
    user.active_session_token = session_token

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to verify otp"}), 500

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"session_token": session_token}
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims={"session_token": session_token}
    )

    return jsonify({
        "message": "login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.role,
        "username": user.username,
        "email": user.email,
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "user not found"}), 404

    jwt_data = get_jwt()
    token_session = jwt_data.get("session_token")

    if not token_session or user.active_session_token != token_session:
        return jsonify({
            "error": "session expired due to login from another device"
        }), 401

    return jsonify({
        "username": user.username,
        "email": user.email,
        "role": user.role,
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "user not found"}), 404

    jwt_data = get_jwt()
    token_session = jwt_data.get("session_token")

    if not token_session or user.active_session_token != token_session:
        return jsonify({
            "error": "session expired due to login from another device"
        }), 401

    new_access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "session_token": user.active_session_token
        }
    )

    return jsonify({
        "access_token": new_access_token
    }), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}

    email = data.get("email", "").strip()

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "user not found"}), 404

    reset_otp = str(random.randint(100000, 999999))

    user.reset_otp = reset_otp

    user.reset_otp_expires_at = datetime.utcnow() + timedelta(
        minutes=current_app.config["RESET_OTP_EXPIRES_MINUTES"]
    )

    try:
        db.session.commit()

        send_email(
            user.email,
            "Password Reset OTP",
            f"Your password reset OTP is {reset_otp}. It will expire in {current_app.config['RESET_OTP_EXPIRES_MINUTES']} minutes."
        )

    except Exception as e:
        print("Reset OTP sending error:", str(e))

    print(f"Reset OTP for {user.email}: {reset_otp}")

    return jsonify({"message": "password reset otp sent"}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}

    email = data.get("email", "").strip()
    otp = data.get("otp", "").strip()
    new_password = data.get("new_password", "").strip()

    if not email or not otp or not new_password:
        return jsonify({"error": "email, otp and new_password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "user not found"}), 404

    if not user.reset_otp or not user.reset_otp_expires_at:
        return jsonify({"error": "no active reset otp"}), 400

    if datetime.utcnow() > user.reset_otp_expires_at:
        user.reset_otp = None
        user.reset_otp_expires_at = None

        db.session.commit()

        return jsonify({"error": "reset otp expired"}), 410

    if user.reset_otp != otp:
        return jsonify({"error": "invalid reset otp"}), 401

    password_error = validate_password(new_password)

    if password_error:
        return jsonify({"error": password_error}), 400

    user.password = generate_password_hash(new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    user.active_session_token = None

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to reset password"}), 500

    return jsonify({"message": "password reset successful"}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if user:
        user.active_session_token = None
        db.session.commit()

    jti = get_jwt()["jti"]
    blacklisted_tokens.add(jti)

    return jsonify({"message": "User logged out successfully"}), 200