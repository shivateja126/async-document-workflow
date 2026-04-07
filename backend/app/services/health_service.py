from __future__ import annotations

from app.core.database import check_database_health
from app.core.redis import check_redis_health


class HealthService:
    async def liveness(self) -> dict[str, str]:
        return {"status": "ok"}

    async def readiness(self) -> dict[str, str]:
        await check_database_health()
        await check_redis_health()
        return {"status": "ready"}
