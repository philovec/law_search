#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR
source venv/bin/activate
caffeinate python3 -u import.py 2>&1 | tee log/log_import_$(date +%Y%m%d_%H%M%S).log