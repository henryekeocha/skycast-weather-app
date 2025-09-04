# SkyCast Weather Application

SkyCast is a comprehensive web-based weather application with Apple Weather-inspired design, featuring current weather conditions, 8-day forecasts, city/address search, air quality data, interactive weather maps with radar visualization, weather alerts and notifications, location history and favorites functionality, plus AI-powered weather insights and chat assistant.

## Features

- **Current Weather Conditions**: Real-time weather data with detailed metrics
- **8-Day Forecast**: Extended weather forecasts with daily summaries
- **Advanced Search**: Find weather by city name, address, ZIP code, or landmarks
- **Interactive Weather Map**: Draggable marker with radar visualization
- **Air Quality Monitoring**: Current air pollution data and health recommendations
- **Weather Alerts**: Real-time weather warnings and notifications
- **Favorites & History**: Save favorite locations with pagination support
- **AI Weather Insights**: OpenAI-powered weather analysis and recommendations
- **AI Chat Assistant**: Natural language weather queries and conversations
- **Responsive Design**: Apple Weather-inspired UI with dark/light themes

## Prerequisites

Before setting up SkyCast, ensure you have the following:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn** package manager
3. **PostgreSQL database** (local or cloud-hosted)
4. **OpenWeatherMap API Key** (free tier available)
5. **OpenAI API Key** (for AI features)

## API Keys Required

### 1. OpenWeatherMap API Key
- Sign up at [OpenWeatherMap](https://openweathermap.org/api)
- Subscribe to the "One Call API 3.0" (free tier includes 1,000 calls/day)
- Get your API key from the dashboard

### 2. OpenAI API Key
- Sign up at [OpenAI Platform](https://platform.openai.com/)
- Create an API key in your account settings
- Ensure you have credits available for API calls

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd skycast-weather-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL on your system
# Create a new database
createdb skycast_weather

# Set up your DATABASE_URL
# Format: postgresql://username:password@localhost:5432/skycast_weather
```

#### Option B: Cloud Database (Recommended)
Use services like:
- **Neon** (PostgreSQL): https://neon.tech/
- **Supabase**: https://supabase.com/
- **Railway**: https://railway.app/
- **Heroku Postgres**: https://elements.heroku.com/addons/heroku-postgresql

### 4. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name
PGHOST=your-database-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name

# API Keys
OPENWEATHER_API_KEY=your-openweathermap-api-key
OPENAI_API_KEY=your-openai-api-key

# Session Secret (generate a random string)
SESSION_SECRET=your-session-secret-key-here
```

#### Generating a Session Secret
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Database Migration
```bash
# Push the database schema
npm run db:push
```

### 6. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Project Structure

```
skycast-weather-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   └── weather/   # Weather-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and API clients
│   │   ├── pages/         # Page components
│   │   └── index.css      # Global styles and themes
├── server/                # Backend Express application
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## Configuration Details

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Key tables include:
- `users` - User information (for future authentication)
- `sessions` - Session storage
- `locations` - Weather locations
- `favorites` - User favorite locations
- `location_history` - Location search history

### API Endpoints
- **Weather Data**: `/api/weather/current`, `/api/weather/forecast`
- **Air Quality**: `/api/air-pollution/current`
- **Location Services**: `/api/cities/search`, `/api/locations/*`
- **AI Services**: `/api/ai/weather-insights`, `/api/ai/chat`

### Environment-Specific Configuration

#### Development
- Uses Vite for fast hot module replacement
- TypeScript compilation with strict mode
- Development error overlay

#### Production
- Optimized builds with code splitting
- Static asset optimization
- Environment-based configuration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your DATABASE_URL format
   - Check database server is running
   - Ensure firewall allows connections

2. **API Key Issues**
   - Verify API keys are correctly set in `.env`
   - Check API key permissions and quotas
   - Ensure OpenWeatherMap subscription includes One Call API

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all environment variables are set

4. **Database Migration Issues**
   - Run `npm run db:push --force` to force schema update
   - Check database permissions
   - Verify connection string format

### Performance Optimization

1. **API Rate Limiting**
   - OpenWeatherMap free tier: 60 calls/minute, 1,000 calls/day
   - Implement caching for frequently accessed data
   - Consider upgrading to paid tier for production

2. **Database Optimization**
   - Regular cleanup of location history
   - Index optimization for frequently queried columns
   - Connection pooling for high traffic

## Deployment

### Quick Deploy Options

1. **Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Railway**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

3. **Render**
   - Connect GitHub repository
   - Set environment variables in dashboard
   - Automatic deployments from main branch
4. **Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set OPENWEATHER_API_KEY=your-key
   heroku config:set OPENAI_API_KEY=your-key
   # Add other environment variables
   git push heroku main
   ```

### Environment Variables for Production
Ensure all environment variables are properly set in your hosting platform:
- Database connection strings
- API keys
- Session secrets
- Any platform-specific variables

## Usage

### Basic Usage
1. Open the application in your browser
2. Allow location access for automatic local weather
3. Search for cities using the search bar
4. Click on locations to view detailed weather
5. Save favorite locations for quick access
6. Use the AI chat for natural language queries

### Advanced Features
- **Interactive Map**: Drag the marker to explore weather in different areas
- **AI Insights**: Get personalized weather recommendations and analysis
- **History Management**: View and manage your location search history
- **Alerts**: Receive notifications for severe weather conditions

## API Usage Limits

### OpenWeatherMap (Free Tier)
- 60 calls per minute
- 1,000 calls per day
- Current weather, 8-day forecast, air quality, alerts

### OpenAI (Pay-per-use)
- Variable pricing based on model and tokens
- GPT-3.5-turbo recommended for cost efficiency
- Monitor usage in OpenAI dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review environment variable configuration
3. Verify API key permissions
4. Check database connectivity

## Version History

- **v1.0.0** - Initial release with core weather features
- **v1.1.0** - Added AI insights and chat functionality
- **v1.2.0** - Enhanced search with address support
- **v1.3.0** - Added interactive weather maps
- **v1.4.0** - Improved UI with Apple Weather design

---

**Note**: This application is for educational and personal use. Ensure compliance with API terms of service when deploying to production.