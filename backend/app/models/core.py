from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileBase(BaseModel):
    display_name: str


class Profile(ProfileBase):
    id: UUID
    created_at: datetime


class HouseholdBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Name des Haushalts")


class HouseholdCreate(HouseholdBase):
    pass


class HouseholdUpdate(HouseholdBase):
    pass


class Household(HouseholdBase):
    id: UUID
    created_by: UUID | None = None
    created_at: datetime


class HouseholdMember(BaseModel):
    id: UUID
    household_id: UUID
    user_id: UUID
    role: str
    created_at: datetime


class HouseholdMemberView(BaseModel):
    user_id: UUID
    display_name: str
    role: str


class HouseholdDetails(BaseModel):
    id: UUID
    name: str
    members: list[HouseholdMemberView]


class HouseholdMemberAdd(BaseModel):
    user_id: UUID


class HouseholdMemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(member|admin)$")


class HouseholdInviteCreate(BaseModel):
    email: EmailStr


class HouseholdInvite(BaseModel):
    id: UUID
    household_id: UUID
    email: EmailStr
    invited_by: UUID
    role: str
    status: str
    token: str
    expires_at: datetime
    created_at: datetime


class HouseholdInviteView(BaseModel):
    id: UUID
    household_id: UUID
    email: EmailStr
    invited_by: UUID
    role: str
    status: str
    expires_at: datetime
    created_at: datetime
    email_delivery_status: str | None = None


class HouseholdPendingInvite(BaseModel):
    id: UUID
    household_id: UUID
    household_name: str
    email: EmailStr
    role: str
    status: str
    expires_at: datetime
    created_at: datetime


# Daniel 19.04.

class KanbanTaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    description: str = Field(default="", max_length=1000)
    status: str = Field(default="todo", pattern="^(todo|in_progress|done)$")


class KanbanTaskCreate(KanbanTaskBase):
    household_id: UUID


class KanbanTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    status: str | None = Field(default=None, pattern="^(todo|in_progress|done)$")
    position: int | None = None


class KanbanTask(BaseModel):
    id: UUID
    household_id: UUID
    title: str
    description: str
    status: str
    position: int
    created_by: UUID
    created_at: datetime