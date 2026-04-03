from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

#Profiles
class ProfileBase(BaseModel):
    display_name: str

class Profile(ProfileBase):
    id: UUID
    created_at: datetime

#Households
class HouseholdBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Name des Haushalts")

class HouseholdCreate(HouseholdBase):
    pass # Für POST-Request

class Household(HouseholdBase):
    id: UUID
    created_at: datetime

#Household Members
class HouseholdMember(BaseModel):
    id: UUID
    household_id: UUID
    user_id: UUID
    role: str
    created_at: datetime