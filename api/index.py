from fastapi import FastAPI

app = FastAPI()

@app.get("/api/py/hello")
def hello_pilot():
    return {"message": "Hello from the Python Flight Engine!"}