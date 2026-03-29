from abc import ABC, abstractmethod

from domain.request import NearbyPlacesRequestParams


class PlacePort(ABC):

    @abstractmethod
    async def get_places(self, query: str, language: str) -> dict:
        pass

    @abstractmethod
    async def get_place(self, place_id: str, language: str) -> dict:
        pass


    @abstractmethod
    async def get_nearby_places(self, params: NearbyPlacesRequestParams) -> dict:
        pass

    @abstractmethod
    def get_image_url(self, photo_reference: str, max_width=int, max_height=int) -> str:
        pass


class LocationPort(ABC):

    @abstractmethod
    async def get_current_location(self) -> dict:
        pass
