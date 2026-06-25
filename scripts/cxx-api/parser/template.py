# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re


def _normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace by collapsing multiple consecutive whitespace
    characters into a single space.
    """
    return re.sub(r"\s+", " ", text).strip()


class Template:
    def __init__(self, type: str, name: str, value: str | None) -> None:
        self.type: str = type
        self.name: str = name
        self.value: str | None = _normalize_whitespace(value) if value else value

    def to_string(self) -> str:
        # Handle unnamed template parameters (e.g., "typename = std::enable_if_t<...>")
        # When the name is empty or None, we just output "type = value" or "type"
        if not self.name:
            if self.value is None:
                return self.type
            else:
                return f"{self.type} = {self.value}"

        if self.value is None:
            return f"{self.type} {self.name}"
        else:
            return f"{self.type} {self.name} = {self.value}"


class TemplateList:
    def __init__(self) -> None:
        self.templates: [Template] = []

    def add(self, template: Template) -> None:
        self.templates.append(template)

    def to_string(self) -> str:
        return f"template <{', '.join([template.to_string() for template in self.templates])}>"
