#!/usr/bin/env python3
"""
Complete Day 1 Setup Verification Script
Verifies all components are properly installed and configured
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, timeout=30)
        if result.returncode == 0:
            print(f"✅ {description}")
            return True
        else:
            print(f"❌ {description} - Error: {result.stderr.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - Timed out")
        return False
    except Exception as e:
        print(f"❌ {description} - Exception: {e}")
        return False

def main():
    print("🔍 Personal Spending Assistant - Day 1 Setup Verification")
    print("=" * 60)
    
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    results = []
    
    # Backend Tests
    print("\n📦 BACKEND VERIFICATION")
    print("-" * 30)
    
    # Test Python virtual environment
    venv_path = backend_dir / "venv" / "bin" / "activate"
    if venv_path.exists():
        print("✅ Python virtual environment exists")
        results.append(True)
    else:
        print("❌ Python virtual environment missing")
        results.append(False)
    
    # Test backend imports
    cmd = f"cd {backend_dir} && source venv/bin/activate && python -c 'from app.core.config import settings; from app.core.database import Base; print(\"Backend imports successful\")'"
    results.append(run_command(cmd, "Backend core imports"))
    
    # Test FastAPI dependencies
    cmd = f"cd {backend_dir} && source venv/bin/activate && python -c 'import fastapi, uvicorn, sqlalchemy, plaid, openai; print(\"FastAPI stack ready\")'"
    results.append(run_command(cmd, "FastAPI and external API dependencies"))
    
    # Frontend Tests
    print("\n🌐 FRONTEND VERIFICATION")
    print("-" * 30)
    
    # Test Node modules
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists():
        print("✅ Node.js dependencies installed")
        results.append(True)
    else:
        print("❌ Node.js dependencies missing")
        results.append(False)
    
    # Test TypeScript compilation
    cmd = f"cd {frontend_dir} && npm run build > /dev/null 2>&1"
    results.append(run_command(cmd, "TypeScript compilation", cwd=str(frontend_dir)))
    
    # Configuration Tests
    print("\n⚙️  CONFIGURATION VERIFICATION")
    print("-" * 35)
    
    env_file = project_root / ".env"
    if env_file.exists():
        print("✅ Environment configuration file exists")
        results.append(True)
    else:
        print("❌ Environment configuration file missing")
        results.append(False)
    
    docker_compose = project_root / "docker-compose.yml"
    if docker_compose.exists():
        print("✅ Docker Compose configuration exists")
        results.append(True)
    else:
        print("❌ Docker Compose configuration missing")
        results.append(False)
    
    # Summary
    print("\n📊 VERIFICATION SUMMARY")
    print("-" * 25)
    
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100
    
    print(f"Passed: {passed}/{total} tests ({success_rate:.1f}%)")
    
    if success_rate >= 85:
        print("🎉 Setup verification PASSED! Ready for Day 2 development.")
        return 0
    else:
        print("⚠️  Setup verification FAILED. Please fix issues before proceeding.")
        return 1

if __name__ == "__main__":
    sys.exit(main())