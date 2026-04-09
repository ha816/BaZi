from abc import ABC, abstractmethod


class LlmPort(ABC):

    @property
    @abstractmethod
    def available(self) -> bool:
        pass

    @abstractmethod
    async def get_advice(self, params: dict) -> str:
        pass