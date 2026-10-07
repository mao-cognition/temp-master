#!/bin/bash

# Temp Master Dashboard Database Backup Script
# This script periodically downloads the SQLite database from the deployed backend
# for local backup purposes.
#
# Usage:
#   ./backup_database.sh                    # Run once
#   ./backup_database.sh --loop             # Run continuously every hour
#   ./backup_database.sh --loop --interval 1800  # Run every 30 minutes (1800 seconds)
#
# Configuration:
#   Set SWITCHBOT_BACKEND_URL environment variable or edit the default below
#   Set BACKUP_DIR environment variable to change the backup directory
#   BACKUP_API_KEY（必須）: バックエンドの ADMIN_API_KEY と同じ値。X-API-Key ヘッダで送信する
#     例: BACKUP_API_KEY=xxxx ./backup_database.sh

BACKEND_URL="${SWITCHBOT_BACKEND_URL:-https://temp-master.fly.dev}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/switchbot_backups}"
DEFAULT_INTERVAL=3600  # 1 hour in seconds

LOOP_MODE=false
INTERVAL=$DEFAULT_INTERVAL

while [[ $# -gt 0 ]]; do
    case $1 in
        --loop)
            LOOP_MODE=true
            shift
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        --help)
            echo "SwitchBot Dashboard Database Backup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --loop              Run continuously instead of once"
            echo "  --interval SECONDS  Interval between backups in loop mode (default: 3600)"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  SWITCHBOT_BACKEND_URL  Backend URL (default: https://temp-master.fly.dev)"
            echo "  BACKUP_DIR             Backup directory (default: ~/switchbot_backups)"
            echo "  BACKUP_API_KEY         必須。バックエンドの ADMIN_API_KEY と同じ値（X-API-Key ヘッダで送信）"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# 未設定のまま curl を実行しても 401 になるだけなので、先に止める
: "${BACKUP_API_KEY:?BACKUP_API_KEY を設定してください}"

mkdir -p "$BACKUP_DIR"

backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/switchbot_backup_${timestamp}.db"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."
    
    local http_code=$(curl -s -w "%{http_code}" -o "$backup_file" -H "X-API-Key: ${BACKUP_API_KEY:?BACKUP_API_KEY を設定してください}" "$BACKEND_URL/api/backup")
    
    if [ "$http_code" -eq 200 ]; then
        local file_size=$(ls -lh "$backup_file" | awk '{print $5}')
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup successful: $backup_file ($file_size)"
        
        # Keep only the last 30 backups to prevent disk space issues
        local backup_count=$(ls -1 "$BACKUP_DIR"/switchbot_backup_*.db 2>/dev/null | wc -l)
        if [ "$backup_count" -gt 30 ]; then
            local files_to_delete=$((backup_count - 30))
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up $files_to_delete old backup(s)..."
            ls -1t "$BACKUP_DIR"/switchbot_backup_*.db | tail -n "$files_to_delete" | xargs rm -f
        fi
        
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup failed with HTTP status: $http_code"
        rm -f "$backup_file"
        return 1
    fi
}

echo "Temp Master Dashboard Database Backup"
echo "====================================="
echo "Backend URL: $BACKEND_URL"
echo "Backup directory: $BACKUP_DIR"
echo ""

if [ "$LOOP_MODE" = true ]; then
    echo "Running in loop mode with ${INTERVAL}s interval"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        backup_database
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next backup in ${INTERVAL} seconds..."
        sleep "$INTERVAL"
    done
else
    backup_database
fi
