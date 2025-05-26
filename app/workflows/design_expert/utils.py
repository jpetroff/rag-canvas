import datetime
import inspect
from pygments import highlight
import rich
from llama_index.core.schema import NodeWithScore
from typing import List


def log(
    content: str,
    workflow: str = "",
    user: str = "",
    truncate: bool = True,
    next: str = "",
    **kwargs,
) -> None:
    TRUNCATE_LEN = 56
    _stack = inspect.stack()
    step_name = _stack[1][3]

    timestamp = datetime.datetime.now().strftime("%H:%M:%S · %d.%m.%y")

    _content = content
    # if truncate and len(content) > TRUNCATE_LEN:
    #     _content = content[:TRUNCATE_LEN] + "[normal][dim]<...>[/]"

    log_str = (
        f"[yellow]{(step_name+'():').ljust(32)}[/][dim]{user}—→{workflow}[/]\n"
        f"[dim]{timestamp.ljust(32)}[/]{_content}{ (' Next:[purple]'+next+'[/]') if next else ''}"
    )
    rich.get_console().print(log_str, highlight=False, crop=True)


def format_nodes(nodes: List[NodeWithScore]) -> str:
    result: str = ""
    for idx, node in enumerate(nodes):
        result += (
            f"<reference>\n"
            f"[{idx}|{node.id_}]. {str(node.metadata)}\n"
            f"{node.get_content()}\n"
            f"</reference>\n"
        )
    return result
