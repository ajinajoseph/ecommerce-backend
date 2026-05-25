import os
from io import BytesIO
from flask import Flask, send_from_directory, send_file, current_app
from .config import Config
from .extensions import db, jwt, blacklisted_tokens
from .extensions import cors

def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    jwt.init_app(app)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["THUMBNAIL_FOLDER"], exist_ok=True)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload["jti"] in blacklisted_tokens

    from .auth import auth_bp
    from .routes import shop_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(shop_bp)

    @app.route("/")
    def home():
        return {"message": "E-commerce Backend API is running"}

    @app.route("/media/products/<path:filename>")
    def get_product_file(filename):
        if current_app.config.get("USE_S3"):
            from .s3_utils import get_s3_object
            try:
                data, content_type = get_s3_object(f"products/{filename}")
            except FileNotFoundError:
                return {"error": "file not found"}, 404
            return send_file(BytesIO(data), mimetype=content_type, download_name=filename)
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/media/thumbnails/<path:filename>")
    def get_thumbnail_file(filename):
        if current_app.config.get("USE_S3"):
            from .s3_utils import get_s3_object
            try:
                data, content_type = get_s3_object(f"thumbnails/{filename}")
            except FileNotFoundError:
                return {"error": "file not found"}, 404
            return send_file(BytesIO(data), mimetype=content_type, download_name=filename)
        return send_from_directory(app.config["THUMBNAIL_FOLDER"], filename)
    cors.init_app(app)
    return app