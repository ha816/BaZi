import json
from json import JSONDecodeError

from langchain.agents import AgentType, initialize_agent
from langchain_openai import ChatOpenAI

from langchain.tools import Tool

from application.port.llm_port import LlmPort
from domain.prompt import ChatPromptProvider, RecRestaurantPromptParams


class LlmAdapter(LlmPort):

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

    async def rec_restaurant(self, params: RecRestaurantPromptParams) -> list[dict]:
        prompt = ChatPromptProvider.rec_restaurants()
        messages = prompt.format_prompt(**params).to_messages()
        response = await self.llm.ainvoke(messages)
        content = response.content
        try:
            result = json.loads(content)
        except JSONDecodeError as e:
            print(f"JSON Decoding Error: {e} {content}")
            return []

        return result


# class AiAgentAdapter(LlmPort):
#     """
#     조금 머나먼 일인듯... 나중에 실제 프로프팅으로 해결할 일이 있으면 사용하는것으로...
#     """
#
#     def __init__(self):
#         """
#         https://developers.google.com/maps/documentation/places/web-service/search?hl=ko
#         nearbysearch 주변 검색
#         :param api_key: 구글맵 Open API 키
#         """
#         self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)
#
#         def simple_search_tool(query):
#             return f"Simulated search results for: {query}"
#
#         self.tools = [
#             Tool(
#                 name="Simple Search",
#                 func=simple_search_tool,
#                 description="Useful for searching information."
#             )
#         ]
#
#         self.rec_restaurant_template = ChatPromptTemplate([
#             ("system", """
#             You are an expert restaurant recommendation agent.
#             Provide {top_k} top recommendations in the restaurants based on the following conditions.
#             For each recommendation:
#                 - Provide a name
#                 - Give a brief explanation why it matches the condition
#                 - Include a relevance score from 1-5
#             """
#              ),
#             ("user", """
#              ### restaurants: {restaurants}
#              ### conditions: {conditions}
#              """
#              )])
#
#         self.agent = initialize_agent(self.tools, self.llm,
#                                       agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
#                                       verbose=True)
