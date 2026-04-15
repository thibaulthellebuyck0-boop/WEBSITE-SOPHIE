#!/bin/bash
# Start lokale site — gebruik in de browser: http://127.0.0.1:8765
cd "$(dirname "$0")"
echo "Sophie site: http://127.0.0.1:8765"
echo "Stoppen: Ctrl+C"
exec python3 -m http.server 8765 --bind 127.0.0.1
