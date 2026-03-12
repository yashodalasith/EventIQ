from fastapi import Header, HTTPException
from jose import JWTError, jwt
from app.core.config import JWT_SECRET


def decode_bearer_token(authorization: str | None = Header(default=None)):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = authorization.split(" ", maxsplit=1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def require_roles(*roles):
    def checker(payload=decode_bearer_token()):
        role = payload.get("role")
        if role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return payload

    return checker
