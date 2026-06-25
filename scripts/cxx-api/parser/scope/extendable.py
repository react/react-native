# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations


class Extendable:
    class Base:
        def __init__(
            self, name: str, protection: str, virtual: bool, refid: str
        ) -> None:
            self.name: str = name
            self.protection: str = protection
            self.virtual: bool = virtual
            self.refid: str = refid

    def __init__(self) -> None:
        self.base_classes = []

    def add_base(self, base: Base | list[Base]) -> None:
        if isinstance(base, list):
            for b in base:
                self.base_classes.append(b)
        else:
            self.base_classes.append(base)
        self._deduplicate_base_classes()

    def _deduplicate_base_classes(self) -> None:
        """Remove duplicate base classes.

        Doxygen sometimes reports the same base class multiple times (e.g.
        when template argument substitution produces identical names for
        a primary template and its specialization).  This keeps only the
        last occurrence of each name.
        """
        seen: dict[str, int] = {}
        for i, base in enumerate(self.base_classes):
            seen[base.name] = i
        self.base_classes = [self.base_classes[i] for i in sorted(seen.values())]

    def qualify_base_classes(self, scope) -> None:
        """Qualify base class names and their template arguments."""
        from ..utils import qualify_type_str

        for base in self.base_classes:
            base.name = qualify_type_str(base.name, scope)

    def get_inheritance_string(self) -> str:
        bases = []
        for base in self.base_classes:
            base_text = [base.protection]
            if base.virtual:
                base_text.append("virtual")
            base_text.append(base.name)
            bases.append(" ".join(base_text))

        return (" : " + ", ".join(bases)) if bases else ""
