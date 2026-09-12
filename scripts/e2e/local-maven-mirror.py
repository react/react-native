#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Serves a directory as a Maven repository and redirects misses to Maven Central.

CocoaPods only consumes the prebuilt React Native Core artifacts when they are
reachable over HTTP (see packages/react-native/scripts/cocoapods/rncore.rb), and
a CI run's version is never published. Point ENTERPRISE_REPOSITORY at this
server to serve locally built artifacts under their published names while
Hermes and everything else keep resolving from Maven Central.

Usage: local-maven-mirror.py <directory> <port>
"""

import functools
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM = "https://repo1.maven.org/maven2"


class MirrorRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        if os.path.isfile(self.translate_path(self.path)):
            return super().send_head()
        self.send_response(302)
        self.send_header("Location", UPSTREAM + self.path)
        self.end_headers()
        return None


def main(directory, port):
    handler = functools.partial(MirrorRequestHandler, directory=directory)
    print(f"Mirroring {directory} on port {port}, redirecting misses to {UPSTREAM}")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]))
