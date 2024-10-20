# app/main.py
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from backend.db import database
from backend.routes import collections, companies


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.Base.metadata.create_all(bind=database.engine)

    db = database.SessionLocal()
    if not db.query(database.Settings).get("seeded"):
        seed_database(db)

        db.add(database.Settings(setting_name="seeded"))
        db.commit()
        db.close()
    yield
    # Clean up...


app = FastAPI(lifespan=lifespan)


def seed_database(db: Session):
    db.execute(text("TRUNCATE TABLE company_collections CASCADE;"))
    db.execute(text("TRUNCATE TABLE companies CASCADE;"))
    db.execute(text("TRUNCATE TABLE company_collection_associations CASCADE;"))
    db.commit()

    companies = [database.Company(company_name=f"Company {i}", liked=False) for i in range(100000)]
    db.bulk_save_objects(companies)
    db.commit()

    liked_companies = database.CompanyCollection(collection_name="Liked Companies")
    db.add(liked_companies)
    db.commit()

    # No need to add associations for liked companies, as we're now using the 'liked' field on the Company model


app.include_router(companies.router)
app.include_router(collections.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)