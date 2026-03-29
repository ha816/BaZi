from abc import ABC, abstractmethod

class LlmPort(ABC):

    @abstractmethod
    async def get_saju(self, params: dict) -> dict:
        pass