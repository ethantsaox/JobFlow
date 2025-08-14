#!/usr/bin/env python3
"""
Dependency audit script for JobFlow
Checks for security vulnerabilities and outdated packages
"""

import subprocess
import json
import os
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def audit_python_dependencies():
    """Audit Python dependencies for security issues"""
    print("🔍 Auditing Python dependencies...")
    
    backend_dir = Path(__file__).parent.parent / "backend"
    
    # Check if pip-audit is available
    success, _, _ = run_command("pip show pip-audit")
    if not success:
        print("⚠️  Installing pip-audit...")
        run_command("pip install pip-audit")
    
    # Run pip-audit
    success, output, error = run_command("pip-audit --format=json", cwd=backend_dir)
    
    if success:
        try:
            audit_results = json.loads(output)
            if audit_results.get("vulnerabilities"):
                print(f"❌ Found {len(audit_results['vulnerabilities'])} vulnerabilities:")
                for vuln in audit_results["vulnerabilities"]:
                    print(f"  - {vuln['package']} {vuln['installed_version']}: {vuln['vulnerability_id']}")
                    print(f"    {vuln['vulnerability_description']}")
                return False
            else:
                print("✅ No security vulnerabilities found in Python dependencies")
        except json.JSONDecodeError:
            print("⚠️  Could not parse pip-audit output")
    else:
        print(f"❌ pip-audit failed: {error}")
        return False
    
    # Check for outdated packages
    print("\n🔍 Checking for outdated Python packages...")
    success, output, error = run_command("pip list --outdated --format=json", cwd=backend_dir)
    
    if success:
        try:
            outdated = json.loads(output)
            if outdated:
                print(f"📦 Found {len(outdated)} outdated packages:")
                for pkg in outdated:
                    print(f"  - {pkg['name']}: {pkg['version']} → {pkg['latest_version']}")
            else:
                print("✅ All Python packages are up to date")
        except json.JSONDecodeError:
            print("⚠️  Could not parse pip list output")
    
    return True

def audit_npm_dependencies():
    """Audit npm dependencies for security issues"""
    print("\n🔍 Auditing npm dependencies...")
    
    frontend_dir = Path(__file__).parent.parent / "frontend"
    
    # Run npm audit
    success, output, error = run_command("npm audit --json", cwd=frontend_dir)
    
    try:
        audit_results = json.loads(output)
        vulnerabilities = audit_results.get("vulnerabilities", {})
        
        if vulnerabilities:
            severity_counts = {}
            for vuln_name, vuln_data in vulnerabilities.items():
                severity = vuln_data.get("severity", "unknown")
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            print(f"❌ Found vulnerabilities:")
            for severity, count in severity_counts.items():
                print(f"  - {severity}: {count}")
            
            # Try to fix automatically
            print("\n🔧 Attempting to fix vulnerabilities...")
            fix_success, fix_output, fix_error = run_command("npm audit fix", cwd=frontend_dir)
            
            if fix_success:
                print("✅ Automatic fixes applied")
            else:
                print(f"⚠️  Could not automatically fix all issues: {fix_error}")
                print("   Consider running 'npm audit fix --force' manually")
            
            return False
        else:
            print("✅ No security vulnerabilities found in npm dependencies")
    except json.JSONDecodeError:
        print("⚠️  Could not parse npm audit output")
        return False
    
    # Check for outdated packages
    print("\n🔍 Checking for outdated npm packages...")
    success, output, error = run_command("npm outdated --json", cwd=frontend_dir)
    
    if success and output:
        try:
            outdated = json.loads(output)
            if outdated:
                print(f"📦 Found {len(outdated)} outdated packages:")
                for pkg_name, pkg_data in outdated.items():
                    current = pkg_data.get("current", "unknown")
                    latest = pkg_data.get("latest", "unknown")
                    print(f"  - {pkg_name}: {current} → {latest}")
            else:
                print("✅ All npm packages are up to date")
        except json.JSONDecodeError:
            print("⚠️  Could not parse npm outdated output")
    
    return True

def check_production_dependencies():
    """Check if dev dependencies are properly separated"""
    print("\n🔍 Checking production dependency separation...")
    
    # Check Python requirements
    backend_dir = Path(__file__).parent.parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    
    if requirements_file.exists():
        with open(requirements_file) as f:
            requirements = f.read()
        
        # Check for dev-only packages in production requirements
        dev_packages = ["pytest", "factory-boy", "pytest-asyncio", "pytest-postgresql"]
        found_dev_packages = [pkg for pkg in dev_packages if pkg in requirements]
        
        if found_dev_packages:
            print(f"⚠️  Found dev packages in production requirements: {found_dev_packages}")
            print("   Consider creating requirements-dev.txt for development dependencies")
        else:
            print("✅ Python dependencies properly separated")
    
    # Check npm package.json
    frontend_dir = Path(__file__).parent.parent / "frontend"
    package_json = frontend_dir / "package.json"
    
    if package_json.exists():
        with open(package_json) as f:
            package_data = json.load(f)
        
        dependencies = package_data.get("dependencies", {})
        dev_dependencies = package_data.get("devDependencies", {})
        
        # Check if build tools are in dependencies instead of devDependencies
        build_tools = ["vite", "typescript", "eslint", "@types/", "vitest"]
        misplaced = []
        
        for dep_name in dependencies:
            if any(tool in dep_name for tool in build_tools):
                misplaced.append(dep_name)
        
        if misplaced:
            print(f"⚠️  Found build tools in production dependencies: {misplaced}")
            print("   Consider moving these to devDependencies")
        else:
            print("✅ npm dependencies properly separated")
    
    return True

def create_requirements_dev():
    """Create separate development requirements file"""
    print("\n🔧 Creating requirements-dev.txt...")
    
    backend_dir = Path(__file__).parent.parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    requirements_dev_file = backend_dir / "requirements-dev.txt"
    
    if requirements_file.exists():
        with open(requirements_file) as f:
            all_requirements = f.readlines()
        
        # Separate production and development requirements
        dev_packages = ["pytest", "factory-boy", "pytest-asyncio", "pytest-postgresql"]
        prod_requirements = []
        dev_requirements = []
        
        for req in all_requirements:
            req = req.strip()
            if any(pkg in req for pkg in dev_packages):
                dev_requirements.append(req)
            else:
                prod_requirements.append(req)
        
        # Write production requirements
        with open(requirements_file, 'w') as f:
            f.write('\n'.join(prod_requirements) + '\n')
        
        # Write development requirements
        dev_content = [
            "# Development dependencies",
            "# Install with: pip install -r requirements-dev.txt",
            "",
            "# Include production requirements",
            "-r requirements.txt",
            "",
            "# Development and testing packages"
        ] + dev_requirements
        
        with open(requirements_dev_file, 'w') as f:
            f.write('\n'.join(dev_content) + '\n')
        
        print(f"✅ Created {requirements_dev_file}")
        print(f"✅ Updated {requirements_file}")
    
    return True

def generate_security_report():
    """Generate a security report with recommendations"""
    print("\n📄 Generating security recommendations...")
    
    recommendations = [
        "🔒 Security Recommendations for Production:",
        "",
        "1. Dependencies:",
        "   - Run dependency audits regularly (weekly)",
        "   - Use dependabot or similar for automated updates",
        "   - Pin exact versions in production",
        "",
        "2. Python packages:",
        "   - Use virtual environments",
        "   - Consider using poetry or pipenv for better dependency management",
        "   - Use pip-audit in CI/CD pipeline",
        "",
        "3. npm packages:",
        "   - Use npm ci instead of npm install in production",
        "   - Enable npm audit in CI/CD pipeline",
        "   - Consider using npm shrinkwrap or package-lock.json",
        "",
        "4. General:",
        "   - Regularly update base Docker images",
        "   - Use official, minimal base images",
        "   - Scan container images for vulnerabilities",
        "",
        "5. Monitoring:",
        "   - Set up vulnerability scanning in CI/CD",
        "   - Monitor for new CVEs affecting your dependencies",
        "   - Keep a software bill of materials (SBOM)",
    ]
    
    for rec in recommendations:
        print(rec)

def main():
    """Main audit function"""
    print("🚀 Starting dependency audit for JobFlow...")
    
    success = True
    
    # Audit Python dependencies
    if not audit_python_dependencies():
        success = False
    
    # Audit npm dependencies  
    if not audit_npm_dependencies():
        success = False
    
    # Check dependency separation
    check_production_dependencies()
    
    # Create dev requirements file
    create_requirements_dev()
    
    # Generate recommendations
    generate_security_report()
    
    if success:
        print("\n✅ Dependency audit completed successfully!")
        print("   No critical security vulnerabilities found.")
    else:
        print("\n❌ Dependency audit found issues that need attention.")
        print("   Please review and fix the vulnerabilities listed above.")
        sys.exit(1)

if __name__ == "__main__":
    main()