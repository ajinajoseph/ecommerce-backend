from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

cors = CORS()
db = SQLAlchemy()
jwt = JWTManager()
blacklisted_tokens = set()