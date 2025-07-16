from pydantic import BaseModel, Field

from src.admin.schema import AdminSchema
from src.file.schema import FileSchema

class FileSchemaWithAdmin(FileSchema):
    admin: AdminSchema