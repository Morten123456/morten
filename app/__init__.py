import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Global database instance

db = SQLAlchemy()


def create_app() -> Flask:
    app = Flask(__name__, static_folder=os.path.join(os.getcwd(), "static"), static_url_path="/static")

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:////workspace/app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["APP_ENV"] = os.environ.get("APP_ENV", "dev")
    app.config["DAILY_SPIN_LIMIT"] = int(os.environ.get("DAILY_SPIN_LIMIT", "3"))
    app.config["FREE_ANON_SPINS_PER_DAY"] = int(os.environ.get("FREE_ANON_SPINS_PER_DAY", "1"))
    app.config["ORIGIN_ALLOWED"] = os.environ.get("ORIGIN_ALLOWED", "*")
    app.config["ADMIN_TOKEN"] = os.environ.get("ADMIN_TOKEN", "changeme-admin-token")
    app.config["HUBSPOT_PRIVATE_APP_TOKEN"] = os.environ.get("HUBSPOT_PRIVATE_APP_TOKEN", "")
    app.config["IP_HASH_SALT"] = os.environ.get("IP_HASH_SALT", "please-change-this-salt")
    app.config["FEATURE_CREATE_DEAL"] = os.environ.get("FEATURE_CREATE_DEAL", "false").lower() == "true"
    app.config["DEAL_PIPELINE_ID"] = os.environ.get("DEAL_PIPELINE_ID")
    app.config["DEAL_STAGE_ID"] = os.environ.get("DEAL_STAGE_ID")

    # Init extensions
    db.init_app(app)

    # CORS
    origins = app.config["ORIGIN_ALLOWED"]
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}, r"/healthz": {"origins": origins}},
        supports_credentials=False,
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Register routes
    from .routes import register_routes

    register_routes(app)

    # Ensure DB exists
    with app.app_context():
        db.create_all()

    # Serve index.html at root
    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    return app
