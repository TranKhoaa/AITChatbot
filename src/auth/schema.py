from pydantic import BaseModel, Field
from typing import Optional, List

class UserCreateSchema(BaseModel):
    name: str
    password: str = Field(min_length=8, max_length=128)

class AdminCreateSchema(BaseModel):
    name: str
    password: str = Field(min_length=8, max_length=128)

class UserLoginSchema(BaseModel):
    name: str
    password: str

class AdminLoginSchema(BaseModel):
    name: str
    password: str