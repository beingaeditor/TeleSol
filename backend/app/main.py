from fastapi import FastAPI
from app.routers import sensors

app = FastAPI()

app.include_router(sensors.router)
