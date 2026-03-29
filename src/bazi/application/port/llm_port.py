from abc import ABC, abstractmethod

from pydantic import BaseModel
from typing_extensions import Required, TypedDict

from domain.place import DetailRestaurant, Restaurant
from domain.prompt import RecRestaurantPromptParams, RestaurantForPrompt
from domain.weather import WeatherInfo


class LlmPort(ABC):

    @abstractmethod
    async def rec_restaurant(self, params: RecRestaurantPromptParams) -> list[dict]:
        pass


class RecRestaurantPromptParamsHelper:

    @staticmethod
    def of(restaurants: list[Restaurant],
           detail_restaurant_by_id: dict[str, DetailRestaurant],
           weather_info: WeatherInfo) -> RecRestaurantPromptParams:
        restaurants_for_prompt: list[RestaurantForPrompt] = []
        for restaurant in restaurants:
            detail_restaurant: DetailRestaurant = detail_restaurant_by_id[restaurant.place_id]
            restaurant_for_prompt = RestaurantForPrompt(place_id=restaurant.place_id,
                                                        name=restaurant.name,
                                                        rating=restaurant.rating,
                                                        rating_count=restaurant.rating_count,
                                                        address=restaurant.address,
                                                        price_level=restaurant.price_level,
                                                        types=restaurant.types,
                                                        location=restaurant.location,
                                                        description=detail_restaurant.description,
                                                        website=detail_restaurant.website,
                                                        reviews=detail_restaurant.reviews,
                                                        opening_hours=detail_restaurant.opening_hours,
                                                        delivery=detail_restaurant.delivery,
                                                        dine_in=detail_restaurant.dine_in,
                                                        reservable=detail_restaurant.reservable,
                                                        takeout=detail_restaurant.takeout)
            restaurants_for_prompt.append(restaurant_for_prompt)

        params: RecRestaurantPromptParams = {
            "restaurants": restaurants_for_prompt,
            "situations": [{"weather_info": weather_info}],
            "conditions": [],
        }
        return params
