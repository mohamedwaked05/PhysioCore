from fastapi import FastAPI
from routers.analyze import router as analyze_router

app = FastAPI(title="PhysioCore AI Service", version="1.0.0")
app.include_router(analyze_router)


@app.get("/health")
def health():
    return {"status": "ok"}
