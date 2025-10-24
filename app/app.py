from . import create_app

app = create_app()

if __name__ == "__main__":
    # For Replit or local run
    app.run(host="0.0.0.0", port=8000)
