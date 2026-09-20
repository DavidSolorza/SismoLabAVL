# -*- coding: utf-8 -*-
"""
Native HTTP Client / Cliente HTTP Nativo
SismoLab AVL - Universidad de Caldas

Cumple con la REGLA DE ORO PROHIBICIÓN DE SDKs COMERCIALES.
Utiliza la librería estándar urllib de Python para peticiones REST/HTTP directas.
Complies with the GOLDEN RULE PROHIBITION OF COMMERCIAL SDKs.
Uses standard Python urllib for direct REST/HTTP requests.
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class NativeHttpClient:
    """
    Cliente HTTP NATIVO puro sin dependencias externas comerciales.
    Pure NATIVE HTTP Client without external commercial dependencies.
    """
    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    def get(self, url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Petición HTTP GET nativa / Native HTTP GET request
        """
        req = urllib.request.Request(url, headers=headers or {}, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = response.read().decode('utf-8')
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            return {"status_code": e.code, "error": error_body}
        except Exception as e:
            return {"status_code": 500, "error": str(e)}

    def post(self, url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Petición HTTP POST nativa / Native HTTP POST request
        """
        data = json.dumps(payload).encode('utf-8')
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, data=data, headers=req_headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = response.read().decode('utf-8')
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            return {"status_code": e.code, "error": error_body}
        except Exception as e:
            return {"status_code": 500, "error": str(e)}
