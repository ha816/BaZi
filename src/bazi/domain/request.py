from typing_extensions import Required, TypedDict


class NearbyRequestParams(TypedDict, total=False):
    lat: Required[float]
    lon: Required[float]
    radius: Required[int]
    min_rating: float
    language: str


class NearbyPlacesRequestParams(TypedDict, total=False):
    """
    https://developers.google.com/maps/documentation/places/web-service/search-nearby?hl=ko&_gl=1*p2nuk7*_up*MQ..*_ga*MTM4MTEyNzU5NC4xNzMzNTM2MTU1*_ga_NRWSTWS78N*MTczMzUzNjE1NS4xLjEuMTczMzUzNjE1Ni4wLjAuMA..#rankby
    """
    location: str  # "latitude,longitude"
    radius: int  # distance (in meters)
    language: str
    type: str
    rankby: str
    opennow: bool
    minprice: int
    maxprice: int
    page_token: str


class NearbyPlacesRequestParamsHelper:
    @staticmethod
    def of(lat: float, lon: float, radius: int, type: str, language='ko', page_token="") -> NearbyPlacesRequestParams:
        instance = {"location": f"{lat},{lon}", "radius": radius, 'type': type, 'language': language}
        if page_token:
            instance["page_token"] = page_token
        return instance
