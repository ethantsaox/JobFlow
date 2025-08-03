#!/usr/bin/env python3
"""
Day 2 Verification Script - Backend Models & Authentication
Verifies database models, authentication system, and API endpoints
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description, cwd=None, timeout=30):
    """Run a command and return success status"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True, 
            cwd=cwd, 
            timeout=timeout
        )
        if result.returncode == 0:
            print(f"✅ {description}")
            return True
        else:
            print(f"❌ {description}")
            if result.stderr.strip():
                print(f"   Error: {result.stderr.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - Timed out")
        return False
    except Exception as e:
        print(f"❌ {description} - Exception: {e}")
        return False

def check_file_exists(file_path, description):
    """Check if file exists"""
    if Path(file_path).exists():
        print(f"✅ {description}")
        return True
    else:
        print(f"❌ {description} - File missing: {file_path}")
        return False

def main():
    print("🔍 Personal Spending Assistant - Day 2 Verification")
    print("Backend Models & Authentication System")
    print("=" * 65)
    
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    
    results = []
    
    # Model Files Verification
    print("\n📦 DATABASE MODELS")
    print("-" * 20)
    
    model_files = [
        (backend_dir / "app" / "models" / "__init__.py", "Models package init"),
        (backend_dir / "app" / "models" / "user.py", "User model"),
        (backend_dir / "app" / "models" / "account.py", "Account model"),
        (backend_dir / "app" / "models" / "transaction.py", "Transaction model"),
        (backend_dir / "app" / "models" / "category.py", "Category model"),
        (backend_dir / "app" / "models" / "budget.py", "Budget model"),
    ]
    
    for file_path, description in model_files:
        results.append(check_file_exists(file_path, description))
    
    # Core System Files
    print("\n🔐 AUTHENTICATION SYSTEM")
    print("-" * 25)
    
    auth_files = [
        (backend_dir / "app" / "core" / "security.py", "Security utilities (password hashing, JWT)"),
        (backend_dir / "app" / "core" / "auth.py", "Authentication middleware"),
        (backend_dir / "app" / "schemas" / "user.py", "User schemas"),
        (backend_dir / "app" / "schemas" / "token.py", "Token schemas"),
        (backend_dir / "app" / "routers" / "auth.py", "Authentication routes"),
    ]
    
    for file_path, description in auth_files:
        results.append(check_file_exists(file_path, description))
    
    # Migration System
    print("\n🗄️  DATABASE MIGRATIONS")
    print("-" * 24)
    
    migration_files = [
        (backend_dir / "alembic.ini", "Alembic configuration"),
        (backend_dir / "alembic" / "env.py", "Alembic environment"),
        (backend_dir / "alembic" / "script.py.mako", "Migration template"),
    ]
    
    for file_path, description in migration_files:
        results.append(check_file_exists(file_path, description))
    
    # Import Tests
    print("\n🔬 IMPORT VERIFICATION")
    print("-" * 22)
    
    import_tests = [
        (
            "cd backend && source venv/bin/activate && python -c 'from app.models import User, Account, Transaction, Category, Budget; print(\"Models imported\")'",
            "Database models import"
        ),
        (
            "cd backend && source venv/bin/activate && python -c 'from app.core.security import create_access_token, get_password_hash; print(\"Security imported\")'",
            "Security utilities import"
        ),
        (
            "cd backend && source venv/bin/activate && python -c 'from app.schemas import UserCreate, Token; print(\"Schemas imported\")'",
            "API schemas import"
        ),
        (
            "cd backend && source venv/bin/activate && python -c 'from app.routers.auth import router; print(\"Auth router imported\")'",
            "Authentication router import"
        ),
    ]
    
    for cmd, description in import_tests:
        results.append(run_command(cmd, description))
    
    # FastAPI Configuration Test
    print("\n🚀 FASTAPI CONFIGURATION")
    print("-" * 25)
    
    fastapi_test = (
        "cd backend && source venv/bin/activate && python -c '"
        "from main import app; "
        "routes = [str(route.path) for route in app.routes if hasattr(route, \"path\")]; "
        "print(f\"Routes configured: {len(routes)}\"); "
        "auth_routes = [r for r in routes if \"auth\" in r]; "
        "print(f\"Auth routes: {len(auth_routes)}\")'"
    )
    
    results.append(run_command(fastapi_test, "FastAPI app configuration"))
    
    # Authentication Features Test
    print("\n🔑 AUTHENTICATION FEATURES")
    print("-" * 27)
    
    auth_features_test = (
        "cd backend && source venv/bin/activate && python -c '"
        "from app.core.security import get_password_hash, verify_password, create_access_token; "
        "hashed = get_password_hash(\"testpass\"); "
        "valid = verify_password(\"testpass\", hashed); "
        "token = create_access_token({\"sub\": \"test\"}); "
        "print(f\"Password hashing: {len(hashed) > 50}\"); "
        "print(f\"Password verification: {valid}\"); "
        "print(f\"JWT token creation: {len(token) > 100}\")'"
    )
    
    results.append(run_command(auth_features_test, "Password hashing and JWT creation"))
    
    # Summary
    print("\n📊 VERIFICATION SUMMARY")
    print("-" * 25)
    
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100
    
    print(f"Passed: {passed}/{total} tests ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("\n🎉 Day 2 verification PASSED!")
        print("✅ Database models and authentication system ready")
        print("🚀 Ready to proceed with frontend authentication (Day 3)")
        return 0
    else:
        print("\n⚠️  Day 2 verification FAILED")
        print("❌ Please fix issues before proceeding to Day 3")
        return 1

if __name__ == "__main__":
    sys.exit(main())