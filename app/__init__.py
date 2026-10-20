"""
FinSense Backend Application Package.

Applies Starlette 1.x / FastAPI 0.115 compatibility shim on import.
"""

import starlette.routing

_orig_starlette_router_init = starlette.routing.Router.__init__

def _compatibility_router_init(self, *args, **kwargs):
    on_startup = kwargs.pop("on_startup", None)
    on_shutdown = kwargs.pop("on_shutdown", None)
    self.on_startup = list(on_startup or [])
    self.on_shutdown = list(on_shutdown or [])
    return _orig_starlette_router_init(self, *args, **kwargs)

starlette.routing.Router.__init__ = _compatibility_router_init
