import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from backend.db import database
from backend.routes.companies import CompanyOutput

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)

class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str

class CompanyCollectionOutput(BaseModel):
    id: uuid.UUID
    collection_name: str
    companies: List[CompanyOutput]
    total: int

@router.get("", response_model=List[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()
    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]

@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: str,
    offset: int = Query(0, description="The number of items to skip from the beginning"),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    if collection_id == "liked-companies-id":
        collection = db.query(database.CompanyCollection).filter(database.CompanyCollection.collection_name == "Liked Companies").first()
        if not collection:
            collection = database.CompanyCollection(collection_name="Liked Companies")
            db.add(collection)
            db.commit()
    else:
        try:
            collection_uuid = uuid.UUID(collection_id)
            collection = db.query(database.CompanyCollection).filter(database.CompanyCollection.id == collection_uuid).first()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid collection ID format")

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    query = db.query(database.Company).join(database.CompanyCollectionAssociation).filter(
        database.CompanyCollectionAssociation.collection_id == collection.id
    )

    total = query.count()
    companies = query.offset(offset).limit(limit).all()

    return CompanyCollectionOutput(
        id=collection.id,
        collection_name=collection.collection_name,
        companies=[CompanyOutput(id=c.id, company_name=c.company_name, liked=True) for c in companies],
        total=total,
    )

# Remove the separate "liked-companies" endpoint as it's now handled in the main endpoint