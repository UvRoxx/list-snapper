#!/bin/bash

# DigitalOcean Deployment Helper Script for SnapList
# This script helps you deploy or update your SnapList app on Digital Ocean

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    print_success "git is installed"
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        print_error "node is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_success "node ${NODE_VERSION} is installed"
    
    # Check if doctl is installed
    if ! command -v doctl &> /dev/null; then
        print_warning "doctl is not installed. Install it for CLI deployment."
        print_info "Installation: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        DOCTL_AVAILABLE=false
    else
        print_success "doctl is installed"
        DOCTL_AVAILABLE=true
    fi
}

check_git_status() {
    print_header "Checking Git Status"
    
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes:"
        git status -s
        echo ""
        read -p "Do you want to commit these changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add .
            git commit -m "$commit_msg"
            print_success "Changes committed"
        else
            print_info "Continuing without committing..."
        fi
    else
        print_success "Working directory is clean"
    fi
}

push_to_github() {
    print_header "Pushing to GitHub"
    
    # Get current branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: ${BRANCH}"
    
    # Check if remote exists
    if ! git remote get-url origin &> /dev/null; then
        print_error "No git remote 'origin' found. Please add your GitHub repository first:"
        print_info "git remote add origin https://github.com/yourusername/SnapList.git"
        exit 1
    fi
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    git push origin $BRANCH
    print_success "Pushed to GitHub successfully"
}

verify_config() {
    print_header "Verifying Configuration"
    
    # Check if .do/app.yaml exists
    if [[ ! -f ".do/app.yaml" ]]; then
        print_error ".do/app.yaml not found!"
        print_info "Creating from template..."
        
        if [[ -f ".do/deploy.template.yaml" ]]; then
            cp .do/deploy.template.yaml .do/app.yaml
            print_success "Created .do/app.yaml from template"
            print_warning "Please edit .do/app.yaml and update:"
            print_info "  - GitHub repository path"
            print_info "  - Environment variables"
            print_info "  - Region settings"
            echo ""
            read -p "Press enter to continue after editing .do/app.yaml..."
        else
            print_error "Template file not found. Please ensure .do/deploy.template.yaml exists."
            exit 1
        fi
    else
        print_success ".do/app.yaml found"
    fi
    
    # Check for placeholder values
    if grep -q "YOUR_GITHUB_USERNAME" .do/app.yaml; then
        print_error "Found placeholder 'YOUR_GITHUB_USERNAME' in .do/app.yaml"
        print_info "Please update the GitHub repository path in .do/app.yaml"
        exit 1
    fi
    
    print_success "Configuration looks good"
}

test_build() {
    print_header "Testing Build"
    
    read -p "Do you want to test the build locally? (recommended) (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running build test..."
        
        # Install dependencies
        print_info "Installing dependencies..."
        npm install
        
        # Run build
        print_info "Building application..."
        npm run build
        
        print_success "Build completed successfully!"
        
        # Cleanup
        print_info "You can now deploy to Digital Ocean"
    else
        print_info "Skipping build test"
    fi
}

deploy_to_digitalocean() {
    print_header "Deploying to Digital Ocean"
    
    if [[ "$DOCTL_AVAILABLE" == false ]]; then
        print_warning "doctl is not available. Please deploy via Digital Ocean dashboard:"
        print_info "1. Go to https://cloud.digitalocean.com/apps"
        print_info "2. Click 'Create App'"
        print_info "3. Connect your GitHub repository"
        print_info "4. Configure build settings:"
        print_info "   - Build Command: npm install && npm run build"
        print_info "   - Run Command: npm start"
        print_info "   - HTTP Port: 5000"
        print_info "5. Add environment variables (see docs/DIGITAL_OCEAN_DEPLOYMENT.md)"
        print_info "6. Click 'Create Resources'"
        return
    fi
    
    # Check if authenticated
    if ! doctl auth list &> /dev/null; then
        print_error "Not authenticated with Digital Ocean"
        print_info "Run: doctl auth init"
        exit 1
    fi
    
    print_info "Checking for existing app..."
    
    # List apps to see if one exists
    APPS=$(doctl apps list --format ID,Spec.Name --no-header 2>/dev/null || echo "")
    
    if [[ -z "$APPS" ]]; then
        print_info "No existing apps found. Creating new app..."
        
        # Create new app
        print_info "Creating app from .do/app.yaml..."
        APP_ID=$(doctl apps create --spec .do/app.yaml --format ID --no-header)
        
        if [[ -n "$APP_ID" ]]; then
            print_success "App created successfully! App ID: ${APP_ID}"
            print_info "View your app: https://cloud.digitalocean.com/apps/${APP_ID}"
            
            # Monitor deployment
            print_info "Monitoring deployment (Ctrl+C to stop)..."
            sleep 5
            doctl apps logs $APP_ID --follow --type BUILD
        else
            print_error "Failed to create app"
            exit 1
        fi
    else
        print_info "Found existing apps:"
        echo "$APPS"
        echo ""
        read -p "Enter App ID to update (or press enter to create new): " APP_ID
        
        if [[ -n "$APP_ID" ]]; then
            print_info "Updating app ${APP_ID}..."
            doctl apps update $APP_ID --spec .do/app.yaml
            
            print_success "App updated successfully!"
            print_info "View your app: https://cloud.digitalocean.com/apps/${APP_ID}"
            
            # Monitor deployment
            print_info "Monitoring deployment (Ctrl+C to stop)..."
            sleep 5
            doctl apps logs $APP_ID --follow --type BUILD
        else
            print_info "Creating new app..."
            APP_ID=$(doctl apps create --spec .do/app.yaml --format ID --no-header)
            
            if [[ -n "$APP_ID" ]]; then
                print_success "App created successfully! App ID: ${APP_ID}"
                print_info "View your app: https://cloud.digitalocean.com/apps/${APP_ID}"
            else
                print_error "Failed to create app"
                exit 1
            fi
        fi
    fi
}

show_post_deployment_steps() {
    print_header "Post-Deployment Steps"
    
    print_info "1. Set Environment Variables in Digital Ocean Dashboard:"
    print_info "   - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    print_info "   - SESSION_SECRET (generate same way)"
    print_info "   - STRIPE_SECRET_KEY"
    print_info "   - STRIPE_PUBLISHABLE_KEY"
    print_info "   - And other required variables"
    echo ""
    print_info "2. Configure OAuth Redirect URIs:"
    print_info "   - Google: https://your-app.ondigitalocean.app/api/auth/google/callback"
    print_info "   - Facebook: https://your-app.ondigitalocean.app/api/auth/facebook/callback"
    echo ""
    print_info "3. Set up Stripe Webhook:"
    print_info "   - URL: https://your-app.ondigitalocean.app/api/stripe/webhook"
    echo ""
    print_info "4. Test your deployment:"
    print_info "   - Visit your app URL"
    print_info "   - Test user registration and login"
    print_info "   - Create a QR code"
    print_info "   - Test payment flow"
    echo ""
    print_success "For detailed instructions, see: docs/DIGITAL_OCEAN_DEPLOYMENT.md"
}

# Main script
main() {
    clear
    print_header "SnapList - Digital Ocean Deployment Helper"
    
    print_info "This script will help you deploy SnapList to Digital Ocean App Platform"
    echo ""
    
    # Run checks and deployment steps
    check_dependencies
    check_git_status
    verify_config
    test_build
    push_to_github
    
    echo ""
    read -p "Do you want to deploy to Digital Ocean now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_digitalocean
    else
        print_info "Skipping deployment. You can deploy manually via the Digital Ocean dashboard."
        print_info "See docs/DIGITAL_OCEAN_DEPLOYMENT.md for instructions."
    fi
    
    show_post_deployment_steps
    
    print_header "Deployment Helper Complete"
    print_success "Your SnapList app is ready for Digital Ocean!"
}

# Run main function
main

