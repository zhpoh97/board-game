#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $SERVER_PID $CLIENT_PID $TUNNEL_PID 2>/dev/null
  wait $SERVER_PID $CLIENT_PID $TUNNEL_PID 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Build shared package
echo -e "${CYAN}Building shared package...${NC}"
npm run build -w shared

# Start server
echo -e "${CYAN}Starting server on port 3001...${NC}"
npm run dev -w server &
SERVER_PID=$!

# Start client (Vite proxies /socket.io to server)
echo -e "${CYAN}Starting client on port 5173...${NC}"
npm run dev -w client &
CLIENT_PID=$!

# Wait for client to be ready
echo -e "${CYAN}Waiting for servers to start...${NC}"
for i in $(seq 1 15); do
  if curl -s -o /dev/null http://localhost:5173 2>/dev/null; then
    break
  fi
  sleep 1
done

# Start cloudflared tunnel pointing to the Vite dev server
# (Vite already proxies /socket.io to the backend)
echo -e "${CYAN}Starting Cloudflare tunnel...${NC}"
TUNNEL_LOG=$(mktemp)
cloudflared tunnel --url http://localhost:5173 --no-tls-verify 2>"$TUNNEL_LOG" &
TUNNEL_PID=$!

# Wait for tunnel URL
echo -e "${CYAN}Waiting for tunnel URL...${NC}"
TUNNEL_URL=""
for i in $(seq 1 20); do
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  sleep 1
done
rm -f "$TUNNEL_LOG"

if [ -z "$TUNNEL_URL" ]; then
  echo -e "${YELLOW}Could not detect tunnel URL. Check cloudflared output above.${NC}"
else
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  Cockroach Poker is live!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "  Local:  ${CYAN}http://localhost:5173${NC}"
  echo -e "  Public: ${CYAN}${TUNNEL_URL}${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "Share the public URL with friends to play!"
  echo -e "Press ${YELLOW}Ctrl+C${NC} to stop."
fi

# Keep running
wait
