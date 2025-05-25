from typing import List, Optional, Set, Union, Generator, Iterator, Dict, Any
import requests
from llama_index.core.schema import (
    Document
)

def string_metadata_dict(metadata: Dict[str, Any]) -> str:
    result = []
    if 'url' in metadata.keys():
        result.append(f"From url: {metadata['url']}")
    elif 'file_name' in metadata.keys():
        result.append(f"From file: {metadata['file_name']}")
        if 'page_label' in metadata.keys():
            result.append(f"Page: {metadata['page_label']}")
    else:
        for key, value in metadata.items():
            if key != 'doc_id':
                result.append(f"{str(key)}: {str(value)}")
    return " · ".join(result)


""" 
==============================================
    Custom Web Crawler Crawl4AI
==============================================
"""


class Crawl4AiReader:

    # Same token set in CRAWL4AI_API_TOKEN
    auth_secret: str = "Bloomers2_Suffix_Feisty_Gnarly_Version_Blinks"

    base_url: str

    default_config: Dict[str, Any] = {
        "priority": 10,
        "extra": {
            "only_text": True,
            "process_iframes": False
        },
        "crawler_params": {
            "magic": True,
            "headers": {
                "Accept-Language": "en-US,en;q=0.9"
            }
        }
    }

    browser_config_payload: Dict[str, Any] = {
        "type": "BrowserConfig",
        "params": {
            "headless": True,
            "extra_args": [
                "--no-sandbox",
                "--disable-gpu",
            ],
        }
    }

    crawler_config_payload: Dict[str, Any] = {
        "type": "CrawlerRunConfig",
        "params": {
            "stream": False,
            "cache_mode": "bypass"
        }
    }

    headers: Dict[str, str] = {}

    def __init__(self, base_url: str = "http://192.168.88.100:11235"):
        self.base_url = base_url

    async def crawl_urls(self, urls: str | List[str], user_request_data: dict, timeout: int = 300) -> dict | None:
        try:
            # Submit crawl job
            request_data = {
                "urls": urls,
                "browser_config": self.browser_config_payload,
                "crawler_config": self.crawler_config_payload
            }
            response = requests.post(
                url=f"{self.base_url}/crawl",
                json=request_data
            )

            if response.ok:
                return response.json()
            else:
                return None

        except Exception as inst:
            print(type(inst))    # the exception type
            print(inst.args)     # arguments stored in .args
            print(inst)
            return {}

    async def read_markdown_documents(self, urls: str | List[str], request_data: dict = {}) -> List[Document]:
        crawl_response = await self.crawl_urls(urls, request_data)

        if not crawl_response:
            return []

        if not crawl_response.get('results'):
            return []

        result: List[Document] = []
        for web_document in crawl_response["results"]:
            try:
                if not web_document.get('success'):
                    continue

                _metadata = web_document.get('metadata')
                _markdown = web_document.get('markdown')
                _cleaned_html = web_document.get('cleaned_html')

                result.append(
                    Document(
                        doc_id=web_document.get('url'),
                        text=_markdown.get(
                            "markdown_with_citations", _cleaned_html),
                        mimetype="text/markdown",
                        metadata={
                            "url": web_document.get('url'),
                            "title": _metadata.get('title', ''),
                            "description": _metadata.get('description', '')
                        }
                    )
                )
            except Exception as e:
                print(f"[read_markdown_documents] Exception: {e}")
                continue

        return result
