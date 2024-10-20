from typing import List
import logging

from backend.db import database

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, select, case
from pydantic import BaseModel


router = APIRouter(
    prefix="/companies",
    tags=["companies"],
)

class CompanyOutput(BaseModel):
    id: int
    company_name: str
    liked: bool

class CompanyBatchOutput(BaseModel):
    companies: List[CompanyOutput]
    total: int

class CompanyIds(BaseModel):
    ids: List[int]

@router.get("", response_model=CompanyBatchOutput)
def get_companies(
    offset: int = Query(0, description="The number of items to skip from the beginning"),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    logging.info(f"Fetching companies with offset {offset} and limit {limit}")

    # Subquery to get liked company IDs
    liked_subquery = (
        select(database.CompanyCollectionAssociation.company_id)
        .join(database.CompanyCollection)
        .where(database.CompanyCollection.collection_name == "Liked Companies")
        .subquery()
    )

    # Query for fetching companies
    company_query = (
        select(
            database.Company.id,
            database.Company.company_name,
            case((liked_subquery.c.company_id.isnot(None), True), else_=False).label("liked")
        )
        .outerjoin(liked_subquery, database.Company.id == liked_subquery.c.company_id)
        .order_by(database.Company.id)
        .offset(offset)
        .limit(limit)
    )

    # Execute company query
    companies = db.execute(company_query).fetchall()

    # Query for total count
    count_query = select(func.count()).select_from(database.Company)
    total = db.scalar(count_query)

    logging.info(f"Found {len(companies)} companies. Total count: {total}")

    return CompanyBatchOutput(
        companies=[
            CompanyOutput(id=company.id, company_name=company.company_name, liked=company.liked)
            for company in companies
        ],
        total=total,
    )


@router.post("/{company_id}/toggle-like", response_model=CompanyOutput)
def toggle_company_like(
    company_id: int,
    db: Session = Depends(database.get_db)
):
    company = db.query(database.Company).filter(database.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    liked_collection = db.query(database.CompanyCollection).filter(database.CompanyCollection.collection_name == "Liked Companies").first()
    if not liked_collection:
        liked_collection = database.CompanyCollection(collection_name="Liked Companies")
        db.add(liked_collection)
        db.commit()

    association = db.query(database.CompanyCollectionAssociation).filter(
        database.CompanyCollectionAssociation.company_id == company_id,
        database.CompanyCollectionAssociation.collection_id == liked_collection.id
    ).first()

    if association:
        db.delete(association)
        liked = False
    else:
        new_association = database.CompanyCollectionAssociation(
            company_id=company_id,
            collection_id=liked_collection.id
        )
        db.add(new_association)
        liked = True

    db.commit()

    return CompanyOutput(id=company.id, company_name=company.company_name, liked=liked)


@router.post("/add-to-liked", response_model=List[CompanyOutput])
def add_companies_to_liked(
    company_ids: CompanyIds,
    db: Session = Depends(database.get_db)
):
    liked_collection = db.query(database.CompanyCollection).filter(database.CompanyCollection.collection_name == "Liked Companies").first()
    if not liked_collection:
        liked_collection = database.CompanyCollection(collection_name="Liked Companies")
        db.add(liked_collection)
        db.commit()

    companies = db.query(database.Company).filter(database.Company.id.in_(company_ids.ids)).all()
    
    for company in companies:
        association = db.query(database.CompanyCollectionAssociation).filter(
            database.CompanyCollectionAssociation.company_id == company.id,
            database.CompanyCollectionAssociation.collection_id == liked_collection.id
        ).first()
        
        if not association:
            new_association = database.CompanyCollectionAssociation(
                company_id=company.id,
                collection_id=liked_collection.id
            )
            db.add(new_association)

    db.commit()

    return [CompanyOutput(id=c.id, company_name=c.company_name, liked=True) for c in companies]

@router.post("/remove-from-liked", response_model=List[CompanyOutput])
def remove_companies_from_liked(
    company_ids: CompanyIds,
    db: Session = Depends(database.get_db)
):
    liked_collection = db.query(database.CompanyCollection).filter(database.CompanyCollection.collection_name == "Liked Companies").first()
    if not liked_collection:
        raise HTTPException(status_code=404, detail="Liked Companies collection not found")

    companies = db.query(database.Company).filter(database.Company.id.in_(company_ids.ids)).all()
    
    for company in companies:
        association = db.query(database.CompanyCollectionAssociation).filter(
            database.CompanyCollectionAssociation.company_id == company.id,
            database.CompanyCollectionAssociation.collection_id == liked_collection.id
        ).first()
        
        if association:
            db.delete(association)

    db.commit()

    return [CompanyOutput(id=c.id, company_name=c.company_name, liked=False) for c in companies]