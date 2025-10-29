#!/bin/bash

##############################################
# Telegram Bot Deployment Script
# LuckyMart TJ Platform
##############################################

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/luckymart-tj"
LOG_DIR="$PROJECT_DIR/logs"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Telegram Bot Deployment Started${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Check Bot Token
echo -e "\n${YELLOW}[Step 1/6]${NC} Checking TELEGRAM_BOT_TOKEN..."
if [ -f "$PROJECT_DIR/.env.local" ]; then
    if grep -q "TELEGRAM_BOT_TOKEN=" "$PROJECT_DIR/.env.local"; then
        TOKEN_VALUE=$(grep "TELEGRAM_BOT_TOKEN=" "$PROJECT_DIR/.env.local" | cut -d '=' -f 2)
        if [ -z "$TOKEN_VALUE" ] || [ "$TOKEN_VALUE" = '""' ] || [ "$TOKEN_VALUE" = "''" ]; then
            echo -e "${RED}✗ TELEGRAM_BOT_TOKEN is empty${NC}"
            echo -e "${YELLOW}Please add your Bot Token to .env.local:${NC}"
            echo -e "TELEGRAM_BOT_TOKEN=your_token_here"
            exit 1
        else
            echo -e "${GREEN}✓ Bot Token found${NC}"
        fi
    else
        echo -e "${RED}✗ TELEGRAM_BOT_TOKEN not found in .env.local${NC}"
        echo -e "${YELLOW}Please add your Bot Token to .env.local:${NC}"
        echo -e "TELEGRAM_BOT_TOKEN=your_token_here"
        exit 1
    fi
else
    echo -e "${RED}✗ .env.local file not found${NC}"
    exit 1
fi

# Step 2: Verify bot files exist
echo -e "\n${YELLOW}[Step 2/6]${NC} Verifying Bot files..."
cd "$PROJECT_DIR"

if [ ! -f "bot/index.ts" ]; then
    echo -e "${RED}✗ bot/index.ts not found${NC}"
    exit 1
fi

if [ ! -f "bot/start.ts" ]; then
    echo -e "${RED}✗ bot/start.ts not found${NC}"
    exit 1
fi

if [ ! -f "ecosystem.bot.json" ]; then
    echo -e "${RED}✗ ecosystem.bot.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All Bot files present${NC}"

# Step 3: Install dependencies
echo -e "\n${YELLOW}[Step 3/6]${NC} Checking dependencies..."
if ! pnpm list telegraf > /dev/null 2>&1; then
    echo -e "${YELLOW}Installing telegraf...${NC}"
    pnpm add telegraf
    echo -e "${GREEN}✓ telegraf installed${NC}"
else
    echo -e "${GREEN}✓ telegraf already installed${NC}"
fi

if ! pnpm list ts-node > /dev/null 2>&1; then
    echo -e "${YELLOW}Installing ts-node...${NC}"
    pnpm add -D ts-node
    echo -e "${GREEN}✓ ts-node installed${NC}"
else
    echo -e "${GREEN}✓ ts-node already installed${NC}"
fi

# Step 4: Create logs directory
echo -e "\n${YELLOW}[Step 4/6]${NC} Creating logs directory..."
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✓ Logs directory ready${NC}"

# Step 5: Update PM2 ecosystem config with actual environment variables
echo -e "\n${YELLOW}[Step 5/6]${NC} Updating PM2 configuration..."
# Load environment variables from .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Update ecosystem.bot.json with actual values
cat > ecosystem.bot.json << EOF
{
  "apps": [
    {
      "name": "luckymart-bot",
      "script": "./bot/start.ts",
      "interpreter": "npx",
      "interpreter_args": "ts-node",
      "cwd": "$PROJECT_DIR",
      "instances": 1,
      "exec_mode": "fork",
      "watch": false,
      "env": {
        "NODE_ENV": "production",
        "TELEGRAM_BOT_TOKEN": "$TELEGRAM_BOT_TOKEN",
        "MINI_APP_URL": "${MINI_APP_URL:-http://47.243.83.253:3000}",
        "DATABASE_URL": "$DATABASE_URL",
        "NEXT_PUBLIC_SUPABASE_URL": "$NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
      },
      "error_file": "$LOG_DIR/bot-error.log",
      "out_file": "$LOG_DIR/bot-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "listen_timeout": 3000,
      "kill_timeout": 5000
    }
  ]
}
EOF

echo -e "${GREEN}✓ PM2 configuration updated${NC}"

# Step 6: Start Bot with PM2
echo -e "\n${YELLOW}[Step 6/6]${NC} Starting Telegram Bot..."

# Check if bot is already running
if pm2 describe luckymart-bot > /dev/null 2>&1; then
    echo -e "${YELLOW}Bot is already running, restarting...${NC}"
    pm2 delete luckymart-bot
fi

# Start bot
pm2 start ecosystem.bot.json

# Save PM2 configuration
pm2 save

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Bot Deployment Completed!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Bot Management Commands:${NC}"
echo -e "  pm2 status                  ${YELLOW}# Check bot status${NC}"
echo -e "  pm2 logs luckymart-bot      ${YELLOW}# View bot logs${NC}"
echo -e "  pm2 restart luckymart-bot   ${YELLOW}# Restart bot${NC}"
echo -e "  pm2 stop luckymart-bot      ${YELLOW}# Stop bot${NC}"
echo -e "  pm2 monit                   ${YELLOW}# Monitor bot in real-time${NC}"

echo -e "\n${BLUE}Testing Bot:${NC}"
echo -e "1. Open Telegram and search for your bot"
echo -e "2. Send ${YELLOW}/start${NC} command"
echo -e "3. You should receive a welcome message with buttons"
echo -e "4. Test other commands: ${YELLOW}/balance, /orders, /help${NC}"

echo -e "\n${BLUE}View Bot Logs:${NC}"
echo -e "  tail -f $LOG_DIR/bot-out.log"
echo -e "  tail -f $LOG_DIR/bot-error.log"

echo -e "\n${GREEN}✓ Deployment completed successfully!${NC}\n"
