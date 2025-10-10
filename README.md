# YellowStone Management System

A complete full-stack management portal with React frontend and Flask backend using MySQL database.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL Server
- npm or yarn

### 1. Database Setup

First, initialize the MySQL database:

```bash
python init_database.py
```

This will create the `vendor_management` database with all necessary tables and sample data.

### 2. Backend Setup

Install Python dependencies:

```bash
pip install flask flask-cors mysql-connector-python bcrypt
```

Start the Flask backend:

```bash
python flask_backend_mysql.py
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Production:** http://localhost:8000 (serves built React app)

## 🔑 User Registration

The database is initialized empty. You can create accounts in two ways:

### 1. Web Registration (Recommended)
- Visit the login page
- Click "Create Account" 
- Choose account type (Admin, Employee, or Vendor)
- Fill in the registration form
- Account is created and stored in the database

### 2. Command Line Script (Alternative)
```bash
python create_users.py
```

This script allows you to:
- Create admin accounts
- Create employee accounts  
- Create vendor accounts
- List all users and vendors

## 📁 Project Structure

```
├── frontend/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── LoginScreen.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── EmployeeDashboard.js
│   │   │   ├── VendorPortal.js
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── api.js          # API utility functions
│   │   ├── App.js              # Main App component
│   │   ├── index.js            # React entry point
│   │   └── index.css           # Global styles
│   └── package.json
├── flask_backend_mysql.py      # Flask backend with MySQL
├── init_database.py            # Database initialization script
├── create_users.py             # User management script
└── README.md                   # This file
```

## ✨ Features

### Admin Dashboard
- **Dashboard Overview:** Stats cards, quick actions, recent activity
- **Analytics View:** Vendor status distribution, monthly trends, performance metrics
- **Vendor Management:** Search, filter, send NDAs, approve portal access
- **Forms View:** View and download submitted NDA forms

### Employee Dashboard
- **Personal Dashboard:** Task overview, workflow summary, notifications
- **My Tasks:** Filter by status, update task status, view details
- **Workflows:** Active workflows, status tracking, priority management
- **Profile:** Complete employee information display

### Vendor Portal
- **Dashboard:** NDA status, active orders, services overview
- **Services Management:** Add/manage offered services
- **Orders View:** Track assigned orders
- **NDA Status:** View NDA approval status with visual indicators

## 🎨 Design Features

- Modern gradient UI with amber/orange branding
- Smooth animations and transitions
- Responsive layout (mobile-friendly)
- Toast notifications (success, error, info, warning)
- Loading states with branded spinners
- Hover effects and interactive elements
- Custom scrollbars matching brand colors

## 🔌 API Integration

The React frontend integrates with Flask endpoints:

- `/api/auth/*` - Authentication
- `/api/admin/*` - Admin operations
- `/api/employee/*` - Employee data
- `/api/vendor/*` - Vendor portal
- `/api/dashboard/stats` - Analytics
- `/api/tasks` - Task management
- `/api/workflows` - Workflow management

## 🗄️ Database Schema

The MySQL database includes these main tables:

- `users` - User accounts (admin, employee, vendor)
- `vendors` - Vendor information and NDA status
- `tasks` - Task management
- `projects` - Project management
- `workflows` - Workflow management
- `tickets` - Support tickets
- `nda_requests` - NDA form submissions
- `notifications` - User notifications
- `employee_*` - Employee-specific data
- `service_requests` - Vendor service requests
- `reports` - System reports
- `organization` - Organization information

## 🛠️ Technical Details

- **Frontend:** React 18 with Lucide React icons and Tailwind CSS
- **Backend:** Flask with MySQL connector
- **Database:** MySQL with utf8mb4 charset
- **Authentication:** Session-based with secure cookies
- **Password Hashing:** bcrypt
- **Email:** SMTP integration for notifications

## 🌐 Development vs Production

### Development Mode
- Frontend runs on port 3000 (React dev server)
- Backend runs on port 8000 (Flask dev server)
- Hot reloading enabled
- CORS enabled for cross-origin requests

### Production Mode
- Frontend built and served by Flask on port 8000
- Single server deployment
- Optimized React build
- Static file serving

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚨 Troubleshooting

1. **Database Connection Issues:**
   - Ensure MySQL server is running
   - Check credentials in `flask_backend_mysql.py`
   - Verify database exists: `vendor_management`

2. **Port Already in Use:**
   - Frontend: Change port in `package.json` scripts
   - Backend: Change port in `flask_backend_mysql.py`

3. **CORS Errors:**
   - Backend is configured with CORS support
   - Check API base URL in `frontend/src/utils/api.js`

4. **Missing Dependencies:**
   - Run `pip install -r requirements.txt` for Python
   - Run `npm install` in frontend directory

## 🔧 Customization

### Adding New Components
1. Create component in `frontend/src/components/`
2. Import and use in `App.js` or other components
3. Follow existing component patterns

### Adding New API Endpoints
1. Add route in `flask_backend_mysql.py`
2. Update `frontend/src/utils/api.js` if needed
3. Test with frontend components

### Database Changes
1. Modify `init_database.py` for schema changes
2. Update Flask backend queries
3. Re-run database initialization

## 🎯 Next Steps

- [ ] Add more employee dashboard features
- [ ] Implement vendor service management
- [ ] Add file upload capabilities
- [ ] Implement real-time notifications
- [ ] Add advanced reporting features
- [ ] Implement role-based permissions
- [ ] Add audit logging

---

**Built with ❤️ for YellowStone XPs Management Portal**