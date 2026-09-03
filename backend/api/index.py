import sys
import os

# Add parent backend directory to sys.path for standalone serverless execution
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app

app = create_app("production")
