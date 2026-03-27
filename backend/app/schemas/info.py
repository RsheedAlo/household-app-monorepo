from pydantic import BaseModel


class ApiInfo(BaseModel):
    name: str
    status: str
    modules: list[str]

