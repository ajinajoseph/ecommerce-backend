from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from .models import User
from .enums import UserRole


def session_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        jwt_data = get_jwt()

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        token_session = jwt_data.get("session_token")
        if not token_session or user.active_session_token != token_session:
            return jsonify({"error": "session expired due to login from another device"}), 401

        return fn(*args, **kwargs)
    return wrapper


def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            jwt_data = get_jwt()

            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "user not found"}), 404

            token_session = jwt_data.get("session_token")
            if not token_session or user.active_session_token != token_session:
                return jsonify({"error": "session expired due to login from another device"}), 401

            expected_role = required_role.value if hasattr(required_role, "value") else required_role

            if user.role != expected_role:
                return jsonify({"error": f"{expected_role} access required"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator